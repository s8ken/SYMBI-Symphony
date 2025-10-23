import { 
  canonicalizeJSON, 
  verifyEd25519Signature, 
  verifySecp256k1Signature,
  generateSecureRandom,
  generateEd25519KeyPair,
  signEd25519,
  generateSecureApiKey,
  generateNonce,
  timingSafeEqual
} from '../crypto';

describe('Crypto Module Tests', () => {
  describe('canonicalizeJSON', () => {
    test('should canonicalize simple object', () => {
      const data = { b: 1, a: 2 };
      const result = canonicalizeJSON(data);
      expect(result).toBe('{"a":2,"b":1}');
    });

    test('should canonicalize nested object', () => {
      const data = { b: { d: 1, c: 2 }, a: 3 };
      const result = canonicalizeJSON(data);
      expect(result).toBe('{"a":3,"b":{"c":2,"d":1}}');
    });

    test('should canonicalize array', () => {
      const data = [3, 1, 2];
      const result = canonicalizeJSON(data);
      expect(result).toBe('[3,1,2]');
    });
  });

  describe('Ed25519 Signature', () => {
    test('should handle invalid multibase encoding', async () => {
      const result = await verifyEd25519Signature(
        { test: 'data' },
        'invalidSignature',
        'invalidPublicKey'
      );
      
      expect(result.valid).toBe(false);
      expect(result.algorithm).toBe('Ed25519');
    });
  });

  describe('secp256k1 Signature', () => {
    test('should handle invalid hex encoding', async () => {
      const result = await verifySecp256k1Signature(
        { test: 'data' },
        'invalidSignature',
        'invalidPublicKey'
      );
      
      expect(result.valid).toBe(false);
      expect(result.algorithm).toBe('ES256K');
    });
  });

  describe('Key Generation', () => {
    test('should generate secure random bytes', () => {
      const random1 = generateSecureRandom(32);
      const random2 = generateSecureRandom(32);
      
      expect(random1).toHaveLength(32);
      expect(random2).toHaveLength(32);
      // Very small chance of collision
      expect(random1).not.toEqual(random2);
    });

    test('should generate Ed25519 key pair', async () => {
      const keyPair = await generateEd25519KeyPair();
      
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey).toHaveLength(32);
      expect(keyPair.privateKey).toHaveLength(32);
    });
  });

  describe('API Key Generation', () => {
    test('should generate secure API key', () => {
      const key1 = generateSecureApiKey();
      const key2 = generateSecureApiKey();
      
      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
      expect(key1).not.toBe(key2);
    });

    test('should generate nonce', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      
      expect(nonce1).toBeDefined();
      expect(nonce2).toBeDefined();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('Timing Safe Comparison', () => {
    test('should compare equal strings safely', () => {
      const result = timingSafeEqual('test', 'test');
      expect(result).toBe(true);
    });

    test('should compare different strings safely', () => {
      const result = timingSafeEqual('test', 'different');
      expect(result).toBe(false);
    });

    test('should handle empty strings', () => {
      const result = timingSafeEqual('', '');
      expect(result).toBe(true);
    });
  });
});