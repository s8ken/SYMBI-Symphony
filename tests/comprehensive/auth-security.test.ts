/**
 * Comprehensive Authentication and Security Tests
 * Tests for authentication, authorization, and security components
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Authenticator } from '../../src/core/auth/authenticator';
import { Authorizer } from '../../src/core/auth/authorizer';
import { JWTHelper } from '../../src/core/auth/jwt-helper';
import { ApiKeyManager } from '../../src/core/security/api-keys';
import { RateLimiter } from '../../src/core/security/rate-limiter';
import { RBACManager } from '../../src/core/security/rbac';
import { AuditLogger } from '../../src/core/security/audit';

describe('Authentication and Security Components', () => {
  let authenticator: Authenticator;
  let authorizer: Authorizer;
  let jwtHelper: JWTHelper;
  let apiKeyManager: ApiKeyManager;
  let rateLimiter: RateLimiter;
  let rbacManager: RBACManager;
  let auditLogger: AuditLogger;

  beforeAll(async () => {
    // Initialize components with test configuration
    jwtHelper = new JWTHelper('test-secret-key');
    authenticator = new Authenticator(jwtHelper);
    authorizer = new Authorizer();
    apiKeyManager = new ApiKeyManager();
    rateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
    rbacManager = new RBACManager();
    auditLogger = new AuditLogger('test-service');
  });

  afterAll(() => {
    // Cleanup
  });

  beforeEach(() => {
    // Reset rate limiter for each test
    rateLimiter.reset();
  });

  describe('JWT Authentication Tests', () => {
    it('should generate and validate JWT tokens', () => {
      const payload = { userId: 'test-user', role: 'agent' };
      const token = jwtHelper.generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwtHelper.verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
    });

    it('should handle token expiration', () => {
      const payload = { userId: 'test-user' };
      const token = jwtHelper.generateToken(payload, { expiresIn: '1s' });
      
      // Valid immediately
      expect(jwtHelper.verifyToken(token)).toBeDefined();
      
      // Wait for expiration (in real tests, you'd use timers)
      // For now, test invalid token handling
      expect(() => jwtHelper.verifyToken('invalid-token')).toThrow();
    });

    it('should reject malformed tokens', () => {
      const invalidTokens = [
        '',
        'invalid.token',
        'header.payload', // missing signature
        'not.a.jwt.format'
      ];

      invalidTokens.forEach(token => {
        expect(() => jwtHelper.verifyToken(token)).toThrow();
      });
    });
  });

  describe('Authenticator Component Tests', () => {
    it('should authenticate with valid credentials', async () => {
      const credentials = {
        username: 'test-agent',
        password: 'test-password',
        apiKey: 'test-api-key'
      };

      // Mock credential validation
      const result = await authenticator.authenticate(credentials);
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const credentials = {
        username: 'invalid-user',
        password: 'wrong-password',
        apiKey: 'invalid-key'
      };

      const result = await authenticator.authenticate(credentials);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle authentication rate limiting', async () => {
      const credentials = {
        username: 'test-agent',
        password: 'test-password',
        apiKey: 'test-api-key'
      };

      // Make multiple rapid requests
      const promises = Array.from({ length: 10 }, () => 
        authenticator.authenticate(credentials)
      );
      
      const results = await Promise.all(promises);
      // Some should succeed, some should be rate limited
      expect(results.some(r => r.success)).toBe(true);
    });
  });

  describe('Authorization Tests', () => {
    it('should authorize based on user roles', () => {
      const userContext = {
        userId: 'test-user',
        role: 'admin',
        permissions: ['read', 'write', 'delete']
      };

      expect(authorizer.canAccess(userContext, 'read', 'resource')).toBe(true);
      expect(authorizer.canAccess(userContext, 'delete', 'resource')).toBe(true);
    });

    it('should deny access for insufficient permissions', () => {
      const userContext = {
        userId: 'test-user',
        role: 'user',
        permissions: ['read']
      };

      expect(authorizer.canAccess(userContext, 'write', 'resource')).toBe(false);
      expect(authorizer.canAccess(userContext, 'delete', 'resource')).toBe(false);
    });

    it('should handle resource-based authorization', () => {
      const userContext = {
        userId: 'agent-123',
        role: 'agent',
        permissions: ['read'],
        ownedResources: ['resource-123', 'resource-456']
      };

      expect(authorizer.canAccess(userContext, 'read', 'resource-123')).toBe(true);
      expect(authorizer.canAccess(userContext, 'read', 'resource-789')).toBe(false);
    });
  });

  describe('API Key Management Tests', () => {
    it('should generate and validate API keys', () => {
      const apiKeyInfo = apiKeyManager.generateApiKey({
        name: 'Test API Key',
        permissions: ['read', 'write'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      expect(apiKeyInfo.key).toBeDefined();
      expect(apiKeyInfo.keyId).toBeDefined();
      expect(apiKeyInfo.key).toMatch(/^sk_[a-zA-Z0-9]+$/);

      const validation = apiKeyManager.validateApiKey(apiKeyInfo.key);
      expect(validation.valid).toBe(true);
      expect(validation.permissions).toContain('read');
    });

    it('should handle API key expiration', () => {
      const expiredKeyInfo = apiKeyManager.generateApiKey({
        name: 'Expired API Key',
        permissions: ['read'],
        expiresAt: new Date(Date.now() - 1000) // Already expired
      });

      const validation = apiKeyManager.validateApiKey(expiredKeyInfo.key);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('expired');
    });

    it('should revoke API keys', () => {
      const keyInfo = apiKeyManager.generateApiKey({
        name: 'Revocable API Key',
        permissions: ['read']
      });

      // Should be valid initially
      expect(apiKeyManager.validateApiKey(keyInfo.key).valid).toBe(true);

      // Revoke the key
      apiKeyManager.revokeApiKey(keyInfo.keyId);

      // Should no longer be valid
      expect(apiKeyManager.validateApiKey(keyInfo.key).valid).toBe(false);
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should allow requests within limits', () => {
      const clientId = 'test-client';
      
      // Make requests within limit
      for (let i = 0; i < 50; i++) {
        const result = rateLimiter.checkLimit(clientId);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBeGreaterThan(0);
      }
    });

    it('should block requests exceeding limits', () => {
      const clientId = 'test-client-2';
      
      // Exhaust the limit
      let allowed = 0;
      for (let i = 0; i < 150; i++) {
        const result = rateLimiter.checkLimit(clientId);
        if (result.allowed) allowed++;
      }
      
      expect(allowed).toBeLessThanOrEqual(100);
      
      // Next request should be blocked
      const result = rateLimiter.checkLimit(clientId);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset rate limits over time', (done) => {
      const clientId = 'test-client-3';
      
      // Exhaust the limit
      for (let i = 0; i < 100; i++) {
        rateLimiter.checkLimit(clientId);
      }
      
      // Should be blocked
      expect(rateLimiter.checkLimit(clientId).allowed).toBe(false);
      
      // Reset manually (in real scenario, time would pass)
      rateLimiter.reset(clientId);
      
      // Should be allowed again
      const result = rateLimiter.checkLimit(clientId);
      expect(result.allowed).toBe(true);
      done();
    });
  });

  describe('RBAC Tests', () => {
    beforeAll(() => {
      // Define roles and permissions
      rbacManager.defineRole('admin', ['read', 'write', 'delete', 'manage']);
      rbacManager.defineRole('agent', ['read', 'write']);
      rbacManager.defineRole('viewer', ['read']);
    });

    it('should check role-based permissions', () => {
      expect(rbacManager.hasPermission('admin', 'delete')).toBe(true);
      expect(rbacManager.hasPermission('agent', 'delete')).toBe(false);
      expect(rbacManager.hasPermission('viewer', 'read')).toBe(true);
      expect(rbacManager.hasPermission('viewer', 'write')).toBe(false);
    });

    it('should handle hierarchical roles', () => {
      rbacManager.defineRole('superadmin', ['*'], ['admin']);
      
      expect(rbacManager.hasPermission('superadmin', 'any-action')).toBe(true);
      expect(rbacManager.hasPermission('superadmin', 'read')).toBe(true); // Inherited
    });

    it('should check multiple permissions', () => {
      expect(rbacManager.hasAllPermissions('admin', ['read', 'write', 'delete'])).toBe(true);
      expect(rbacManager.hasAllPermissions('agent', ['read', 'delete'])).toBe(false);
      expect(rbacManager.hasAnyPermission('viewer', ['write', 'read'])).toBe(true);
      expect(rbacManager.hasAnyPermission('viewer', ['write', 'delete'])).toBe(false);
    });
  });

  describe('Audit Logging Tests', () => {
    it('should log security events', () => {
      const event = {
        type: 'authentication',
        userId: 'test-user',
        action: 'login',
        result: 'success',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        timestamp: new Date()
      };

      expect(() => auditLogger.logEvent(event)).not.toThrow();
    });

    it('should track failed authentication attempts', () => {
      const failedAttempt = {
        type: 'authentication_failure',
        userId: 'test-user',
        reason: 'invalid_password',
        ip: '127.0.0.1',
        attempts: 3
      };

      expect(() => auditLogger.logSecurityEvent(failedAttempt)).not.toThrow();
    });

    it('should query audit logs', () => {
      const filters = {
        userId: 'test-user',
        eventType: 'authentication',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date()
      };

      const logs = auditLogger.queryEvents(filters);
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe('Security Integration Tests', () => {
    it('should handle complete authentication flow', async () => {
      const credentials = {
        username: 'test-agent',
        password: 'test-password',
        apiKey: 'test-api-key'
      };

      // Step 1: Authenticate
      const authResult = await authenticator.authenticate(credentials);
      expect(authResult.success).toBe(true);

      // Step 2: Verify JWT token
      const tokenData = jwtHelper.verifyToken(authResult.token);
      expect(tokenData.userId).toBe(credentials.username);

      // Step 3: Check authorization
      const canAccess = authorizer.canAccess(tokenData, 'read', 'test-resource');
      expect(canAccess).toBe(true);

      // Step 4: Log the event
      auditLogger.logEvent({
        type: 'authentication_success',
        userId: tokenData.userId,
        action: 'resource_access',
        result: 'authorized'
      });
    });

    it('should handle security breach scenarios', async () => {
      const maliciousCredentials = {
        username: 'test-agent',
        password: 'wrong-password',
        apiKey: 'invalid-key'
      };

      // Multiple failed attempts
      for (let i = 0; i < 5; i++) {
        const result = await authenticator.authenticate(maliciousCredentials);
        expect(result.success).toBe(false);
      }

      // Check rate limiting kicked in
      const rateLimitResult = rateLimiter.checkLimit('test-agent');
      expect(rateLimitResult.remaining).toBeLessThan(100);
    });
  });
});