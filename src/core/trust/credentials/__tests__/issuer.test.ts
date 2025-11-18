/**
 * Credential Issuer Tests
 */

import { CredentialIssuer, VerifiableCredential } from '../issuer';

describe('CredentialIssuer', () => {
  const issuerDid = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
  const subjectDid = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';

  describe('Basic Credential Issuance', () => {
    test('should issue a basic verifiable credential', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const credential = await issuer.issue(subjectDid, {
        name: 'Alice Smith',
        role: 'Developer',
      });

      expect(credential).toBeDefined();
      expect(credential['@context']).toContain('https://www.w3.org/2018/credentials/v1');
      expect(credential.type).toContain('VerifiableCredential');
      expect(credential.issuer).toBe(issuerDid);
      expect(credential.credentialSubject.id).toBe(subjectDid);
      expect(credential.credentialSubject.name).toBe('Alice Smith');
      expect(credential.credentialSubject.role).toBe('Developer');
      expect(credential.issuanceDate).toBeDefined();
      expect(credential.id).toBeDefined();
    });

    test('should issue credential with custom ID', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      const customId = 'urn:uuid:custom-12345';
      
      const credential = await issuer.issue(
        subjectDid,
        { skill: 'TypeScript' },
        { id: customId }
      );

      expect(credential.id).toBe(customId);
    });

    test('should issue credential with expiration date', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      const expirationDate = new Date('2025-12-31');
      
      const credential = await issuer.issue(
        subjectDid,
        { access: 'premium' },
        { expirationDate }
      );

      expect(credential.expirationDate).toBe(expirationDate.toISOString());
    });

    test('should issue credential with additional contexts', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const credential = await issuer.issue(
        subjectDid,
        { customField: 'value' },
        {
          additionalContexts: ['https://example.com/contexts/custom/v1'],
          additionalTypes: ['CustomCredential'],
        }
      );

      expect(credential['@context']).toContain('https://example.com/contexts/custom/v1');
      expect(credential.type).toContain('CustomCredential');
    });

    test('should issue credential with status list', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const credential = await issuer.issue(
        subjectDid,
        { data: 'test' },
        {
          credentialStatus: {
            statusListIndex: 42,
            statusListCredential: 'https://example.com/status/1',
          },
        }
      );

      expect(credential.credentialStatus).toBeDefined();
      expect(credential.credentialStatus?.type).toBe('StatusList2021Entry');
      expect(credential.credentialStatus?.statusListIndex).toBe('42');
      expect(credential.credentialStatus?.statusListCredential).toBe('https://example.com/status/1');
    });
  });

  describe('Trust Declaration Credentials', () => {
    test('should issue trust declaration credential', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const trustArticles = {
        inspection_mandate: true,
        consent_architecture: true,
        ethical_override: true,
        continuous_validation: true,
        right_to_disconnect: true,
        moral_recognition: true,
      };

      const credential = await issuer.issueTrustDeclaration(
        subjectDid,
        trustArticles,
        0.95
      );

      expect(credential.type).toContain('TrustDeclarationCredential');
      expect(credential['@context']).toContain('https://symbi.world/contexts/trust/v1');
      expect(credential.credentialSubject.trustArticles).toEqual(trustArticles);
      expect(credential.credentialSubject.trustScore).toBe(0.95);
      expect(credential.credentialSubject.trustLevel).toBe('verified');
    });

    test('should calculate correct trust levels', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const trustArticles = {
        inspection_mandate: true,
        consent_architecture: true,
        ethical_override: false,
        continuous_validation: false,
        right_to_disconnect: false,
        moral_recognition: false,
      };

      const testCases = [
        { score: 0.95, expectedLevel: 'verified' },
        { score: 0.85, expectedLevel: 'high' },
        { score: 0.65, expectedLevel: 'medium' },
        { score: 0.45, expectedLevel: 'low' },
        { score: 0.25, expectedLevel: 'untrusted' },
      ];

      for (const testCase of testCases) {
        const credential = await issuer.issueTrustDeclaration(
          subjectDid,
          trustArticles,
          testCase.score
        );

        expect(credential.credentialSubject.trustLevel).toBe(testCase.expectedLevel);
      }
    });
  });

  describe('Credential Verification', () => {
    test('should verify valid credential structure', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const credential = await issuer.issue(subjectDid, {
        name: 'Test User',
      });

      const result = await issuer.verify(credential);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required fields', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const invalidCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        // Missing id, type, issuer, etc.
      } as any;

      const result = await issuer.verify(invalidCredential);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should detect invalid @context', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const invalidCredential = {
        '@context': ['https://example.com/invalid'],
        id: 'urn:uuid:test',
        type: ['VerifiableCredential'],
        issuer: issuerDid,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: subjectDid },
      } as VerifiableCredential;

      const result = await issuer.verify(invalidCredential);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('@context must include https://www.w3.org/2018/credentials/v1');
    });

    test('should detect expired credentials', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const expiredCredential = await issuer.issue(
        subjectDid,
        { data: 'test' },
        { expirationDate: new Date('2020-01-01') }
      );

      const result = await issuer.verify(expiredCredential);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Credential has expired');
    });

    test('should detect invalid date formats', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const invalidCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'urn:uuid:test',
        type: ['VerifiableCredential'],
        issuer: issuerDid,
        issuanceDate: 'invalid-date',
        credentialSubject: { id: subjectDid },
      } as VerifiableCredential;

      const result = await issuer.verify(invalidCredential);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid'))).toBe(true);
    });
  });

  describe('Credential ID Generation', () => {
    test('should generate unique credential IDs', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const credential1 = await issuer.issue(subjectDid, { data: 'test1' });
      const credential2 = await issuer.issue(subjectDid, { data: 'test2' });

      expect(credential1.id).not.toBe(credential2.id);
      expect(credential1.id).toMatch(/^urn:uuid:/);
      expect(credential2.id).toMatch(/^urn:uuid:/);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty claims object', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const credential = await issuer.issue(subjectDid, {});

      expect(credential).toBeDefined();
      expect(credential.credentialSubject.id).toBe(subjectDid);
    });

    test('should handle complex nested claims', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const complexClaims = {
        profile: {
          name: 'Alice',
          age: 30,
          skills: ['TypeScript', 'React', 'Node.js'],
        },
        metadata: {
          verified: true,
          timestamp: new Date().toISOString(),
        },
      };

      const credential = await issuer.issue(subjectDid, complexClaims);

      expect(credential.credentialSubject.profile).toEqual(complexClaims.profile);
      expect(credential.credentialSubject.metadata).toEqual(complexClaims.metadata);
    });

    test('should handle issuer as object', async () => {
      const issuer = new CredentialIssuer(issuerDid);
      
      const credential = await issuer.issue(subjectDid, { data: 'test' });

      // Issuer should be a string (DID)
      expect(typeof credential.issuer).toBe('string');
      expect(credential.issuer).toBe(issuerDid);
    });
  });
});