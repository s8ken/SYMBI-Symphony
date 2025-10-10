// Authentication and Authorization Types for SYMBI Symphony

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  mfa: MFAConfig;
  rateLimit: RateLimitConfig;
  sessionTimeout: number;
  maxConcurrentSessions: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  roles: Role[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export type Role = 
  | 'super_admin' | 'admin' | 'agent_manager' | 'developer' 
  | 'viewer' | 'agent' | 'service_account';

export type Permission = 
  | 'read:agents' | 'write:agents' | 'delete:agents'
  | 'read:tasks' | 'write:tasks' | 'execute:tasks'
  | 'read:repositories' | 'write:repositories'
  | 'deploy:applications'
  | 'read:metrics' | 'write:metrics'
  | 'admin:system' | 'admin:users' | 'admin:agents';

export interface SessionData {
  sessionId: string;
  agentId: string;
  roles: Role[];
  permissions: Permission[];
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
}

export interface TokenPayload {
  sub: string; // subject (agent ID)
  iat: number; // issued at
  exp: number; // expiration
  aud: string; // audience
  iss: string; // issuer
  jti: string; // JWT ID
  type: 'access' | 'refresh';
  roles: string[];
  permissions: string[];
  sessionId: string;
}

export interface RefreshToken {
  id: string;
  agentId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsed?: Date;
  isRevoked: boolean;
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
    fingerprint: string;
  };
}

export interface SecurityEvent {
  id: string;
  type: 'login_success' | 'login_failure' | 'logout' | 'token_refresh' | 'password_change' | 'role_change' | 'permission_change' | 'suspicious_activity';
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

// Additional types for authorization
export interface RoleDefinition {
  name: Role;
  description: string;
  permissions: Permission[];
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
  restrictions: Record<string, any>;
  metadata: Record<string, any>;
}

// Agent credentials for authentication
export interface AgentCredentials {
  agentId: string;
  apiKey?: string;
  token?: string;
  certificate?: string;
  privateKey?: string;
  metadata?: Record<string, any>;
}

// Additional types needed for authenticator
export interface AuthToken {
  token: string;
  type: 'bearer';
  expiresAt: Date;
  scope: Permission[];
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