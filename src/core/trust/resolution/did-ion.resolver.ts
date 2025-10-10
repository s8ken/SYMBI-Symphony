import { DIDDocument } from '../types';
import {
  DIDResolver,
  DIDResolutionResult,
  DIDResolutionOptions,
  DIDResolutionMetadata,
  DIDDocumentMetadata,
} from './types';
import { ResolverCache } from './cache';

/**
 * Sidetree Operation Type
 */
export type SidetreeOperationType = 'create' | 'update' | 'recover' | 'deactivate';

/**
 * Sidetree Operation Interface
 */
export interface SidetreeOperation {
  type: SidetreeOperationType;
  didSuffix: string;
  revealValue?: string;
  delta?: any;
  signedData?: string;
}

/**
 * ION Node Client Interface
 * Abstraction for ION node communication
 */
export interface IONNodeClient {
  resolve(did: string): Promise<{
    didDocument: DIDDocument | null;
    metadata: DIDDocumentMetadata;
  }>;
  getOperations(didSuffix: string): Promise<SidetreeOperation[]>;
}

/**
 * did:ion DID Method Resolver
 *
 * Spec: https://github.com/decentralized-identity/ion
 *
 * ION (Identity Overlay Network) is a Layer 2 DID network built on Bitcoin
 * using the Sidetree protocol. It provides scalable, decentralized identity
 * without requiring tokens or special utility.
 *
 * Format: did:ion:<unique-suffix>[?<query-params>]
 * - did:ion:EiClkZMDxPKqC9c-umQfTkR8vvZ9JPhl_xLDI9Nfk38w5w
 * - did:ion:EiClkZMDxPKqC9c-umQfTkR8vvZ9JPhl_xLDI9Nfk38w5w?-ion-initial-state=<base64url>
 *
 * Resolution:
 * - Query ION node (typically via HTTPS API)
 * - Process Sidetree operations (create, update, recover, deactivate)
 * - Verify operation signatures and patches
 * - Reconstruct current DID document state
 *
 * Features:
 * - Long-form DIDs (embed initial state)
 * - Short-form DIDs (requires ION node resolution)
 * - Deactivation support
 * - Update/recovery key rotation
 */
export class DidIonResolver implements DIDResolver {
  readonly method = 'ion';
  private cache?: ResolverCache;
  private ionNodes: string[];
  private httpTimeout: number;

  // Default ION nodes
  private readonly DEFAULT_ION_NODES = [
    'https://ion.tbd.engineering',
    'https://ion.microsoft.com',
  ];

  constructor(
    ionNodes?: string[],
    cache?: ResolverCache,
    httpTimeout: number = 10000
  ) {
    this.ionNodes = ionNodes || this.DEFAULT_ION_NODES;
    this.cache = cache;
    this.httpTimeout = httpTimeout;
  }

  validateDID(did: string): boolean {
    // did:ion:<base64url-encoded-suffix>[?<query-params>]
    const pattern = /^did:ion:[A-Za-z0-9_-]+(\?.*)?$/;
    return pattern.test(did);
  }

