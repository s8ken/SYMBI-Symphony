/**
 * SYMBI Agent Production Framework - Utilities
 * Convenience functions for common agent operations
 */

import { AgentFactory } from './factory';
import { SymbiAgentSDK, createAgentSDK } from './sdk';
import { AgentConfig, AgentType } from './types';

/**
 * Create a repository manager agent with default configuration
 */
export async function createRepositoryAgent(config: {
  id: string;
  name: string;
  repositoryUrl: string;
  orchestratorUrl?: string;
  apiKey?: string;
}): Promise<SymbiAgentSDK> {
  const agentConfig = AgentFactory.createRepositoryManager(
    config.id,
    config.name,
    {
      url: config.repositoryUrl,
      branch: 'main',
      accessToken: config.apiKey || '',
      webhookUrl: '',
      autoMerge: false,
      reviewRequired: true
    }
  );

  const sdkConfig = {
    orchestratorUrl: config.orchestratorUrl || 'http://localhost:3000',
    agentId: config.id,
    apiKey: config.apiKey || '',
    environment: 'development' as const
  };

  const sdk = createAgentSDK(sdkConfig);
  await sdk.registerAgent(agentConfig);
  return sdk;
}

/**
 * Create a website manager agent with default configuration
 */
export async function createWebsiteAgent(config: {
  id: string;
  name: string;
  domain: string;
  orchestratorUrl?: string;
  apiKey?: string;
}): Promise<SymbiAgentSDK> {
  const agentConfig = AgentFactory.createWebsiteManager(
    config.id,
    config.name,
    {
      domain: config.domain,
      deploymentTarget: 'production',
      buildCommand: 'npm run build',
      outputDirectory: 'dist'
    }
  );

  const sdkConfig = {
    orchestratorUrl: config.orchestratorUrl || 'http://localhost:3000',
    agentId: config.id,
    apiKey: config.apiKey || '',
    environment: 'development' as const
  };

  const sdk = createAgentSDK(sdkConfig);
  await sdk.registerAgent(agentConfig);
  return sdk;
}

/**
 * Create an integration manager agent with default configuration
 */
export async function createIntegrationAgent(config: {
  id: string;
  name: string;
  sourceSystem: string;
  targetSystem: string;
  orchestratorUrl?: string;
  apiKey?: string;
}): Promise<SymbiAgentSDK> {
  const agentConfig = AgentFactory.createIntegrationManager(
    config.id,
    config.name,
    {
      sourceSystem: config.sourceSystem,
      targetSystem: config.targetSystem,
      mappingRules: {},
      syncInterval: 300000, // 5 minutes
      bidirectional: false
    }
  );

  const sdkConfig = {
    orchestratorUrl: config.orchestratorUrl || 'http://localhost:3000',
    agentId: config.id,
    apiKey: config.apiKey || '',
    environment: 'development' as const
  };

  const sdk = createAgentSDK(sdkConfig);
  await sdk.registerAgent(agentConfig);
  return sdk;
}

/**
 * Validate agent configuration
 */
export function validateAgentConfig(config: AgentConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic validation
  if (!config.id || config.id.trim() === '') {
    errors.push('Agent ID is required');
  }

  if (!config.name || config.name.trim() === '') {
    errors.push('Agent name is required');
  }

  if (!config.type) {
    errors.push('Agent type is required');
  }

  if (!config.capabilities || config.capabilities.length === 0) {
    errors.push('Agent must have at least one capability');
  }

  if (!config.permissions || config.permissions.length === 0) {
    errors.push('Agent must have at least one permission');
  }

  // Type-specific validation based on config properties
  switch (config.type) {
    case 'repository_manager':
      if (!config.config?.repositoryUrl) {
        errors.push('Repository URL is required for repository manager agents');
      }
      break;
    
    case 'website_manager':
      if (!config.config?.domain) {
        errors.push('Domain is required for website manager agents');
      }
      break;
    
    case 'integration_manager':
      if (!config.config?.sourceSystem || !config.config?.targetSystem) {
        errors.push('Source and target systems are required for integration manager agents');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate a unique agent ID
 */
export function generateAgentId(type: AgentType, suffix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  const baseSuffix = suffix ? `-${suffix}` : '';
  return `${type}-${timestamp}-${random}${baseSuffix}`;
}

/**
 * Create agent configuration from template
 */
export function createAgentConfigFromTemplate(
  template: Partial<AgentConfig>,
  overrides: Partial<AgentConfig>
): AgentConfig {
  return {
    ...template,
    ...overrides,
    capabilities: [
      ...(template.capabilities || []),
      ...(overrides.capabilities || [])
    ],
    permissions: [
      ...(template.permissions || []),
      ...(overrides.permissions || [])
    ],
    metadata: {
      ...template.metadata,
      ...overrides.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } as AgentConfig;
}

/**
 * Check if agent has specific capability
 */
export function hasCapability(agent: AgentConfig, capabilityName: string): boolean {
  return agent.capabilities.some(cap => cap.name === capabilityName);
}

/**
 * Check if agent has specific permission
 */
export function hasPermission(agent: AgentConfig, resource: string, action: string): boolean {
  return agent.permissions.some(perm => 
    perm.resource === resource && perm.actions.includes(action)
  );
}

/**
 * Get agent capabilities by category
 */
export function getCapabilitiesByCategory(agent: AgentConfig, category: string): string[] {
  return agent.capabilities
    .filter(cap => cap.name.includes(category)) // Simple category matching by name
    .map(cap => cap.name);
}

/**
 * Format agent status for display
 */
export function formatAgentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'active': '🟢 Active',
    'idle': '🟡 Idle',
    'busy': '🔵 Busy',
    'error': '🔴 Error',
    'offline': '⚫ Offline',
    'maintenance': '🟠 Maintenance'
  };

  return statusMap[status] || `❓ ${status}`;
}

/**
 * Calculate agent uptime
 */
export function calculateUptime(createdAt: Date, lastSeen?: Date): string {
  const now = lastSeen || new Date();
  const uptimeMs = now.getTime() - createdAt.getTime();
  
  const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}