/**
 * SYMBI Agent Production Framework - Agent Factory
 * Factory for creating and configuring different types of AI agents
 */

import { SymbiAgentSDK, createAgentSDK, SymbiAgentSDKConfig } from './sdk';
import { 
  AgentConfig, 
  AgentType, 
  AgentCapability, 
  AgentPermission,
  RepositoryConfig,
  WebsiteConfig,
  IntegrationConfig
} from './types';

export interface AgentTemplate {
  type: AgentType;
  defaultCapabilities: AgentCapability[];
  defaultPermissions: AgentPermission[];
  requiredConfig: string[];
  description: string;
}

export class AgentFactory {
  private static templates: Record<AgentType, AgentTemplate> = {
    repository_manager: {
      type: 'repository_manager',
      description: 'Manages Git repositories, handles code reviews, merges, and repository maintenance',
      defaultCapabilities: [
        { name: 'git_operations', version: '1.0.0', description: 'Git clone, pull, push, merge operations' },
        { name: 'code_analysis', version: '1.0.0', description: 'Static code analysis and quality checks' },
        { name: 'branch_management', version: '1.0.0', description: 'Create, delete, and manage branches' },
        { name: 'pull_request_review', version: '1.0.0', description: 'Review and approve pull requests' },
        { name: 'issue_management', version: '1.0.0', description: 'Create and manage GitHub issues' },
        { name: 'dependency_scanning', version: '1.0.0', description: 'Scan for security vulnerabilities in dependencies' },
        { name: 'automated_testing', version: '1.0.0', description: 'Run automated tests and CI/CD pipelines' }
      ],
      defaultPermissions: [
        { resource: 'repository', actions: ['read', 'write', 'admin'] },
        { resource: 'pull_requests', actions: ['read', 'write', 'review', 'merge'] },
        { resource: 'issues', actions: ['read', 'write', 'close'] },
        { resource: 'branches', actions: ['read', 'write', 'delete'] },
        { resource: 'webhooks', actions: ['read', 'write'] },
        { resource: 'actions', actions: ['read', 'write', 'trigger'] }
      ],
      requiredConfig: ['repository_url', 'access_token']
    },

    website_manager: {
      type: 'website_manager',
      description: 'Manages website deployments, monitoring, and content updates',
      defaultCapabilities: [
        { name: 'deployment', version: '1.0.0', description: 'Deploy websites to various platforms' },
        { name: 'content_management', version: '1.0.0', description: 'Update website content and assets' },
        { name: 'performance_monitoring', version: '1.0.0', description: 'Monitor website performance and uptime' },
        { name: 'seo_optimization', version: '1.0.0', description: 'SEO analysis and optimization' },
        { name: 'security_scanning', version: '1.0.0', description: 'Security vulnerability scanning' },
        { name: 'cdn_management', version: '1.0.0', description: 'Manage CDN configurations and cache' },
        { name: 'ssl_management', version: '1.0.0', description: 'Manage SSL certificates and HTTPS' }
      ],
      defaultPermissions: [
        { resource: 'website', actions: ['read', 'write', 'deploy'] },
        { resource: 'dns', actions: ['read', 'write'] },
        { resource: 'ssl_certificates', actions: ['read', 'write', 'renew'] },
        { resource: 'cdn', actions: ['read', 'write', 'purge'] },
        { resource: 'analytics', actions: ['read'] },
        { resource: 'monitoring', actions: ['read', 'write'] }
      ],
      requiredConfig: ['domain', 'deployment_target', 'api_key']
    },

    integration_manager: {
      type: 'integration_manager',
      description: 'Manages integrations between different systems and services',
      defaultCapabilities: [
        { name: 'api_integration', version: '1.0.0', description: 'Integrate with external APIs' },
        { name: 'data_transformation', version: '1.0.0', description: 'Transform data between different formats' },
        { name: 'webhook_management', version: '1.0.0', description: 'Manage webhooks and event handling' },
        { name: 'sync_operations', version: '1.0.0', description: 'Synchronize data between systems' },
        { name: 'error_handling', version: '1.0.0', description: 'Handle integration errors and retries' },
        { name: 'rate_limiting', version: '1.0.0', description: 'Manage API rate limits and throttling' }
      ],
      defaultPermissions: [
        { resource: 'external_apis', actions: ['read', 'write'] },
        { resource: 'webhooks', actions: ['read', 'write', 'manage'] },
        { resource: 'data_stores', actions: ['read', 'write'] },
        { resource: 'message_queues', actions: ['read', 'write', 'publish'] },
        { resource: 'logs', actions: ['read', 'write'] }
      ],
      requiredConfig: ['source_system', 'target_system', 'api_credentials']
    },

    orchestrator: {
      type: 'orchestrator',
      description: 'Orchestrates and coordinates multiple agents in the ecosystem',
      defaultCapabilities: [
        { name: 'agent_management', version: '1.0.0', description: 'Register, monitor, and manage agents' },
        { name: 'task_distribution', version: '1.0.0', description: 'Distribute tasks among available agents' },
        { name: 'load_balancing', version: '1.0.0', description: 'Balance workload across agents' },
        { name: 'health_monitoring', version: '1.0.0', description: 'Monitor agent health and performance' },
        { name: 'communication_routing', version: '1.0.0', description: 'Route messages between agents' },
        { name: 'policy_enforcement', version: '1.0.0', description: 'Enforce security and operational policies' }
      ],
      defaultPermissions: [
        { resource: 'agents', actions: ['read', 'write', 'manage', 'monitor'] },
        { resource: 'tasks', actions: ['read', 'write', 'assign', 'monitor'] },
        { resource: 'messages', actions: ['read', 'write', 'route'] },
        { resource: 'policies', actions: ['read', 'write', 'enforce'] },
        { resource: 'metrics', actions: ['read', 'write', 'aggregate'] }
      ],
      requiredConfig: ['orchestrator_id', 'database_url', 'message_broker_url']
    },

    monitoring_agent: {
      type: 'monitoring_agent',
      description: 'Monitors system health, performance, and security across the ecosystem',
      defaultCapabilities: [
        { name: 'system_monitoring', version: '1.0.0', description: 'Monitor system resources and performance' },
        { name: 'log_analysis', version: '1.0.0', description: 'Analyze logs for patterns and anomalies' },
        { name: 'alerting', version: '1.0.0', description: 'Generate alerts based on thresholds and rules' },
        { name: 'metrics_collection', version: '1.0.0', description: 'Collect and aggregate metrics' },
        { name: 'dashboard_management', version: '1.0.0', description: 'Manage monitoring dashboards' },
        { name: 'incident_response', version: '1.0.0', description: 'Respond to incidents and escalate as needed' }
      ],
      defaultPermissions: [
        { resource: 'system_metrics', actions: ['read', 'collect'] },
        { resource: 'logs', actions: ['read', 'analyze'] },
        { resource: 'alerts', actions: ['read', 'write', 'send'] },
        { resource: 'dashboards', actions: ['read', 'write', 'manage'] },
        { resource: 'incidents', actions: ['read', 'write', 'escalate'] }
      ],
      requiredConfig: ['monitoring_targets', 'alert_channels']
    },

    security_agent: {
      type: 'security_agent',
      description: 'Handles security scanning, threat detection, and compliance monitoring',
      defaultCapabilities: [
        { name: 'vulnerability_scanning', version: '1.0.0', description: 'Scan for security vulnerabilities' },
        { name: 'threat_detection', version: '1.0.0', description: 'Detect security threats and anomalies' },
        { name: 'compliance_monitoring', version: '1.0.0', description: 'Monitor compliance with security policies' },
        { name: 'access_control', version: '1.0.0', description: 'Manage access controls and permissions' },
        { name: 'audit_logging', version: '1.0.0', description: 'Log security events for audit purposes' },
        { name: 'incident_response', version: '1.0.0', description: 'Respond to security incidents' }
      ],
      defaultPermissions: [
        { resource: 'security_scans', actions: ['read', 'write', 'execute'] },
        { resource: 'access_logs', actions: ['read', 'analyze'] },
        { resource: 'security_policies', actions: ['read', 'enforce'] },
        { resource: 'audit_logs', actions: ['read', 'write'] },
        { resource: 'incidents', actions: ['read', 'write', 'respond'] }
      ],
      requiredConfig: ['security_policies', 'scan_targets']
    }
  };

