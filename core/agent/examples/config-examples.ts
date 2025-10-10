/**
 * Configuration Examples
 * 
 * This file contains various configuration examples for different agent types
 * and deployment scenarios.
 */

import type { 
  RepositoryConfig, 
  WebsiteConfig, 
  IntegrationConfig, 
  AgentConfig 
} from '../types';
import type { SymbiAgentSDKConfig } from '../sdk';

/**
 * Repository Configuration Examples
 */
export const repositoryConfigs = {
  // Basic GitHub repository
  githubBasic: {
    url: 'https://github.com/your-org/your-repo',
    branch: 'main',
    accessToken: process.env.GITHUB_TOKEN || 'ghp_your_token_here',
    webhookUrl: 'https://your-domain.com/webhooks/github',
    autoMerge: false,
    reviewRequired: true
  } as RepositoryConfig,

  // GitLab repository with auto-merge
  gitlabAutoMerge: {
    url: 'https://gitlab.com/your-org/your-repo',
    branch: 'develop',
    accessToken: process.env.GITLAB_TOKEN || 'glpat-your_token_here',
    webhookUrl: 'https://your-domain.com/webhooks/gitlab',
    autoMerge: true,
    reviewRequired: false
  } as RepositoryConfig,

  // Bitbucket repository
  bitbucket: {
    url: 'https://bitbucket.org/your-org/your-repo',
    branch: 'master',
    accessToken: process.env.BITBUCKET_TOKEN || 'your_app_password',
    webhookUrl: 'https://your-domain.com/webhooks/bitbucket',
    autoMerge: false,
    reviewRequired: true
  } as RepositoryConfig
};

/**
 * Website Configuration Examples
 */
export const websiteConfigs = {
  // React application
  reactApp: {
    domain: 'my-react-app.com',
    deploymentTarget: 'vercel',
    buildCommand: 'npm run build',
    outputDirectory: 'build',
    environmentVariables: {
      REACT_APP_API_URL: 'https://api.my-react-app.com',
      REACT_APP_ENV: 'production'
    }
  } as WebsiteConfig,

  // Next.js application
  nextjsApp: {
    domain: 'my-nextjs-app.com',
    deploymentTarget: 'vercel',
    buildCommand: 'npm run build',
    outputDirectory: '.next',
    environmentVariables: {
      NEXT_PUBLIC_API_URL: 'https://api.my-nextjs-app.com',
      DATABASE_URL: 'postgresql://user:pass@host:5432/db'
    }
  } as WebsiteConfig,

  // Static site
  staticSite: {
    domain: 'my-static-site.com',
    deploymentTarget: 'netlify',
    buildCommand: 'npm run build:static',
    outputDirectory: 'dist',
    environmentVariables: {
      NODE_ENV: 'production'
    }
  } as WebsiteConfig,

  // Vue.js application
  vueApp: {
    domain: 'my-vue-app.com',
    deploymentTarget: 'aws-s3',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    environmentVariables: {
      VUE_APP_API_URL: 'https://api.my-vue-app.com',
      VUE_APP_TITLE: 'My Vue App'
    }
  } as WebsiteConfig
};

/**
 * Integration Configuration Examples
 */
export const integrationConfigs = {
  // CRM to ERP integration
  crmToErp: {
    sourceSystem: 'Salesforce',
    targetSystem: 'SAP',
    mappingRules: {
      'Account.Id': 'Customer.CustomerNumber',
      'Account.Name': 'Customer.CompanyName',
      'Account.BillingAddress': 'Customer.Address',
      'Contact.Email': 'Customer.PrimaryEmail',
      'Contact.Phone': 'Customer.PrimaryPhone',
      'Opportunity.Amount': 'Deal.Value',
      'Opportunity.CloseDate': 'Deal.ExpectedCloseDate'
    },
    syncInterval: 600000, // 10 minutes
    bidirectional: false
  } as IntegrationConfig,

  // E-commerce to inventory
  ecommerceInventory: {
    sourceSystem: 'Shopify',
    targetSystem: 'NetSuite',
    mappingRules: {
      'product.id': 'item.internalId',
      'product.title': 'item.displayName',
      'product.handle': 'item.itemId',
      'variant.sku': 'item.upcCode',
      'variant.inventory_quantity': 'item.quantityAvailable',
      'variant.price': 'item.basePrice'
    },
    syncInterval: 300000, // 5 minutes
    bidirectional: true
  } as IntegrationConfig,

  // HR to payroll
  hrToPayroll: {
    sourceSystem: 'BambooHR',
    targetSystem: 'ADP',
    mappingRules: {
      'employee.id': 'worker.associateOID',
      'employee.firstName': 'worker.person.legalName.givenName',
      'employee.lastName': 'worker.person.legalName.familyName',
      'employee.email': 'worker.person.communication.email.emailUri',
      'employee.department': 'worker.workAssignment.organizationUnit.nameCode.shortName',
      'employee.jobTitle': 'worker.workAssignment.jobCode.shortName',
      'employee.salary': 'worker.workAssignment.basePay.baseRemuneration.amount'
    },
    syncInterval: 86400000, // 24 hours
    bidirectional: false
  } as IntegrationConfig,

  // Marketing automation
  marketingAutomation: {
    sourceSystem: 'HubSpot',
    targetSystem: 'Mailchimp',
    mappingRules: {
      'contact.email': 'member.email_address',
      'contact.firstname': 'member.merge_fields.FNAME',
      'contact.lastname': 'member.merge_fields.LNAME',
      'contact.company': 'member.merge_fields.COMPANY',
      'contact.lifecycle_stage': 'member.tags',
      'contact.lead_score': 'member.merge_fields.LEAD_SCORE'
    },
    syncInterval: 1800000, // 30 minutes
    bidirectional: true
  } as IntegrationConfig
};

