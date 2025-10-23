/**
 * Authenticator - SYMBI Symphony
 * 
 * Authentication service for the SYMBI AI Agent ecosystem.
 * Handles token generation, validation, session management, and multi-factor authentication.
 */

import crypto from 'crypto';
import {
  AgentCredentials,
  AuthToken,
  AuthSession,
  AuthConfig,
  SecurityEvent,
  MFAConfig,
  RateLimitConfig,
  AuthenticationError,
  RateLimitError
} from './types';

/**
 * Interface for credential storage and validation
 * Implement this interface to provide your own credential store
 */
export interface CredentialStore {
  /**
   * Validate agent credentials against stored values
   * @returns true if credentials are valid, false otherwise
   */
  validateCredentials(credentials: AgentCredentials): Promise<boolean>;

  /**
   * Get agent permissions and roles
   */
  getAgentPermissions(agentId: string): Promise<{ roles: string[]; permissions: string[] }>;
}

export class Authenticator {
  private sessions: Map<string, AuthSession> = new Map();
  private tokens: Map<string, AuthToken> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private config: AuthConfig;
  private mfaConfig: MFAConfig;
  private rateLimitConfig: RateLimitConfig;
  private credentialStore?: CredentialStore;
  private apiKeyStore: Map<string, string> = new Map(); // agentId -> hashedApiKey (for default implementation)

  constructor(config?: Partial<AuthConfig>, credentialStore?: CredentialStore) {
    this.credentialStore = credentialStore;
    this.config = {
      jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
      jwtExpiresIn: '1h',
      refreshTokenExpiresIn: '7d',
      sessionTimeout: 3600,
      maxConcurrentSessions: 5,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      mfa: {
        enabled: false,
        methods: ['totp'],
        required: false,
        backupCodes: false
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
      },
      ...config
    };

    this.mfaConfig = this.config.mfa;
    this.rateLimitConfig = this.config.rateLimit;

    // Clean up expired sessions and tokens periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Authenticate agent with credentials
   */
  async authenticate(credentials: AgentCredentials): Promise<AuthToken> {
    try {
      // Rate limiting check
      await this.checkRateLimit(credentials.agentId);

      // Validate credentials based on auth method
      const isValid = await this.validateCredentials(credentials);
      
      if (!isValid) {
        await this.logSecurityEvent({
          type: 'login_failure',
          agentId: credentials.agentId,
          details: { reason: 'invalid_credentials' },
          severity: 'medium'
        });
        
        throw new AuthenticationError(
          'Invalid credentials',
          'INVALID_CREDENTIALS',
          401
        );
      }

      // Generate session and token
      const session = await this.createSession(credentials.agentId);
      const token = await this.generateToken(session);

      await this.logSecurityEvent({
        type: 'login_success',
        agentId: credentials.agentId,
        details: { sessionId: session.sessionId },
        severity: 'low'
      });

      return token;
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof RateLimitError) {
        throw error;
      }
      
      throw new AuthenticationError(
        'Authentication failed',
        'AUTH_FAILED',
        500,
        { originalError: (error as Error).message }
      );
    }
  }