  async resolve(
    did: string,
    options?: DIDResolutionOptions
  ): Promise<DIDResolutionResult> {
    const startTime = Date.now();
    const resolutionMetadata: DIDResolutionMetadata = {};

    // Validate DID format
    if (!this.validateDID(did)) {
      resolutionMetadata.error = 'invalidDid';
      resolutionMetadata.message = 'DID format is invalid for did:ion method';
      resolutionMetadata.duration = Date.now() - startTime;
      return {
        didDocument: null,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata: {},
      };
    }

    // Check if long-form DID (contains initial state)
    const isLongForm = did.includes('?');
    if (isLongForm) {
      // Long-form DIDs can be resolved stateless (not implemented in this minimal version)
      resolutionMetadata.error = 'representationNotSupported';
      resolutionMetadata.message =
        'Long-form ION DID resolution not yet implemented. Use short-form DIDs.';
      resolutionMetadata.duration = Date.now() - startTime;
      return {
        didDocument: null,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata: {},
      };
    }

    // Check cache first
    if (options?.cache !== false && this.cache) {
      const cached = await this.cache.get(did);
      if (cached) {
        resolutionMetadata.cached = true;
        resolutionMetadata.cacheExpiry = new Date(
          cached.timestamp + cached.ttl * 1000
        );
        resolutionMetadata.duration = Date.now() - startTime;

        return {
          didDocument: cached.didDocument,
          didResolutionMetadata: resolutionMetadata,
          didDocumentMetadata: cached.metadata,
        };
      }
    }

    // Try each ION node until one succeeds
    let lastError: Error | null = null;

    for (const nodeUrl of this.ionNodes) {
      try {
        const result = await this.resolveFromNode(nodeUrl, did, options);

        if (result.didDocument) {
          // Cache successful resolution
          if (options?.cache !== false && this.cache) {
            const ttl = options?.cacheTTL || 3600; // 1 hour default
            await this.cache.set(did, {
              didDocument: result.didDocument,
              metadata: result.didDocumentMetadata,
              timestamp: Date.now(),
              ttl,
            });
          }

          resolutionMetadata.contentType = 'application/did+ld+json';
          resolutionMetadata.duration = Date.now() - startTime;

          return {
            didDocument: result.didDocument,
            didResolutionMetadata: resolutionMetadata,
            didDocumentMetadata: result.didDocumentMetadata,
          };
        }
      } catch (error: any) {
        lastError = error;
        console.warn(`ION node ${nodeUrl} failed:`, error.message);
        continue;
      }
    }

    // All nodes failed
    resolutionMetadata.error = 'notFound';
    resolutionMetadata.message =
      lastError?.message || 'DID not found on any ION node';
    resolutionMetadata.duration = Date.now() - startTime;

    return {
      didDocument: null,
      didResolutionMetadata: resolutionMetadata,
      didDocumentMetadata: {},
    };
  }

  /**
   * Resolve DID from specific ION node
   */
  private async resolveFromNode(
    nodeUrl: string,
    did: string,
    options?: DIDResolutionOptions
  ): Promise<{
    didDocument: DIDDocument | null;
    didDocumentMetadata: DIDDocumentMetadata;
  }> {
    // ION node resolution endpoint: /identifiers/<did>
    const url = `${nodeUrl}/identifiers/${encodeURIComponent(did)}`;

    const timeout = options?.timeout || this.httpTimeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/did+ld+json, application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('DID not found');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response (W3C DID Resolution format)
      const resolutionResult = await response.json();

      // Extract DID document and metadata
      const didDocument = resolutionResult.didDocument || null;
      const didDocumentMetadata = resolutionResult.didDocumentMetadata || {};

      // Validate DID document if present
      if (didDocument) {
        if (didDocument.id !== did) {
          throw new Error(
            `DID document id "${didDocument.id}" does not match requested DID "${did}"`
          );
        }
      }

      return { didDocument, didDocumentMetadata };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Helper to add ION node URL
   */
  addNode(nodeUrl: string): void {
    if (!this.ionNodes.includes(nodeUrl)) {
      this.ionNodes.push(nodeUrl);
    }
  }

  /**
   * Helper to remove ION node URL
   */
  removeNode(nodeUrl: string): void {
    this.ionNodes = this.ionNodes.filter((url) => url !== nodeUrl);
  }

  /**
   * Get list of configured ION nodes
   */
  getNodes(): string[] {
    return [...this.ionNodes];
  }

  /**
   * Parse ION DID to extract suffix
   */
  static parseDid(did: string): { suffix: string; initialState?: string } {
    const parts = did.split('?');
    const suffix = parts[0].replace('did:ion:', '');

    let initialState: string | undefined;
    if (parts[1]) {
      const params = new URLSearchParams(parts[1]);
      initialState = params.get('-ion-initial-state') || undefined;
    }

    return { suffix, initialState };
  }

  /**
   * Validate ION DID suffix format (base64url without padding)
   */
  static isValidSuffix(suffix: string): boolean {
    return /^[A-Za-z0-9_-]+$/.test(suffix);
  }
}
