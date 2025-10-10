/**
 * Authorizer - SYMBI Symphony
 * 
 * Authorization service for the SYMBI AI Agent ecosystem.
 * Provides role-based access control, permission management, and resource-level security.
 */

import {
  Role,
  Permission,
  RoleDefinition,
  AgentPermissions,
  AuthContext,
  AuthorizationError,
  AuditLog
} from './types';

export class Authorizer {
  private roleDefinitions: Map<Role, RoleDefinition> = new Map();
  private agentPermissions: Map<string, AgentPermissions> = new Map();
  private auditLogs: AuditLog[] = [];

  constructor() {
    this.initializeDefaultRoles();
  }

  /**
   * Initialize default role definitions
   */
  private initializeDefaultRoles(): void {
    const roles: RoleDefinition[] = [
      {
        name: 'super_admin',
        description: 'Full system access with all permissions',
        permissions: [
          'read:agents', 'write:agents', 'delete:agents',
          'read:tasks', 'write:tasks', 'execute:tasks',
          'read:repositories', 'write:repositories',
          'deploy:applications',
          'read:metrics', 'write:metrics',
          'admin:system', 'admin:users', 'admin:agents'
        ]
      },
      {
        name: 'admin',
        description: 'Administrative access with most permissions',
        permissions: [
          'read:agents', 'write:agents',
          'read:tasks', 'write:tasks', 'execute:tasks',
          'read:repositories', 'write:repositories',
          'deploy:applications',
          'read:metrics', 'write:metrics',
          'admin:users', 'admin:agents'
        ]
      },
      {
        name: 'agent_manager',
        description: 'Manage agents and their tasks',
        permissions: [
          'read:agents', 'write:agents',
          'read:tasks', 'write:tasks', 'execute:tasks',
          'read:repositories',
          'read:metrics'
        ]
      },
      {
        name: 'developer',
        description: 'Development and deployment access',
        permissions: [
          'read:agents',
          'read:tasks', 'write:tasks',
          'read:repositories', 'write:repositories',
          'deploy:applications',
          'read:metrics'
        ]
      },
      {
        name: 'viewer',
        description: 'Read-only access to most resources',
        permissions: [
          'read:agents',
          'read:tasks',
          'read:repositories',
          'read:metrics'
        ]
      },
      {
        name: 'agent',
        description: 'Basic agent permissions for task execution',
        permissions: [
          'read:tasks', 'execute:tasks',
          'read:repositories',
          'read:metrics'
        ]
      },
      {
        name: 'service_account',
        description: 'Service account with limited permissions',
        permissions: [
          'read:tasks',
          'read:repositories',
          'read:metrics'
        ]
      }
    ];

    roles.forEach(role => {
      this.roleDefinitions.set(role.name, role);
    });
  }

  /**
   * Check if user has permission for a specific action
   */
  async hasPermission(
    context: AuthContext,
    permission: Permission,
    resource?: {
      type: 'agent' | 'task' | 'repository';
      id: string;
    }
  ): Promise<boolean> {
    try {
      // Check direct permissions
      if (context.permissions.includes(permission)) {
        return await this.checkResourceAccess(context, resource);
      }

      // Check role-based permissions
      for (const role of context.roles) {
        const roleDefinition = this.roleDefinitions.get(role);
        if (roleDefinition?.permissions.includes(permission)) {
          return await this.checkResourceAccess(context, resource);
        }
      }

      return false;
    } catch (error) {
      await this.logAuditEvent(context, 'permission_check', 'failure', {
        permission,
        resource,
        error: (error as Error).message
      });
      return false;
    }
  }

  /**
   * Require permission or throw authorization error
   */
  async requirePermission(
    context: AuthContext,
    permission: Permission,
    resource?: {
      type: 'agent' | 'task' | 'repository';
      id: string;
    }
  ): Promise<void> {
    const hasAccess = await this.hasPermission(context, permission, resource);
    
    if (!hasAccess) {
      await this.logAuditEvent(context, 'permission_denied', 'failure', {
        permission,
        resource
      });
      
      throw new AuthorizationError(
        `Permission denied: ${permission}`,
        'PERMISSION_DENIED',
        403,
        permission,
        { resource }
      );
    }

    await this.logAuditEvent(context, 'permission_granted', 'success', {
      permission,
      resource
    });
  }