  /**
   * Create an agent configuration from a template
   */
  static createFromTemplate(
    type: AgentType,
    agentId: string,
    name: string,
    customConfig?: Partial<AgentConfig>
  ): AgentConfig {
    const template = this.templates[type];
    if (!template) {
      throw new Error(`Unknown agent type: ${type}`);
    }

    const baseConfig: AgentConfig = {
      id: agentId,
      name,
      type,
      status: 'initializing',
      capabilities: [...template.defaultCapabilities],
      permissions: [...template.defaultPermissions],
      config: {
        maxConcurrentTasks: 5,
        timeout: 300000, // 5 minutes
        retryAttempts: 3,
        heartbeatInterval: 30000, // 30 seconds
        logLevel: 'info'
      },
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        lastUpdated: new Date(),
        owner: 'system',
        environment: 'production'
      }
    };

    // Merge with custom configuration
    if (customConfig) {
      return {
        ...baseConfig,
        ...customConfig,
        capabilities: customConfig.capabilities || baseConfig.capabilities,
        permissions: customConfig.permissions || baseConfig.permissions,
        config: { ...baseConfig.config, ...customConfig.config },
        metadata: { ...baseConfig.metadata, ...customConfig.metadata }
      };
    }

    return baseConfig;
  }

  /**
   * Create a repository manager agent
   */
  static createRepositoryManager(
    agentId: string,
    name: string,
    repositoryConfig: RepositoryConfig,
    customConfig?: Partial<AgentConfig>
  ): AgentConfig {
    const config = this.createFromTemplate('repository_manager', agentId, name, customConfig);
    
    // Add repository-specific configuration
    config.config = {
      ...config.config,
      repositoryUrl: repositoryConfig.url,
      branch: repositoryConfig.branch,
      accessToken: repositoryConfig.accessToken,
      webhookUrl: repositoryConfig.webhookUrl,
      autoMerge: repositoryConfig.autoMerge || false,
      reviewRequired: repositoryConfig.reviewRequired || true
    };

    return config;
  }

  /**
   * Create a website manager agent
   */
  static createWebsiteManager(
    agentId: string,
    name: string,
    websiteConfig: WebsiteConfig,
    customConfig?: Partial<AgentConfig>
  ): AgentConfig {
    const config = this.createFromTemplate('website_manager', agentId, name, customConfig);
    
    // Add website-specific configuration
    config.config = {
      ...config.config,
      domain: websiteConfig.domain,
      deploymentTarget: websiteConfig.deploymentTarget,
      buildCommand: websiteConfig.buildCommand,
      outputDirectory: websiteConfig.outputDirectory,
      environmentVariables: websiteConfig.environmentVariables || {}
    };

    return config;
  }

  /**
   * Create an integration manager agent
   */
  static createIntegrationManager(
    agentId: string,
    name: string,
    integrationConfig: IntegrationConfig,
    customConfig?: Partial<AgentConfig>
  ): AgentConfig {
    const config = this.createFromTemplate('integration_manager', agentId, name, customConfig);
    
    // Add integration-specific configuration
    config.config = {
      ...config.config,
      sourceSystem: integrationConfig.sourceSystem,
      targetSystem: integrationConfig.targetSystem,
      mappingRules: integrationConfig.mappingRules,
      syncInterval: integrationConfig.syncInterval || 300000, // 5 minutes
      bidirectional: integrationConfig.bidirectional || false
    };

    return config;
  }

  /**
   * Create an agent SDK instance
   */
  static createAgentSDK(config: SymbiAgentSDKConfig): SymbiAgentSDK {
    return createAgentSDK(config);
  }

  /**
   * Get available agent templates
   */
  static getAvailableTemplates(): Record<AgentType, AgentTemplate> {
    return { ...this.templates };
  }

  /**
   * Get template for a specific agent type
   */
  static getTemplate(type: AgentType): AgentTemplate | undefined {
    return this.templates[type];
  }

  /**
   * Validate agent configuration
   */
  static validateConfig(config: AgentConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const template = this.templates[config.type];

    if (!template) {
      errors.push(`Unknown agent type: ${config.type}`);
      return { valid: false, errors };
    }

    // Check required configuration
    for (const requiredField of template.requiredConfig) {
      if (!config.config || !(requiredField in config.config)) {
        errors.push(`Missing required configuration field: ${requiredField}`);
      }
    }

    // Validate capabilities
    if (!config.capabilities || config.capabilities.length === 0) {
      errors.push('Agent must have at least one capability');
    }

    // Validate permissions
    if (!config.permissions || config.permissions.length === 0) {
      errors.push('Agent must have at least one permission');
    }

    // Validate metadata
    if (!config.metadata) {
      errors.push('Agent metadata is required');
    } else {
      if (!config.metadata.version) {
        errors.push('Agent version is required');
      }
      if (!config.metadata.owner) {
        errors.push('Agent owner is required');
      }
    }

    return { valid: errors.length === 0, errors };
  }
}