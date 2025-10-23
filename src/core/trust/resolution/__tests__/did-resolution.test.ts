import { UniversalResolver } from '../resolver';
import { DidWebResolver } from '../did-web.resolver';
import { DidKeyResolver } from '../did-key.resolver';
import { ResolverCache, InMemoryCache } from '../cache';

describe('DID Resolution Tests', () => {
  let resolver: UniversalResolver;
  let cache: ResolverCache;

  beforeEach(() => {
    cache = new InMemoryCache();
    resolver = new UniversalResolver(cache);
  });

  describe('UniversalResolver', () => {
    test('should register and get resolvers', () => {
      const webResolver = new DidWebResolver(cache);
      resolver.registerResolver(webResolver);
      
      expect(resolver.getResolver('web')).toBe(webResolver);
      expect(resolver.getSupportedMethods()).toContain('web');
    });

    test('should extract method from DID', () => {
      const result = (resolver as any).extractMethod('did:web:example.com');
      expect(result).toBe('web');
    });

    test('should validate DID format', () => {
      const isValid = (resolver as any).isValidDID('did:web:example.com');
      expect(isValid).toBe(true);
      
      const isInvalid = (resolver as any).isValidDID('invalid-did');
      expect(isInvalid).toBe(false);
    });

    test('should handle invalid DID format', async () => {
      const result = await resolver.resolve('invalid-did');
      expect(result.didDocument).toBeNull();
      expect(result.didResolutionMetadata.error).toBe('invalidDid');
    });

    test('should handle unsupported method', async () => {
      const result = await resolver.resolve('did:unknown:123456');
      expect(result.didDocument).toBeNull();
      expect(result.didResolutionMetadata.error).toBe('methodNotSupported');
    });
  });

  describe('did:web Resolver', () => {
    test('should validate did:web format', () => {
      const webResolver = new DidWebResolver(cache);
      expect(webResolver.validateDID('did:web:example.com')).toBe(true);
      expect(webResolver.validateDID('did:web:example.com:user:alice')).toBe(true);
      expect(webResolver.validateDID('did:web:invalid')).toBe(true); // Basic validation
    });
  });

  describe('did:key Resolver', () => {
    test('should validate did:key format', () => {
      const keyResolver = new DidKeyResolver();
      // Valid base58 encoded did:key
      expect(keyResolver.validateDID('did:key:z6MkfNwR9NsP55biyGD8y9R9GsK3Y81WV2r9m1EGyPkQr2he')).toBe(true);
      expect(keyResolver.validateDID('did:key:z')).toBe(false); // Too short
    });
  });
});