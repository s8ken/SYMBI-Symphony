/**
 * Integration tests for RBAC system
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  RBACManager,
  Role,
  Permission,
  User,
} from '../../src/core/security/rbac';

describe('RBAC System Integration Tests', () => {
  let rbacManager: RBACManager;
  let testUser: User;

  beforeEach(() => {
    rbacManager = new RBACManager();
    testUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      roles: [],
    };
  });

  describe('Role Management', () => {
    it('should get all default roles', () => {
      const roles = rbacManager.getAllRoles();
      
      expect(roles.length).toBeGreaterThan(0);
      expect(roles.some(r => r.name === Role.SUPER_ADMIN)).toBe(true);
      expect(roles.some(r => r.name === Role.ADMIN)).toBe(true);
      expect(roles.some(r => r.name === Role.VIEWER)).toBe(true);
    });

    it('should get role permissions', () => {
      const adminPermissions = rbacManager.getRolePermissions(Role.ADMIN);
      
      expect(adminPermissions).toBeInstanceOf(Array);
      expect(adminPermissions.length).toBeGreaterThan(0);
      expect(adminPermissions).toContain(Permission.AGENT_CREATE);
      expect(adminPermissions).toContain(Permission.AGENT_READ);
    });

    it('should get super admin with all permissions', () => {
      const superAdminPermissions = rbacManager.getRolePermissions(Role.SUPER_ADMIN);
      const allPermissions = Object.values(Permission);
      
      expect(superAdminPermissions.length).toBe(allPermissions.length);
    });
  });

  describe('User Permissions', () => {
    it('should get user permissions from roles', () => {
      testUser.roles = [Role.DEVELOPER];
      
      const permissions = rbacManager.getUserPermissions(testUser);
      
      expect(permissions).toBeInstanceOf(Array);
      expect(permissions).toContain(Permission.AGENT_CREATE);
      expect(permissions).toContain(Permission.AGENT_READ);
    });

    it('should combine permissions from multiple roles', () => {
      testUser.roles = [Role.DEVELOPER, Role.ANALYST];
      
      const permissions = rbacManager.getUserPermissions(testUser);
      
      expect(permissions).toContain(Permission.AGENT_CREATE); // From DEVELOPER
      expect(permissions).toContain(Permission.AUDIT_READ);   // From ANALYST
    });

    it('should include custom permissions', () => {
      testUser.roles = [Role.VIEWER];
      testUser.customPermissions = [Permission.AGENT_CREATE];
      
      const permissions = rbacManager.getUserPermissions(testUser);
      
      expect(permissions).toContain(Permission.AGENT_READ);   // From VIEWER
      expect(permissions).toContain(Permission.AGENT_CREATE); // Custom
    });
  });

  describe('Permission Checks', () => {
    it('should check if user has permission', () => {
      testUser.roles = [Role.ADMIN];
      
      expect(rbacManager.hasPermission(testUser, Permission.AGENT_CREATE)).toBe(true);
      expect(rbacManager.hasPermission(testUser, Permission.AGENT_READ)).toBe(true);
    });

    it('should check if user has all permissions', () => {
      testUser.roles = [Role.ADMIN];
      
      const result = rbacManager.hasAllPermissions(testUser, [
        Permission.AGENT_CREATE,
        Permission.AGENT_READ,
      ]);
      
      expect(result).toBe(true);
    });

    it('should check if user has any permission', () => {
      testUser.roles = [Role.VIEWER];
      
      const result = rbacManager.hasAnyPermission(testUser, [
        Permission.AGENT_CREATE,
        Permission.AGENT_READ,
      ]);
      
      expect(result).toBe(true); // Has AGENT_READ
    });

    it('should deny permission for insufficient role', () => {
      testUser.roles = [Role.VIEWER];
      
      expect(rbacManager.hasPermission(testUser, Permission.AGENT_DELETE)).toBe(false);
    });
  });

  describe('Role Checks', () => {
    it('should check if user has role', () => {
      testUser.roles = [Role.ADMIN];
      
      expect(rbacManager.hasRole(testUser, Role.ADMIN)).toBe(true);
      expect(rbacManager.hasRole(testUser, Role.VIEWER)).toBe(false);
    });

    it('should check if user has any role', () => {
      testUser.roles = [Role.DEVELOPER];
      
      const result = rbacManager.hasAnyRole(testUser, [
        Role.ADMIN,
        Role.DEVELOPER,
      ]);
      
      expect(result).toBe(true);
    });
  });

  describe('Role Assignment', () => {
    it('should grant role to user', () => {
      const updatedUser = rbacManager.grantRole(testUser, Role.ADMIN);
      
      expect(updatedUser.roles).toContain(Role.ADMIN);
      expect(rbacManager.hasRole(updatedUser, Role.ADMIN)).toBe(true);
    });

    it('should not duplicate roles', () => {
      rbacManager.grantRole(testUser, Role.ADMIN);
      rbacManager.grantRole(testUser, Role.ADMIN);
      
      const adminRoles = testUser.roles.filter(r => r === Role.ADMIN);
      expect(adminRoles.length).toBe(1);
    });

    it('should revoke role from user', () => {
      testUser.roles = [Role.ADMIN, Role.DEVELOPER];
      
      const updatedUser = rbacManager.revokeRole(testUser, Role.ADMIN);
      
      expect(updatedUser.roles).not.toContain(Role.ADMIN);
      expect(updatedUser.roles).toContain(Role.DEVELOPER);
    });
  });

  describe('Custom Permissions', () => {
    it('should grant custom permission', () => {
      const updatedUser = rbacManager.grantPermission(testUser, Permission.AGENT_CREATE);
      
      expect(updatedUser.customPermissions).toContain(Permission.AGENT_CREATE);
      expect(rbacManager.hasPermission(updatedUser, Permission.AGENT_CREATE)).toBe(true);
    });

    it('should revoke custom permission', () => {
      testUser.customPermissions = [Permission.AGENT_CREATE, Permission.AGENT_DELETE];
      
      const updatedUser = rbacManager.revokePermission(testUser, Permission.AGENT_CREATE);
      
      expect(updatedUser.customPermissions).not.toContain(Permission.AGENT_CREATE);
      expect(updatedUser.customPermissions).toContain(Permission.AGENT_DELETE);
    });
  });

  describe('User Caching', () => {
    it('should cache and retrieve user', () => {
      rbacManager.cacheUser(testUser);
      
      const cachedUser = rbacManager.getCachedUser(testUser.id);
      
      expect(cachedUser).toBeDefined();
      expect(cachedUser?.id).toBe(testUser.id);
    });

    it('should clear user cache', () => {
      rbacManager.cacheUser(testUser);
      rbacManager.clearUserCache(testUser.id);
      
      const cachedUser = rbacManager.getCachedUser(testUser.id);
      
      expect(cachedUser).toBeUndefined();
    });
  });
});