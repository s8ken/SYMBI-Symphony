/**
 * Authentication Types - SYMBI Symphony
 * 
 * Type definitions for authentication and authorization in the SYMBI AI Agent ecosystem.
 */

// Core authentication types
export interface AgentCredentials {
  agentId: string;
  apiKey?: string;
  token?: string;
  username?: string;
  password?: string;
  publicKey?: string;
  signature?: string;
  timestamp?: number;
  nonce?: string;
}

export interface AuthToken {
  token: string;
  type: 'bearer' | 'api_key' | 'jwt';
  expiresAt: Date;
  scope: string[];
  agentId: string;
  sessionId: string;
  refreshToken?: string;
}

export interface AuthSession {
  sessionId: string;
  agentId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  permissions: Permission[];
  roles: Role[];
  metadata: Record<string, any>;
}

// Permission and role types
export type Permission = 
  | 'read:agents' | 'write:agents' | 'delete:agents'
  | 'read:tasks' | 'write:tasks' | 'execute:tasks'
  | 'read:repositories' | 'write:repositories'
  | 'deploy:applications'
  | 'read:metrics' | 'write:metrics'
  | 'admin:system' | 'admin:users' | 'admin:agents';

export type Role = 
  | 'super_admin' | 'admin' | 'agent_manager' | 'developer' 
  | 'viewer' | 'agent' | 'service_account';

export interface RoleDefinition {
  name: Role;
  description: string;
  permissions: Permission[];
  inherits?: Role[];
  metadata?: Record<string, any>;
}

export interface AgentPermissions {
  agentId: string;
  roles: Role[];
  permissions: Permission[];
  resourceAccess: {
    repositories: string[];
    tasks: string[];
    agents: string[];
  };
  restrictions: {
    ipWhitelist?: string[];
    timeRestrictions?: {
      allowedHours: number[];
      timezone: string;
    };
    rateLimit?: {
      requestsPerMinute: number;
      requestsPerHour: number;
    };
  };
  metadata: Record<string, any>;
}

// Authentication configuration
export interface AuthConfig {
  method: 'api_key' | 'jwt' | 'oauth2' | 'mutual_tls';
  apiKey?: {
    headerName: string;
    prefix?: string;
  };
  jwt?: {
    secret: string;
    algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
    expiresIn: number;
    issuer: string;
    audience: string;
  };
  oauth2?: {
    clientId: string;
    clientSecret: string;
    authorizationUrl: string;
    tokenUrl: string;
    scope: string[];
  };
  mutualTls?: {
    caCert: string;
    clientCert: string;
    clientKey: string;
  };
}

// Security and audit types
export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'permission_denied' | 'token_expired' | 'suspicious_activity';
  agentId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MFAConfig {
  enabled: boolean;
  methods: ('totp' | 'sms' | 'email' | 'hardware_key')[];
  required: boolean;
  backupCodes: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator?: (req: any) => string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  agentId: string;
  action: string;
  resource?: string;
  result: 'success' | 'failure' | 'partial';
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

export interface AuthContext {
  agentId: string;
  sessionId: string;
  roles: Role[];
  permissions: Permission[];
  resourceAccess: {
    repositories: string[];
    tasks: string[];
    agents: string[];
  };
  metadata: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
}

// Custom error classes
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403,
    public permission?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number,
    public limit: number,
    public remaining: number,
    public resetTime: Date
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}