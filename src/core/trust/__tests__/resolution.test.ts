/**
 * DID Resolution Tests
 *
 * Tests for DID resolution infrastructure across all supported methods
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  UniversalResolver,
  DidWebResolver,
  DidKeyResolver,
  DidEthrResolver,
  DidIonResolver,
  InMemoryCache,
  DIDResolutionResult,
} from '../resolution';

describe('UniversalResolver', () => {
  let resolver: UniversalResolver;

  beforeEach(() => {
    resolver = new UniversalResolver(new InMemoryCache());
  });

  it('should register and retrieve resolvers', () => {
    expect(resolver.getSupportedMethods()).toContain('web');
    expect(resolver.getSupportedMethods()).toContain('key');
  });

  it('should reject invalid DID format', async () => {
    const result = await resolver.resolve('invalid-did');
    expect(result.didResolutionMetadata.error).toBe('invalidDid');
  });

  it('should reject unsupported method', async () => {
    const result = await resolver.resolve('did:unsupported:123');
    expect(result.didResolutionMetadata.error).toBe('methodNotSupported');
  });

  it('should extract correct method from DID', async () => {
    const result = await resolver.resolve('did:web:example.com');
    // Will fail resolution but should recognize method
    expect(result.didResolutionMetadata.error).not.toBe('methodNotSupported');
  });

  it('should batch resolve multiple DIDs', async () => {
    const dids = [
      'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
      'did:web:example.com',
    ];

    const results = await resolver.resolveMany(dids);
    expect(results.size).toBe(2);
    expect(results.has(dids[0])).toBe(true);
    expect(results.has(dids[1])).toBe(true);
  });
});

describe('DidKeyResolver', () => {
  let resolver: DidKeyResolver;

  beforeEach(() => {
    resolver = new DidKeyResolver();
  });

  it('should validate correct did:key format', () => {
    const validDid = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
    expect(resolver.validateDID(validDid)).toBe(true);
  });

  it('should reject invalid did:key format', () => {
    expect(resolver.validateDID('did:key:invalid!')).toBe(false);
    expect(resolver.validateDID('did:key:')).toBe(false);
    expect(resolver.validateDID('did:key')).toBe(false);
  });

  it('should resolve Ed25519 did:key', async () => {
    // Known Ed25519 did:key
    const did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
    const result = await resolver.resolve(did);

    expect(result.didDocument).not.toBeNull();
    expect(result.didDocument?.id).toBe(did);
    expect(result.didDocument?.verificationMethod).toHaveLength(1);
    expect(result.didDocument?.verificationMethod?.[0].type).toBe('Ed25519VerificationKey2020');
  });

  it('should include proper verification relationships', async () => {
    const did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
    const result = await resolver.resolve(did);

    expect(result.didDocument?.authentication).toBeDefined();
    expect(result.didDocument?.assertionMethod).toBeDefined();
    expect(result.didDocument?.authentication?.length).toBeGreaterThan(0);
  });

  it('should reject non-base58btc encoding', async () => {
    const did = 'did:key:u6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
    const result = await resolver.resolve(did);

    expect(result.didResolutionMetadata.error).toBe('invalidDid');
  });

  it('should be stateless (no cache needed)', async () => {
    const did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';

    // Resolve twice
    const result1 = await resolver.resolve(did);
    const result2 = await resolver.resolve(did);

    // Should return identical results
    expect(result1.didDocument).toEqual(result2.didDocument);
    expect(result1.didResolutionMetadata.cached).toBeUndefined();
    expect(result2.didResolutionMetadata.cached).toBeUndefined();
  });
});

describe('DidWebResolver', () => {
  let resolver: DidWebResolver;

  beforeEach(() => {
    resolver = new DidWebResolver();
  });

  it('should validate correct did:web format', () => {
    expect(resolver.validateDID('did:web:example.com')).toBe(true);
    expect(resolver.validateDID('did:web:example.com:user:alice')).toBe(true);
    expect(resolver.validateDID('did:web:example.com%3A8080')).toBe(true);
  });

  it('should reject invalid did:web format', () => {
    expect(resolver.validateDID('did:web:')).toBe(false);
    expect(resolver.validateDID('did:web:example.com/')).toBe(false);
  });

  it('should convert root domain to .well-known URL', () => {
    // Access private method via any cast for testing
    const url = (resolver as any).didToUrl('did:web:example.com');
    expect(url).toBe('https://example.com/.well-known/did.json');
  });

  it('should convert path-based DID to URL', () => {
    const url = (resolver as any).didToUrl('did:web:example.com:user:alice');
    expect(url).toBe('https://example.com/user/alice/did.json');
  });

  it('should handle port encoding', () => {
    const url = (resolver as any).didToUrl('did:web:example.com%3A8080');
    expect(url).toBe('https://example.com:8080/.well-known/did.json');
  });

  it('should return notFound for non-existent DIDs', async () => {
    const did = 'did:web:nonexistent-domain-12345.example';
    const result = await resolver.resolve(did, { cache: false, timeout: 3000 });

    expect(result.didResolutionMetadata.error).toBe('notFound');
  });

  it('should validate DID document id matches', () => {
    const didDocument = {
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: 'did:web:example.com',
      verificationMethod: [],
    };

    const validation = (resolver as any).validateDidDocument(
      didDocument,
      'did:web:example.com'
    );
    expect(validation.valid).toBe(true);
  });

  it('should reject DID document with mismatched id', () => {
    const didDocument = {
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: 'did:web:other.com',
      verificationMethod: [],
    };

    const validation = (resolver as any).validateDidDocument(
      didDocument,
      'did:web:example.com'
    );
    expect(validation.valid).toBe(false);
  });
});

describe('InMemoryCache', () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache(100); // 100ms cleanup interval for testing
  });

  afterEach(() => {
    cache.destroy();
  });

  it('should store and retrieve entries', async () => {
    const entry = {
      didDocument: { id: 'did:test:123' } as any,
      metadata: {},
      timestamp: Date.now(),
      ttl: 3600,
    };

    await cache.set('did:test:123', entry);
    const retrieved = await cache.get('did:test:123');

    expect(retrieved).toEqual(entry);
  });

  it('should return null for non-existent entries', async () => {
    const result = await cache.get('did:test:nonexistent');
    expect(result).toBeNull();
  });

  it('should expire entries after TTL', async () => {
    const entry = {
      didDocument: { id: 'did:test:123' } as any,
      metadata: {},
      timestamp: Date.now(),
      ttl: 1, // 1 second TTL
    };

    await cache.set('did:test:123', entry);

    // Should exist immediately
    let retrieved = await cache.get('did:test:123');
    expect(retrieved).not.toBeNull();

    // Wait for expiry
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Should be expired
    retrieved = await cache.get('did:test:123');
    expect(retrieved).toBeNull();
  });

  it('should delete entries', async () => {
    const entry = {
      didDocument: { id: 'did:test:123' } as any,
      metadata: {},
      timestamp: Date.now(),
      ttl: 3600,
    };

    await cache.set('did:test:123', entry);
    await cache.delete('did:test:123');

    const retrieved = await cache.get('did:test:123');
    expect(retrieved).toBeNull();
  });

  it('should clear all entries', async () => {
    await cache.set('did:test:1', {
      didDocument: { id: 'did:test:1' } as any,
      metadata: {},
      timestamp: Date.now(),
      ttl: 3600,
    });

    await cache.set('did:test:2', {
      didDocument: { id: 'did:test:2' } as any,
      metadata: {},
      timestamp: Date.now(),
      ttl: 3600,
    });

    await cache.clear();

    expect(await cache.get('did:test:1')).toBeNull();
    expect(await cache.get('did:test:2')).toBeNull();
  });
});

describe('DID Method Validation', () => {
  it('should validate did:web DIDs', () => {
    const resolver = new DidWebResolver();
    expect(resolver.validateDID('did:web:example.com')).toBe(true);
    expect(resolver.validateDID('did:key:z123')).toBe(false);
  });

  it('should validate did:key DIDs', () => {
    const resolver = new DidKeyResolver();
    expect(resolver.validateDID('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK')).toBe(true);
    expect(resolver.validateDID('did:web:example.com')).toBe(false);
  });

  it('should validate did:ethr DIDs', () => {
    const resolver = new DidEthrResolver(new Map());
    expect(resolver.validateDID('did:ethr:0x1234567890123456789012345678901234567890')).toBe(true);
    expect(resolver.validateDID('did:ethr:mainnet:0x1234567890123456789012345678901234567890')).toBe(true);
    expect(resolver.validateDID('did:ethr:invalid')).toBe(false);
  });

  it('should validate did:ion DIDs', () => {
    const resolver = new DidIonResolver();
    expect(resolver.validateDID('did:ion:EiClkZMDxPKqC9c-umQfTkR8vvZ9JPhl_xLDI9Nfk38w5w')).toBe(true);
    expect(resolver.validateDID('did:ion:invalid!')).toBe(false);
  });
});

describe('Resolution Metadata', () => {
  it('should include duration in metadata', async () => {
    const resolver = new DidKeyResolver();
    const result = await resolver.resolve('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK');

    expect(result.didResolutionMetadata.duration).toBeDefined();
    expect(typeof result.didResolutionMetadata.duration).toBe('number');
    expect(result.didResolutionMetadata.duration).toBeGreaterThan(0);
  });

  it('should indicate cache usage', async () => {
    const cache = new InMemoryCache();
    const resolver = new DidWebResolver(cache);

    // Manually add to cache
    const did = 'did:web:example.com';
    await cache.set(did, {
      didDocument: {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: did,
        verificationMethod: [],
        authentication: [],
        assertionMethod: [],
      },
      metadata: {},
      timestamp: Date.now(),
      ttl: 3600,
    });

    const result = await resolver.resolve(did);
    expect(result.didResolutionMetadata.cached).toBe(true);

    cache.destroy();
  });
});