/**
 * SDK Configuration Examples
 */
export const sdkConfigs = {
  // Development environment
  development: {
    orchestratorUrl: 'http://localhost:3000',
    agentId: 'dev-agent-001',
    apiKey: process.env.DEV_API_KEY || 'dev-api-key',
    environment: 'development' as const
  } as SymbiAgentSDKConfig,

  // Staging environment
  staging: {
    orchestratorUrl: 'https://staging-orchestrator.example.com',
    agentId: 'staging-agent-001',
    apiKey: process.env.STAGING_API_KEY || 'staging-api-key',
    environment: 'staging' as const
  } as SymbiAgentSDKConfig,

  // Production environment
  production: {
    orchestratorUrl: 'https://orchestrator.example.com',
    agentId: 'prod-agent-001',
    apiKey: process.env.PROD_API_KEY || 'prod-api-key',
    environment: 'production' as const
  } as SymbiAgentSDKConfig
};

/**
 * Environment-specific configuration helpers
 */
export class ConfigHelper {
  /**
   * Get configuration based on environment
   */
  static getEnvironmentConfig(env: string = process.env.NODE_ENV || 'development') {
    switch (env) {
      case 'production':
        return {
          orchestratorUrl: process.env.ORCHESTRATOR_URL || 'https://orchestrator.example.com',
          logLevel: 'error',
          retryAttempts: 3,
          timeout: 30000
        };
      case 'staging':
        return {
          orchestratorUrl: process.env.ORCHESTRATOR_URL || 'https://staging-orchestrator.example.com',
          logLevel: 'warn',
          retryAttempts: 2,
          timeout: 20000
        };
      default:
        return {
          orchestratorUrl: process.env.ORCHESTRATOR_URL || 'http://localhost:3000',
          logLevel: 'debug',
          retryAttempts: 1,
          timeout: 10000
        };
    }
  }

  /**
   * Validate required environment variables
   */
  static validateEnvironment(): { valid: boolean; missing: string[] } {
    const required = [
      'ORCHESTRATOR_URL',
      'AGENT_API_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Get repository configuration from environment
   */
  static getRepositoryConfigFromEnv(): RepositoryConfig {
    return {
      url: process.env.REPOSITORY_URL || '',
      branch: process.env.REPOSITORY_BRANCH || 'main',
      accessToken: process.env.REPOSITORY_TOKEN || '',
      webhookUrl: process.env.WEBHOOK_URL || '',
      autoMerge: process.env.AUTO_MERGE === 'true',
      reviewRequired: process.env.REVIEW_REQUIRED !== 'false'
    };
  }

  /**
   * Get website configuration from environment
   */
  static getWebsiteConfigFromEnv(): WebsiteConfig {
    return {
      domain: process.env.WEBSITE_DOMAIN || '',
      deploymentTarget: process.env.DEPLOYMENT_TARGET || 'vercel',
      buildCommand: process.env.BUILD_COMMAND || 'npm run build',
      outputDirectory: process.env.OUTPUT_DIRECTORY || 'dist',
      environmentVariables: JSON.parse(process.env.ENV_VARIABLES || '{}')
    };
  }

  /**
   * Get integration configuration from environment
   */
  static getIntegrationConfigFromEnv(): IntegrationConfig {
    return {
      sourceSystem: process.env.SOURCE_SYSTEM || '',
      targetSystem: process.env.TARGET_SYSTEM || '',
      mappingRules: JSON.parse(process.env.MAPPING_RULES || '{}'),
      syncInterval: parseInt(process.env.SYNC_INTERVAL || '300000'),
      bidirectional: process.env.BIDIRECTIONAL === 'true'
    };
  }
}

/**
 * Example .env file content
 */
export const exampleEnvFile = `
# Orchestrator Configuration
ORCHESTRATOR_URL=http://localhost:3000
AGENT_API_KEY=your-agent-api-key-here

# Repository Configuration
REPOSITORY_URL=https://github.com/your-org/your-repo
REPOSITORY_BRANCH=main
REPOSITORY_TOKEN=ghp_your_github_token_here
WEBHOOK_URL=https://your-domain.com/webhooks/github
AUTO_MERGE=false
REVIEW_REQUIRED=true

# Website Configuration
WEBSITE_DOMAIN=your-website.com
DEPLOYMENT_TARGET=vercel
BUILD_COMMAND=npm run build
OUTPUT_DIRECTORY=dist
ENV_VARIABLES={"NODE_ENV":"production","API_URL":"https://api.your-website.com"}

# Integration Configuration
SOURCE_SYSTEM=Salesforce
TARGET_SYSTEM=SAP
MAPPING_RULES={"Account.Id":"Customer.CustomerNumber","Account.Name":"Customer.CompanyName"}
SYNC_INTERVAL=600000
BIDIRECTIONAL=false

# Environment
NODE_ENV=development
`;

export default {
  repositoryConfigs,
  websiteConfigs,
  integrationConfigs,
  sdkConfigs,
  ConfigHelper,
  exampleEnvFile
};