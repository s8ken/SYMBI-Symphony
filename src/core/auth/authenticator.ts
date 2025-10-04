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
} from './auth-types';

export class Authenticator {
  private sessions: Map<string, AuthSession> = new Map();
  private tokens: Map<string, AuthToken> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private config: AuthConfig;
  private mfaConfig: MFAConfig;
  private rateLimitConfig: RateLimitConfig;

  constructor(config?: Partial<AuthConfig>) {
    this.config = {
      method: 'jwt',
      jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        algorithm: 'HS256',
        expiresIn: 3600, // 1 hour
        issuer: 'symbi-symphony',
        audience: 'symbi-agents'
      },
      ...config
    };

    this.mfaConfig = {
      enabled: false,
      methods: ['totp'],
      required: false,
      backupCodes: false
    };

    this.rateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    };

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
          type: 'failed_login',
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
        type: 'login',
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
          type: 'token_expired',
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
   */
  private async validateCredentials(credentials: AgentCredentials): Promise<boolean> {
    switch (this.config.method) {
      case 'api_key':
        return this.validateApiKey(credentials);
      
      case 'jwt':
        return this.validateJwtCredentials(credentials);
      
      default:
        return false;
    }
  }

  /**
   * Validate API key credentials
   */
  private async validateApiKey(credentials: AgentCredentials): Promise<boolean> {
    // In a real implementation, this would check against a database
    // For now, we'll use a simple validation
    return !!(credentials.apiKey && credentials.agentId);
  }

  /**
   * Validate JWT credentials
   */
  private async validateJwtCredentials(credentials: AgentCredentials): Promise<boolean> {
    // In a real implementation, this would validate against stored credentials
    return !!(credentials.agentId && (credentials.token || credentials.password));
  }

  /**
   * Create new session
   */
  private async createSession(agentId: string): Promise<AuthSession> {
    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (this.config.jwt?.expiresIn || 3600) * 1000);

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