  /**
   * Validate authentication token
   */
  async validateToken(tokenString: string): Promise<AuthSession | null> {
    try {
      const token = this.tokens.get(tokenString);
      
      if (!token) {
        return null;
      }

      // Check if token is expired
      if (token.expiresAt < new Date()) {
        this.tokens.delete(tokenString);
        await this.logSecurityEvent({
          type: 'token_refresh',
          agentId: token.agentId,
          details: { tokenType: token.type },
          severity: 'low'
        });
        return null;
      }

      // Get associated session
      const session = this.sessions.get(token.sessionId);
      
      if (!session || !session.isActive) {
        this.tokens.delete(tokenString);
        return null;
      }

      // Update last activity
      session.lastActivity = new Date();
      
      return session;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<AuthToken> {
    // Find token by refresh token
    const existingToken = Array.from(this.tokens.values())
      .find(t => t.refreshToken === refreshToken);

    if (!existingToken) {
      throw new AuthenticationError(
        'Invalid refresh token',
        'INVALID_REFRESH_TOKEN',
        401
      );
    }

    const session = this.sessions.get(existingToken.sessionId);
    if (!session || !session.isActive) {
      throw new AuthenticationError(
        'Session expired',
        'SESSION_EXPIRED',
        401
      );
    }

    // Remove old token
    this.tokens.delete(existingToken.token);

    // Generate new token
    const newToken = await this.generateToken(session);
    
    return newToken;
  }

  /**
   * Logout and invalidate session
   */
  async logout(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      session.isActive = false;
      
      // Remove associated tokens
      for (const [tokenString, token] of this.tokens.entries()) {
        if (token.sessionId === sessionId) {
          this.tokens.delete(tokenString);
        }
      }

      await this.logSecurityEvent({
        type: 'logout',
        agentId: session.agentId,
        details: { sessionId },
        severity: 'low'
      });
    }
  }

  /**
   * Get active sessions for an agent
   */
  getActiveSessions(agentId: string): AuthSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.agentId === agentId && session.isActive);
  }

  /**
   * Revoke all sessions for an agent
   */
  async revokeAllSessions(agentId: string): Promise<void> {
    const sessions = this.getActiveSessions(agentId);
    
    for (const session of sessions) {
      await this.logout(session.sessionId);
    }
  }

  /**
   * Validate credentials based on auth method
   *
   * SECURITY: This performs actual cryptographic validation of credentials.
   * If a CredentialStore is provided, it delegates validation to that store.
   * Otherwise, it uses the built-in API key validation with secure hashing.
   */
  private async validateCredentials(credentials: AgentCredentials): Promise<boolean> {
    // Basic input validation
    if (!credentials || !credentials.agentId) {
      return false;
    }

    // If custom credential store is provided, use it
    if (this.credentialStore) {
      try {
        return await this.credentialStore.validateCredentials(credentials);
      } catch (error) {
        console.error('Credential validation error:', error);
        return false;
      }
    }

    // Built-in validation for API keys
    if (credentials.apiKey) {
      // Check if agent exists in store
      const storedHashedKey = this.apiKeyStore.get(credentials.agentId);
      if (!storedHashedKey) {
        // Agent not found or not registered
        return false;
      }

      // Hash the provided API key using constant-time comparison
      const providedKeyHash = crypto
        .createHash('sha256')
        .update(credentials.apiKey)
        .digest('hex');

      // Constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(storedHashedKey),
        Buffer.from(providedKeyHash)
      );
    }

    // Token validation (if JWT token provided)
    if (credentials.token) {
      // Token validation would be handled by validateToken()
      // This is for initial authentication with a token
      const session = await this.validateToken(credentials.token);
      return session !== null && session.agentId === credentials.agentId;
    }

    // Certificate-based authentication
    if (credentials.certificate && credentials.privateKey) {
      // In a production implementation, this would verify the certificate
      // against a trusted CA and validate the private key matches
      // For now, we require a CredentialStore for certificate auth
      return false;
    }

    // No valid credentials provided
    return false;
  }

  /**
   * Register an agent with an API key (for default implementation)
   * In production, use a CredentialStore instead
   */
  registerAgent(agentId: string, apiKey: string): void {
    const hashedKey = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');

    this.apiKeyStore.set(agentId, hashedKey);
  }

  /**
   * Unregister an agent (remove from default store)
   */
  unregisterAgent(agentId: string): void {
    this.apiKeyStore.delete(agentId);
  }

  /**
   * Create new session
   */
  private async createSession(agentId: string): Promise<AuthSession> {
    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.sessionTimeout * 1000);

    const session: AuthSession = {
      sessionId,
      agentId,
      createdAt: now,
      expiresAt,
      lastActivity: now,
      ipAddress: '127.0.0.1', // Would be extracted from request
      userAgent: 'SYMBI Agent', // Would be extracted from request
      isActive: true,
      permissions: [], // Would be loaded from database
      roles: [], // Would be loaded from database
      metadata: {}
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Generate authentication token
   */
  private async generateToken(session: AuthSession): Promise<AuthToken> {
    const tokenString = this.generateTokenString();
    const refreshToken = this.generateTokenString();
    
    const token: AuthToken = {
      token: tokenString,
      type: 'bearer',
      expiresAt: session.expiresAt,
      scope: session.permissions,
      agentId: session.agentId,
      sessionId: session.sessionId,
      refreshToken
    };

    this.tokens.set(tokenString, token);
    return token;
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate secure token string
   */
  private generateTokenString(): string {
    return crypto.randomBytes(48).toString('base64url');
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(agentId: string): Promise<void> {
    const now = Date.now();
    const key = `auth:${agentId}`;
    const limit = this.rateLimitStore.get(key);

    if (!limit || now > limit.resetTime) {
      // Reset or create new limit
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.rateLimitConfig.windowMs
      });
      return;
    }

    if (limit.count >= this.rateLimitConfig.maxRequests) {
      throw new RateLimitError(
        'Rate limit exceeded',
        Math.ceil((limit.resetTime - now) / 1000),
        this.rateLimitConfig.maxRequests,
        0,
        new Date(limit.resetTime)
      );
    }

    limit.count++;
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ipAddress: '127.0.0.1', // Would be extracted from request
      userAgent: 'SYMBI Agent', // Would be extracted from request
      ...event
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
  }

  /**
   * Clean up expired sessions and tokens
   */
  private cleanup(): void {
    const now = new Date();

    // Clean up expired sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }

    // Clean up expired tokens
    for (const [tokenString, token] of this.tokens.entries()) {
      if (token.expiresAt < now) {
        this.tokens.delete(tokenString);
      }
    }

    // Clean up rate limit store
    const currentTime = Date.now();
    for (const [key, limit] of this.rateLimitStore.entries()) {
      if (currentTime > limit.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Get security events
   */
  getSecurityEvents(filter?: {
    agentId?: string;
    type?: string;
    severity?: string;
    since?: Date;
  }): SecurityEvent[] {
    let events = this.securityEvents;

    if (filter) {
      events = events.filter(event => {
        if (filter.agentId && event.agentId !== filter.agentId) return false;
        if (filter.type && event.type !== filter.type) return false;
        if (filter.severity && event.severity !== filter.severity) return false;
        if (filter.since && event.timestamp < filter.since) return false;
        return true;
      });
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get authentication statistics
   */
  getStats(): {
    activeSessions: number;
    activeTokens: number;
    securityEvents: number;
    rateLimitEntries: number;
  } {
    return {
      activeSessions: Array.from(this.sessions.values()).filter(s => s.isActive).length,
      activeTokens: this.tokens.size,
      securityEvents: this.securityEvents.length,
      rateLimitEntries: this.rateLimitStore.size
    };
  }
}