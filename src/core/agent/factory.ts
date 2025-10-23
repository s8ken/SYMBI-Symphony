/**
 * SYMBI Symphony - Agent Factory
 * Factory for creating and configuring different types of AI agents
 */

import crypto from 'crypto';
import { SymbiAgentSDK } from './sdk';
import { AgentConfig, AgentType, AgentCapability, AgentPermission, TrustArticles, TrustDeclaration } from './types';
import { trustScoring } from '../trust/scoring';
import { trustValidator } from '../trust/validator';
import { didManager } from '../trust/did';

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
        { name: 'issue_management', version: '1.0.0', description: 'Create and manage GitHub issues' }
      ],
      defaultPermissions: [
        { resource: 'repository', actions: ['read', 'write', 'admin'] },
        { resource: 'pull_requests', actions: ['read', 'write', 'review', 'merge'] },
        { resource: 'issues', actions: ['read', 'write', 'close'] },
        { resource: 'branches', actions: ['read', 'write', 'delete'] },
        { resource: 'webhooks', actions: ['read', 'write'] }
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
        { name: 'security_scanning', version: '1.0.0', description: 'Security vulnerability scanning' }
      ],
      defaultPermissions: [
        { resource: 'website', actions: ['read', 'write', 'deploy'] },
        { resource: 'content', actions: ['read', 'write', 'publish'] },
        { resource: 'analytics', actions: ['read'] },
        { resource: 'domains', actions: ['read', 'write'] },
        { resource: 'ssl_certificates', actions: ['read', 'write'] }
      ],
      requiredConfig: ['website_url', 'deployment_key']
    },

    code_reviewer: {
      type: 'code_reviewer',
      description: 'Performs automated code reviews and quality assessments',
      defaultCapabilities: [
        { name: 'static_analysis', version: '1.0.0', description: 'Static code analysis for bugs and issues' },
        { name: 'security_review', version: '1.0.0', description: 'Security vulnerability detection' },
        { name: 'performance_analysis', version: '1.0.0', description: 'Performance bottleneck identification' },
        { name: 'style_checking', version: '1.0.0', description: 'Code style and formatting validation' },
        { name: 'documentation_review', version: '1.0.0', description: 'Documentation completeness check' }
      ],
      defaultPermissions: [
        { resource: 'code', actions: ['read', 'analyze'] },
        { resource: 'pull_requests', actions: ['read', 'comment', 'review'] },
        { resource: 'commits', actions: ['read', 'analyze'] },
        { resource: 'files', actions: ['read'] }
      ],
      requiredConfig: ['repository_access']
    },

    tester: {
      type: 'tester',
      description: 'Executes automated tests and generates test reports',
      defaultCapabilities: [
        { name: 'unit_testing', version: '1.0.0', description: 'Run unit tests and generate reports' },
        { name: 'integration_testing', version: '1.0.0', description: 'Execute integration test suites' },
        { name: 'e2e_testing', version: '1.0.0', description: 'End-to-end testing automation' },
        { name: 'performance_testing', version: '1.0.0', description: 'Load and performance testing' },
        { name: 'test_generation', version: '1.0.0', description: 'Generate new test cases' }
      ],
      defaultPermissions: [
        { resource: 'tests', actions: ['read', 'write', 'execute'] },
        { resource: 'test_results', actions: ['read', 'write'] },
        { resource: 'test_environments', actions: ['read', 'write'] },
        { resource: 'coverage_reports', actions: ['read', 'write'] }
      ],
      requiredConfig: ['test_environment']
    },

    deployer: {
      type: 'deployer',
      description: 'Handles application deployments and infrastructure management',
      defaultCapabilities: [
        { name: 'ci_cd_pipeline', version: '1.0.0', description: 'Manage CI/CD pipelines' },
        { name: 'container_deployment', version: '1.0.0', description: 'Docker and container orchestration' },
        { name: 'cloud_deployment', version: '1.0.0', description: 'Deploy to cloud platforms' },
        { name: 'rollback_management', version: '1.0.0', description: 'Handle deployment rollbacks' },
        { name: 'environment_management', version: '1.0.0', description: 'Manage deployment environments' }
      ],
      defaultPermissions: [
        { resource: 'deployments', actions: ['read', 'write', 'execute'] },
        { resource: 'infrastructure', actions: ['read', 'write'] },
        { resource: 'environments', actions: ['read', 'write'] },
        { resource: 'secrets', actions: ['read'] },
        { resource: 'logs', actions: ['read'] }
      ],
      requiredConfig: ['deployment_credentials', 'target_environment']
    },

    monitor: {
      type: 'monitor',
      description: 'Monitors system health, performance, and generates alerts',
      defaultCapabilities: [
        { name: 'health_monitoring', version: '1.0.0', description: 'Monitor system and application health' },
        { name: 'performance_tracking', version: '1.0.0', description: 'Track performance metrics' },
        { name: 'log_analysis', version: '1.0.0', description: 'Analyze logs for issues and patterns' },
        { name: 'alert_management', version: '1.0.0', description: 'Generate and manage alerts' },
        { name: 'incident_response', version: '1.0.0', description: 'Automated incident response' }
      ],
      defaultPermissions: [
        { resource: 'metrics', actions: ['read'] },
        { resource: 'logs', actions: ['read'] },
        { resource: 'alerts', actions: ['read', 'write'] },
        { resource: 'dashboards', actions: ['read', 'write'] },
        { resource: 'incidents', actions: ['read', 'write'] }
      ],
      requiredConfig: ['monitoring_endpoints']
    },

    researcher: {
      type: 'researcher',
      description: 'Conducts research, gathers information, and provides insights',
      defaultCapabilities: [
        { name: 'web_research', version: '1.0.0', description: 'Search and analyze web content' },
        { name: 'data_analysis', version: '1.0.0', description: 'Analyze data and generate insights' },
        { name: 'trend_analysis', version: '1.0.0', description: 'Identify trends and patterns' },
        { name: 'report_generation', version: '1.0.0', description: 'Generate research reports' },
        { name: 'knowledge_synthesis', version: '1.0.0', description: 'Synthesize information from multiple sources' }
      ],
      defaultPermissions: [
        { resource: 'external_apis', actions: ['read'] },
        { resource: 'research_data', actions: ['read', 'write'] },
        { resource: 'reports', actions: ['read', 'write'] },
        { resource: 'knowledge_base', actions: ['read', 'write'] }
      ],
      requiredConfig: ['research_scope']
    },

    coordinator: {
      type: 'coordinator',
      description: 'Coordinates tasks and communication between multiple agents',
      defaultCapabilities: [
        { name: 'task_orchestration', version: '1.0.0', description: 'Orchestrate complex multi-agent tasks' },
        { name: 'workflow_management', version: '1.0.0', description: 'Manage agent workflows' },
        { name: 'resource_allocation', version: '1.0.0', description: 'Allocate resources between agents' },
        { name: 'conflict_resolution', version: '1.0.0', description: 'Resolve conflicts between agents' },
        { name: 'priority_management', version: '1.0.0', description: 'Manage task priorities' }
      ],
      defaultPermissions: [
        { resource: 'agents', actions: ['read', 'write', 'coordinate'] },
        { resource: 'tasks', actions: ['read', 'write', 'assign'] },
        { resource: 'workflows', actions: ['read', 'write', 'execute'] },
        { resource: 'resources', actions: ['read', 'allocate'] },
        { resource: 'system', actions: ['read', 'monitor'] }
      ],
      requiredConfig: ['coordination_scope']
    }
  };

  /**
   * Create a new agent instance with the specified configuration
   */
  static createAgent(config: AgentConfig): SymbiAgentSDK {
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid agent configuration: ${validation.errors.join(', ')}`);
    }

    return new SymbiAgentSDK(config.baseUrl || 'http://localhost:3000', config.apiKey);
  }

  /**
   * Create an agent from a template with custom overrides
   */
  static createFromTemplate(
    agentType: AgentType,
    overrides: Partial<AgentConfig> & { id: string; name: string; apiKey: string }
  ): SymbiAgentSDK {
    const template = this.templates[agentType];
    if (!template) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    const config: AgentConfig = {
      type: agentType,
      capabilities: template.defaultCapabilities,
      permissions: template.defaultPermissions,
      ...overrides
    };

    return this.createAgent(config);
  }

  /**
   * Get the template for a specific agent type
   */
  static getTemplate(agentType: AgentType): AgentTemplate {
    const template = this.templates[agentType];
    if (!template) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }
    return { ...template };
  }

  /**
   * Get all available agent templates
   */
  static getAllTemplates(): Record<AgentType, AgentTemplate> {
    return { ...this.templates };
  }

  /**
   * Validate agent configuration
   */
  static validateConfig(config: AgentConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!config.id) errors.push('Agent ID is required');
    if (!config.name) errors.push('Agent name is required');
    if (!config.type) errors.push('Agent type is required');
    if (!config.apiKey) errors.push('API key is required');

    // Type-specific validation
    const template = this.templates[config.type];
    if (!template) {
      errors.push(`Unknown agent type: ${config.type}`);
    } else {
      // Check required configuration
      for (const requiredField of template.requiredConfig) {
        if (!config.metadata || !config.metadata[requiredField]) {
          errors.push(`Required configuration missing: ${requiredField}`);
        }
      }
    }

    // Validate capabilities
    if (config.capabilities) {
      for (const capability of config.capabilities) {
        if (!capability.name || !capability.version) {
          errors.push('Capability must have name and version');
        }
      }
    }

    // Validate permissions
    if (config.permissions) {
      for (const permission of config.permissions) {
        if (!permission.resource || !permission.actions || permission.actions.length === 0) {
          errors.push('Permission must have resource and at least one action');
        }
      }
    }

    // Validate DID if present
    if (config.did) {
      const didValidation = trustValidator.validateDID(config.did);
      if (!didValidation.valid) {
        errors.push(didValidation.error!);
      }
    }

    // Validate trust declaration if present
    if (config.trustDeclaration) {
      const trustValidation = trustValidator.validateTrustDeclaration(config.trustDeclaration);
      if (!trustValidation.valid) {
        errors.push(...trustValidation.errors);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create trust declaration for an agent
   */
  static createTrustDeclaration(
    agentId: string,
    agentName: string,
    trustArticles: TrustArticles
  ): TrustDeclaration {
    // Validate trust articles
    const validation = trustValidator.validateTrustArticles(trustArticles);
    if (!validation.valid) {
      throw new Error(`Invalid trust articles: ${validation.errors.join(', ')}`);
    }

    // Calculate scores
    const scoringResult = trustScoring.calculateScores(trustArticles);

    return {
      agent_id: agentId,
      agent_name: agentName,
      declaration_date: new Date(),
      trust_articles: trustArticles,
      scores: {
        compliance_score: scoringResult.compliance_score,
        guilt_score: scoringResult.guilt_score,
        last_validated: new Date()
      }
    };
  }

  /**
   * Generate DID for an agent
   */
  static generateDID(agentId: string, method: 'web' | 'key' | 'ethr' | 'ion' = 'web'): string {
    return didManager.generateDID(agentId, { method });
  }

  /**
   * Convenience methods for creating specific agent types
   */
  static createRepositoryManager(config: {
    id: string;
    name: string;
    apiKey: string;
    repositoryUrl: string;
    accessToken: string;
    webhookUrl?: string;
    baseUrl?: string;
  }): SymbiAgentSDK {
    return this.createFromTemplate('repository_manager', {
      ...config,
      metadata: {
        repository_url: config.repositoryUrl,
        access_token: config.accessToken
      }
    });
  }

  static createWebsiteManager(config: {
    id: string;
    name: string;
    apiKey: string;
    websiteUrl: string;
    deploymentKey: string;
    webhookUrl?: string;
    baseUrl?: string;
  }): SymbiAgentSDK {
    return this.createFromTemplate('website_manager', {
      ...config,
      metadata: {
        website_url: config.websiteUrl,
        deployment_key: config.deploymentKey
      }
    });
  }

  static createCodeReviewer(config: {
    id: string;
    name: string;
    apiKey: string;
    repositoryAccess: string[];
    webhookUrl?: string;
    baseUrl?: string;
  }): SymbiAgentSDK {
    return this.createFromTemplate('code_reviewer', {
      ...config,
      metadata: {
        repository_access: config.repositoryAccess
      }
    });
  }

  static createTester(config: {
    id: string;
    name: string;
    apiKey: string;
    testEnvironment: string;
    webhookUrl?: string;
    baseUrl?: string;
  }): SymbiAgentSDK {
    return this.createFromTemplate('tester', {
      ...config,
      metadata: {
        test_environment: config.testEnvironment
      }
    });
  }

  static createDeployer(config: {
    id: string;
    name: string;
    apiKey: string;
    deploymentCredentials: Record<string, string>;
    targetEnvironment: string;
    webhookUrl?: string;
    baseUrl?: string;
  }): SymbiAgentSDK {
    return this.createFromTemplate('deployer', {
      ...config,
      metadata: {
        deployment_credentials: config.deploymentCredentials,
        target_environment: config.targetEnvironment
      }
    });
  }

  static createMonitor(config: {
    id: string;
    name: string;
    apiKey: string;
    monitoringEndpoints: string[];
    webhookUrl?: string;
    baseUrl?: string;
  }): SymbiAgentSDK {
    return this.createFromTemplate('monitor', {
      ...config,
      metadata: {
        monitoring_endpoints: config.monitoringEndpoints
      }
    });
  }

  static createResearcher(config: {
    id: string;
    name: string;
    apiKey: string;
    researchScope: string[];
    webhookUrl?: string;
    baseUrl?: string;
  }): SymbiAgentSDK {
    return this.createFromTemplate('researcher', {
      ...config,
      metadata: {
        research_scope: config.researchScope
      }
    });
  }

  static createCoordinator(config: {
    id: string;
    name: string;
    apiKey: string;
    coordinationScope: string[];
    webhookUrl?: string;
    baseUrl?: string;
  }): SymbiAgentSDK {
    return this.createFromTemplate('coordinator', {
      ...config,
      metadata: {
        coordination_scope: config.coordinationScope
      }
    });
  }

  /**
   * Generate a unique agent ID
   */
  static generateAgentId(type: AgentType, suffix?: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const id = `${type}_${timestamp}_${random}`;
    return suffix ? `${id}_${suffix}` : id;
  }

  /**
   * Generate a cryptographically secure API key
   *
   * SECURITY: Uses crypto.randomBytes() for cryptographically secure random generation.
   * Never use Math.random() for security-critical operations like API key generation.
   */
  static generateApiKey(): string {
    // Generate 48 bytes of cryptographically secure random data
    // This provides 384 bits of entropy (recommended: 256+ bits for API keys)
    const randomBytes = crypto.randomBytes(48);

    // Encode as base64url (URL-safe, no padding)
    // Results in a 64-character string
    return randomBytes.toString('base64url');
  }
}

export default AgentFactory;