  /**
   * Assign role to agent
   */
  async assignRole(agentId: string, role: Role): Promise<void> {
    let permissions = this.agentPermissions.get(agentId);
    if (!permissions) {
      permissions = this.createDefaultPermissions(agentId);
    }

    if (!permissions.roles.includes(role)) {
      permissions.roles.push(role);
      this.agentPermissions.set(agentId, permissions);
    }
  }

  /**
   * Remove role from agent
   */
  async removeRole(agentId: string, role: Role): Promise<void> {
    const permissions = this.agentPermissions.get(agentId);
    if (permissions) {
      permissions.roles = permissions.roles.filter(r => r !== role);
    }
  }

  /**
   * Create auth context for agent
   */
  createAuthContext(agentId: string, baseContext?: Partial<AuthContext>): AuthContext {
    const permissions = this.agentPermissions.get(agentId) || this.createDefaultPermissions(agentId);
    
    return {
      agentId,
      sessionId: baseContext?.sessionId || 'default-session',
      roles: permissions.roles,
      permissions: this.getEffectivePermissions(agentId),
      resourceAccess: permissions.resourceAccess,
      metadata: permissions.metadata,
      createdAt: baseContext?.createdAt || new Date(),
      expiresAt: baseContext?.expiresAt || new Date(Date.now() + 3600000) // 1 hour
    };
  }

  /**
   * Check resource access
   */
  private async checkResourceAccess(
    context: AuthContext,
    resource?: {
      type: 'agent' | 'task' | 'repository';
      id: string;
    }
  ): Promise<boolean> {
    if (!resource) {
      return true; // No resource restriction
    }

    const resourceAccess = context.resourceAccess;
    
    switch (resource.type) {
      case 'repository':
        return resourceAccess.repositories.length === 0 || resourceAccess.repositories.includes(resource.id);
      case 'task':
        return resourceAccess.tasks.length === 0 || resourceAccess.tasks.includes(resource.id);
      case 'agent':
        return resourceAccess.agents.length === 0 || resourceAccess.agents.includes(resource.id);
      default:
        return false;
    }
  }

  /**
   * Get effective permissions for agent
   */
  getEffectivePermissions(agentId: string): Permission[] {
    const agentPerms = this.agentPermissions.get(agentId);
    if (!agentPerms) {
      return [];
    }

    const permissions = new Set<Permission>(agentPerms.permissions);

    // Add role-based permissions
    for (const role of agentPerms.roles) {
      const roleDefinition = this.roleDefinitions.get(role);
      if (roleDefinition) {
        roleDefinition.permissions.forEach(perm => permissions.add(perm));
      }
    }

    return Array.from(permissions);
  }

  /**
   * Create default permissions for agent
   */
  private createDefaultPermissions(agentId: string): AgentPermissions {
    const permissions: AgentPermissions = {
      agentId,
      roles: ['agent'],
      permissions: [],
      resourceAccess: {
        repositories: [],
        tasks: [],
        agents: []
      },
      restrictions: {},
      metadata: {}
    };

    this.agentPermissions.set(agentId, permissions);
    return permissions;
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    context: AuthContext,
    action: string,
    result: 'success' | 'failure' | 'partial',
    details: Record<string, any>
  ): Promise<void> {
    const auditLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      agentId: context.agentId,
      action,
      result,
      details,
      ipAddress: '127.0.0.1', // Would be extracted from request
      userAgent: 'SYMBI Agent' // Would be extracted from request
    };

    this.auditLogs.push(auditLog);

    // Keep only last 1000 logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }
  }

  /**
   * Get audit logs
   */
  getAuditLogs(filter?: {
    agentId?: string;
    action?: string;
    result?: 'success' | 'failure' | 'partial';
    since?: Date;
  }): AuditLog[] {
    let logs = this.auditLogs;

    if (filter) {
      logs = logs.filter(log => {
        if (filter.agentId && log.agentId !== filter.agentId) return false;
        if (filter.action && log.action !== filter.action) return false;
        if (filter.result && log.result !== filter.result) return false;
        if (filter.since && log.timestamp < filter.since) return false;
        return true;
      });
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get role definition
   */
  getRoleDefinition(roleName: Role): RoleDefinition | undefined {
    return this.roleDefinitions.get(roleName);
  }

  /**
   * Get all roles
   */
  getAllRoles(): RoleDefinition[] {
    return Array.from(this.roleDefinitions.values());
  }
}

export const authorizer = new Authorizer();