import { DIDDocument } from '../types';
import {
  DIDResolver,
  DIDResolutionResult,
  DIDResolutionOptions,
  DIDResolutionMetadata,
} from './types';
import { ResolverCache, InMemoryCache } from './cache';
import { DidWebResolver } from './did-web.resolver';
import { DidKeyResolver } from './did-key.resolver';
import { DidEthrResolver, Web3Provider } from './did-ethr.resolver';
import { DidIonResolver } from './did-ion.resolver';

/**
 * Universal DID Resolver
 *
 * Routes resolution requests to appropriate method-specific resolvers
 * based on the DID method in the identifier.
 *
 * Supports:
 * - did:web - Domain-based DIDs with HTTPS resolution
 * - did:key - Self-contained cryptographic DIDs
 * - did:ethr - Ethereum-based DIDs using ERC-1056
 * - did:ion - Bitcoin-anchored Sidetree DIDs
 *
 * Usage:
 * ```typescript
 * const resolver = new UniversalResolver();
 * const result = await resolver.resolve('did:web:example.com');
 * ```
 */
export class UniversalResolver {
  private resolvers: Map<string, DIDResolver>;
  private cache?: ResolverCache;

  constructor(cache?: ResolverCache) {
    this.cache = cache || new InMemoryCache();
    this.resolvers = new Map();

    // Register default resolvers
    this.registerResolver(new DidWebResolver(this.cache));
    this.registerResolver(new DidKeyResolver());
    // did:ethr and did:ion require external dependencies, so they're not auto-registered
  }

  /**
   * Register a DID method resolver
   */
  registerResolver(resolver: DIDResolver): void {
    this.resolvers.set(resolver.method, resolver);
  }

  /**
   * Unregister a DID method resolver
   */
  unregisterResolver(method: string): void {
    this.resolvers.delete(method);
  }

  /**
   * Get registered resolver for a method
   */
  getResolver(method: string): DIDResolver | undefined {
    return this.resolvers.get(method);
  }

  /**
   * Get all registered methods
   */
  getSupportedMethods(): string[] {
    return Array.from(this.resolvers.keys());
  }

  /**
   * Resolve a DID to its DID Document
   *
   * @param did - The DID to resolve
   * @param options - Resolution options
   * @returns Resolution result with DID document and metadata
   */
  async resolve(
    did: string,
    options?: DIDResolutionOptions
  ): Promise<DIDResolutionResult> {
    const startTime = Date.now();
    const resolutionMetadata: DIDResolutionMetadata = {};

    // Validate basic DID format
    if (!this.isValidDID(did)) {
      resolutionMetadata.error = 'invalidDid';
      resolutionMetadata.message = 'DID must start with "did:" followed by method and identifier';
      resolutionMetadata.duration = Date.now() - startTime;
      return {
        didDocument: null,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata: {},
      };
    }

    // Extract method from DID
    const method = this.extractMethod(did);
    if (!method) {
      resolutionMetadata.error = 'invalidDid';
      resolutionMetadata.message = 'Could not extract DID method';
      resolutionMetadata.duration = Date.now() - startTime;
      return {
        didDocument: null,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata: {},
      };
    }

    // Get resolver for method
    const resolver = this.resolvers.get(method);
    if (!resolver) {
      resolutionMetadata.error = 'methodNotSupported';
      resolutionMetadata.message = `No resolver registered for method: ${method}`;
      resolutionMetadata.duration = Date.now() - startTime;
      return {
        didDocument: null,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata: {},
      };
    }

    // Delegate to method-specific resolver
    try {
      return await resolver.resolve(did, options);
    } catch (error: any) {
      resolutionMetadata.error = 'internalError';
      resolutionMetadata.message = error.message || 'Resolution failed';
      resolutionMetadata.duration = Date.now() - startTime;
      return {
        didDocument: null,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata: {},
      };
    }
  }

  /**
   * Batch resolve multiple DIDs concurrently
   */
  async resolveMany(
    dids: string[],
    options?: DIDResolutionOptions
  ): Promise<Map<string, DIDResolutionResult>> {
    const results = new Map<string, DIDResolutionResult>();

    await Promise.all(
      dids.map(async (did) => {
        const result = await this.resolve(did, options);
        results.set(did, result);
      })
    );

    return results;
  }

  /**
   * Validate basic DID format
   */
  private isValidDID(did: string): boolean {
    // Basic format: did:<method>:<method-specific-id>
    const pattern = /^did:[a-z0-9]+:.+$/;
    return pattern.test(did);
  }

  /**
   * Extract method from DID
   */
  private extractMethod(did: string): string | null {
    const match = did.match(/^did:([a-z0-9]+):/);
    return match ? match[1] : null;
  }

  /**
   * Clear resolution cache
   */
  async clearCache(did?: string): Promise<void> {
    if (!this.cache) return;

    if (did) {
      await this.cache.delete(did);
    } else {
      await this.cache.clear();
    }
  }
}

/**
 * Create a universal resolver with common configuration
 */
export function createUniversalResolver(config?: {
  cache?: ResolverCache;
  web3Providers?: Map<string, Web3Provider>;
  ionNodes?: string[];
}): UniversalResolver {
  const cache = config?.cache || new InMemoryCache();
  const resolver = new UniversalResolver(cache);

  // Register did:ethr if Web3 providers available
  if (config?.web3Providers) {
    const ethrResolver = new DidEthrResolver(config.web3Providers, cache);
    resolver.registerResolver(ethrResolver);
  }

  // Register did:ion if ION nodes specified
  if (config?.ionNodes) {
    const ionResolver = new DidIonResolver(config.ionNodes, cache);
    resolver.registerResolver(ionResolver);
  }

  return resolver;
}

/**
 * Global resolver instance (lazy initialization)
 */
let globalResolver: UniversalResolver | null = null;

/**
 * Get or create global resolver instance
 */
export function getGlobalResolver(): UniversalResolver {
  if (!globalResolver) {
    globalResolver = new UniversalResolver();
  }
  return globalResolver;
}

/**
 * Set global resolver instance
 */
export function setGlobalResolver(resolver: UniversalResolver): void {
  globalResolver = resolver;
}

/**
 * Convenience function to resolve a DID using global resolver
 */
export async function resolveDID(
  did: string,
  options?: DIDResolutionOptions
): Promise<DIDResolutionResult> {
  return getGlobalResolver().resolve(did, options);
}
