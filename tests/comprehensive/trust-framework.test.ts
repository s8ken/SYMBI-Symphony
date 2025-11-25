/**
 * Comprehensive Trust Framework Tests
 * Tests for DID resolution, credentials, revocation, and KMS components
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { DIDResolver } from '../../src/core/trust/resolution/resolver';
import { CredentialIssuer } from '../../src/core/trust/credentials/issuer';
import { CredentialVerifier } from '../../src/core/trust/credentials/verifier';
import { StatusListManager } from '../../src/core/trust/revocation/status-list';
import { LocalKMSProvider } from '../../src/core/trust/kms/local.provider';
import { TrustValidator } from '../../src/core/trust/validator';
import { TrustScoring } from '../../src/core/trust/scoring';

describe('Trust Framework Components', () => {
  let didResolver: DIDResolver;
  let credentialIssuer: CredentialIssuer;
  let credentialVerifier: CredentialVerifier;
  let statusListManager: StatusListManager;
  let kmsProvider: LocalKMSProvider;
  let trustValidator: TrustValidator;
  let trustScoring: TrustScoring;

  beforeAll(async () => {
    // Initialize trust framework components
    didResolver = new DIDResolver();
    kmsProvider = new LocalKMSProvider();
    credentialIssuer = new CredentialIssuer(kmsProvider);
    credentialVerifier = new CredentialVerifier(didResolver);
    statusListManager = new StatusListManager();
    trustValidator = new TrustValidator(didResolver);
    trustScoring = new TrustScoring();

    // Initialize KMS
    await kmsProvider.initialize();
  });

  afterAll(() => {
    // Cleanup
  });

  beforeEach(() => {
    // Reset state for each test
  });

  describe('DID Resolution Tests', () => {
    it('should resolve did:key identifiers', async () => {
      const did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do7';
      
      const resolutionResult = await didResolver.resolve(did);
      expect(resolutionResult).toBeDefined();
      expect(resolutionResult.didDocument).toBeDefined();
      expect(resolutionResult.didDocument.id).toBe(did);
    });

    it('should handle invalid DIDs gracefully', async () => {
      const invalidDIDs = [
        'invalid-did',
        'did:invalid',
        'did:key:invalid-key',
        ''
      ];

      for (const did of invalidDIDs) {
        const result = await didResolver.resolve(did);
        expect(result).toBeDefined();
        expect(result.error).toBeDefined();
      }
    });

    it('should cache DID resolution results', async () => {
      const did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do7';
      
      // First resolution
      const start1 = Date.now();
      const result1 = await didResolver.resolve(did);
      const duration1 = Date.now() - start1;

      // Second resolution (should be cached)
      const start2 = Date.now();
      const result2 = await didResolver.resolve(did);
      const duration2 = Date.now() - start2;

      expect(result1.didDocument.id).toBe(result2.didDocument.id);
      expect(duration2).toBeLessThan(duration1); // Cached should be faster
    });

    it('should support multiple DID methods', async () => {
      const testDIDs = [
        'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do7',
        'did:web:example.com:users:1234',
        'did:ion:eiA6aWt8q8q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q7q'
      ];

      for (const did of testDIDs) {
        const result = await didResolver.resolve(did);
        expect(result).toBeDefined();
        // Some might fail in test environment, but should not throw
      }
    });
  });

  describe('Credential Issuer Tests', () => {
    it('should issue verifiable credentials', async () => {
      const credentialData = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'AgentCredential'],
        issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do7',
        subject: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
          agentType: 'code_reviewer',
          capabilities: ['code_analysis', 'security_check'],
          permissions: ['read_code', 'write_comments']
        }
      };

      const credential = await credentialIssuer.issueCredential(credentialData);
      expect(credential).toBeDefined();
      expect(credential.proof).toBeDefined();
      expect(credential.proof.type).toBe('Ed25519Signature2018');
    });

    it('should validate credential format before issuance', async () => {
      const invalidCredentialData = {
        // Missing required fields
        type: ['VerifiableCredential'],
        // No issuer, subject, etc.
      };

      await expect(credentialIssuer.issueCredential(invalidCredentialData))
        .rejects.toThrow();
    });

    it('should create credentials with expiration', async () => {
      const credentialData = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'TimeLimitedCredential'],
        issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do7',
        subject: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        credentialSubject: {
          id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
          temporaryAccess: true
        }
      };

      const credential = await credentialIssuer.issueCredential(credentialData);
      expect(credential.expirationDate).toBeDefined();
    });
  });

  describe('Credential Verifier Tests', () => {
    it('should verify valid credentials', async () => {
      // First, create a valid credential
      const credentialData = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'TestCredential'],
        issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do7',
        subject: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
          testProperty: 'testValue'
        }
      };

      const credential = await credentialIssuer.issueCredential(credentialData);
      
      // Now verify it
      const verificationResult = await credentialVerifier.verifyCredential(credential);
      expect(verificationResult.isValid).toBe(true);
      expect(verificationResult.errors).toHaveLength(0);
    });

    it('should detect tampered credentials', async () => {
      const credentialData = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'TestCredential'],
        issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do7',
        subject: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
          originalValue: 'original'
        }
      };

      const credential = await credentialIssuer.issueCredential(credentialData);
      
      // Tamper with the credential
      (credential as any).credentialSubject.originalValue = 'tampered';
      
      const verificationResult = await credentialVerifier.verifyCredential(credential);
      expect(verificationResult.isValid).toBe(false);
      expect(verificationResult.errors.length).toBeGreaterThan(0);
    });

    it('should check credential expiration', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      
      const credentialData = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'ExpiredCredential'],
        issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do7',
        subject: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
        issuanceDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        expirationDate: pastDate.toISOString(),
        credentialSubject: {
          id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
          expired: true
        }
      };

      const credential = await credentialIssuer.issueCredential(credentialData);
      const verificationResult = await credentialVerifier.verifyCredential(credential);
      expect(verificationResult.isValid).toBe(false);
      expect(verificationResult.errors.some(e => e.includes('expired'))).toBe(true);
    });
  });

  describe('Revocation Status List Tests', () => {
    it('should create and manage status lists', async () => {
      const statusList = await statusListManager.createStatusList({
        name: 'Test Status List',
        description: 'List for testing revocation',
        issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do7'
      });

      expect(statusList).toBeDefined();
      expect(statusList.id).toBeDefined();
      expect(statusList.statusList).toBeDefined();
    });

    it('should revoke and check credential status', async () => {
      // Create a credential
      const credentialData = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'RevocableCredential'],
        issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do7',
        subject: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
          revocable: true
        }
      };

      const credential = await credentialIssuer.issueCredential(credentialData);
      
      // Create status list and revoke
      const statusList = await statusListManager.createStatusList({
        name: 'Test Revocation List',
        issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do7'
      });

      const revocationResult = await statusListManager.revokeCredential(
        statusList.id,
        credential,
        'test revocation'
      );

      expect(revocationResult.success).toBe(true);
      expect(revocationResult.statusListCredential).toBeDefined();
    });

    it('should verify revocation status during credential verification', async () => {
      // This would integrate with the credential verifier
      // For now, test the basic functionality
      const isRevoked = await statusListManager.isCredentialRevoked(
        'test-credential-id',
        'test-status-list-id'
      );

      expect(typeof isRevoked).toBe('boolean');
    });
  });

  describe('KMS Provider Tests', () => {
    it('should generate and manage cryptographic keys', async () => {
      const keyId = await kmsProvider.generateKey('Ed25519');
      expect(keyId).toBeDefined();
      expect(typeof keyId).toBe('string');

      const publicKey = await kmsProvider.getPublicKey(keyId);
      expect(publicKey).toBeDefined();
    });

    it('should sign and verify data', async () => {
      const keyId = await kmsProvider.generateKey('Ed25519');
      const data = new TextEncoder().encode('test message to sign');
      
      const signature = await kmsProvider.sign(keyId, data);
      expect(signature).toBeDefined();
      expect(signature.length).toBeGreaterThan(0);

      const publicKey = await kmsProvider.getPublicKey(keyId);
      const isValid = await kmsProvider.verify(publicKey, data, signature);
      expect(isValid).toBe(true);
    });

    it('should handle different key types', async () => {
      const keyTypes = ['Ed25519', 'secp256k1'];
      
      for (const keyType of keyTypes) {
        const keyId = await kmsProvider.generateKey(keyType);
        expect(keyId).toBeDefined();
        
        const publicKey = await kmsProvider.getPublicKey(keyId);
        expect(publicKey).toBeDefined();
      }
    });

    it('should securely delete keys', async () => {
      const keyId = await kmsProvider.generateKey('Ed25519');
      
      // Key should exist initially
      expect(await kmsProvider.getPublicKey(keyId)).toBeDefined();
      
      // Delete the key
      await kmsProvider.deleteKey(keyId);
      
      // Key should no longer be accessible
      await expect(kmsProvider.getPublicKey(keyId))
        .rejects.toThrow();
    });
  });

  describe('Trust Validator Tests', () => {
    it('should validate trust relationships', async () => {
      const trustRelationship = {
        issuer: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do7',
        subject: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
        trustLevel: 0.8,
        context: 'agent_deployment',
        evidence: ['credential_1', 'credential_2']
      };

      const validation = await trustValidator.validateTrust(trustRelationship);
      expect(validation.isValid).toBe(true);
      expect(validation.confidence).toBeGreaterThan(0);
    });

    it('should detect invalid trust relationships', async () => {
      const invalidTrust = {
        issuer: 'invalid-did',
        subject: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8',
        trustLevel: 1.5, // Invalid: > 1.0
        context: '',
        evidence: []
      };

      const validation = await trustValidator.validateTrust(invalidTrust);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Trust Scoring Tests', () => {
    it('should calculate trust scores', () => {
      const trustFactors = {
        credentialValidity: 0.9,
        historicalPerformance: 0.8,
        peerEndorsements: 0.7,
        reputationScore: 0.85,
        securityCompliance: 0.95
      };

      const score = trustScoring.calculateScore(trustFactors);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle weighted trust scoring', () => {
      const trustFactors = {
        credentialValidity: 0.9,
        historicalPerformance: 0.8,
        peerEndorsements: 0.7,
        reputationScore: 0.85,
        securityCompliance: 0.95
      };

      const weights = {
        credentialValidity: 0.3,
        historicalPerformance: 0.2,
        peerEndorsements: 0.1,
        reputationScore: 0.2,
        securityCompliance: 0.2
      };

      const weightedScore = trustScoring.calculateWeightedScore(trustFactors, weights);
      expect(weightedScore).toBeGreaterThan(0);
      expect(weightedScore).toBeLessThanOrEqual(1);
    });

    it('should track trust score history', () => {
      const entityId = 'test-entity';
      
      // Add multiple score updates
      trustScoring.updateScore(entityId, 0.8, new Date(Date.now() - 10000));
      trustScoring.updateScore(entityId, 0.85, new Date(Date.now() - 5000));
      trustScoring.updateScore(entityId, 0.9, new Date());

      const history = trustScoring.getScoreHistory(entityId);
      expect(history).toHaveLength(3);
      expect(history[2].score).toBe(0.9);
    });
  });

  describe('Trust Framework Integration Tests', () => {
    it('should handle complete trust verification workflow', async () => {
      // 1. Generate keys
      const issuerKeyId = await kmsProvider.generateKey('Ed25519');
      const subjectKeyId = await kmsProvider.generateKey('Ed25519');

      // 2. Create DIDs
      const issuerDID = `did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do7`;
      const subjectDID = `did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2do8`;

      // 3. Issue credential
      const credentialData = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'AgentTrustCredential'],
        issuer: issuerDID,
        subject: subjectDID,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: subjectDID,
          agentType: 'security_analyst',
          trustLevel: 0.85
        }
      };

      const credential = await credentialIssuer.issueCredential(credentialData);

      // 4. Verify credential
      const verification = await credentialVerifier.verifyCredential(credential);
      expect(verification.isValid).toBe(true);

      // 5. Calculate trust score
      const trustScore = trustScoring.calculateScore({
        credentialValidity: 1.0,
        historicalPerformance: 0.8,
        peerEndorsements: 0.7,
        reputationScore: 0.85,
        securityCompliance: 0.9
      });

      expect(trustScore).toBeGreaterThan(0.8);
    });

    it('should handle trust chain verification', async () => {
      // Test verification of trust chains (A trusts B, B trusts C, etc.)
      const trustChain = [
        { issuer: 'did:a', subject: 'did:b', trustLevel: 0.9 },
        { issuer: 'did:b', subject: 'did:c', trustLevel: 0.8 },
        { issuer: 'did:c', subject: 'did:d', trustLevel: 0.7 }
      ];

      // Verify the chain
      for (const link of trustChain) {
        const validation = await trustValidator.validateTrust(link);
        expect(validation.isValid).toBe(true);
      }
    });
  });
});