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
 * did:web DID Method Resolver
 *
 * Spec: https://w3c-ccg.github.io/did-method-web/
 *
 * Resolution rules:
 * - did:web:example.com -> https://example.com/.well-known/did.json
 * - did:web:example.com:user:alice -> https://example.com/user/alice/did.json
 * - did:web:example.com%3A8080:user:alice -> https://example.com:8080/user/alice/did.json
 *
 * Features:
 * - HTTPS-only resolution (HTTP upgrade)
 * - .well-known/did.json for domain root
 * - Path-based resolution for sub-resources
 * - Port specification with %3A encoding
 * - Offline fallback to cache
 */
export class DidWebResolver implements DIDResolver {
  readonly method = 'web';
  private cache?: ResolverCache;
  private httpTimeout: number;

  constructor(cache?: ResolverCache, httpTimeout: number = 5000) {
    this.cache = cache;
    this.httpTimeout = httpTimeout;
  }

  validateDID(did: string): boolean {
    // did:web:<domain>:<path>*
    const pattern = /^did:web:[a-zA-Z0-9._%-]+(:[a-zA-Z0-9._%-]+)*$/;
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
      resolutionMetadata.message = 'DID format is invalid for did:web method';
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

    // Build HTTPS URL from DID
    const url = this.didToUrl(did);

    try {
      // Fetch DID document
      const timeout = options?.timeout || this.httpTimeout;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: options?.accept || 'application/did+json, application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          // Try offline fallback
          if (options?.fallbackToCache && this.cache) {
            const cached = await this.cache.get(did);
            if (cached) {
              resolutionMetadata.cached = true;
              resolutionMetadata.message = 'Resolved from cache after network failure';
              resolutionMetadata.duration = Date.now() - startTime;

              return {
                didDocument: cached.didDocument,
                didResolutionMetadata: resolutionMetadata,
                didDocumentMetadata: cached.metadata,
              };
            }
          }

          resolutionMetadata.error = 'notFound';
          resolutionMetadata.message = `DID document not found at ${url}`;
        } else {
          resolutionMetadata.error = 'networkError';
          resolutionMetadata.message = `HTTP ${response.status}: ${response.statusText}`;
        }

        resolutionMetadata.duration = Date.now() - startTime;
        return {
          didDocument: null,
          didResolutionMetadata: resolutionMetadata,
          didDocumentMetadata: {},
        };
      }

      // Parse DID document
      const contentType = response.headers.get('Content-Type') || '';
      const didDocument = await response.json();

      // Validate DID document
      const validation = this.validateDidDocument(didDocument, did);
      if (!validation.valid) {
        resolutionMetadata.error = 'invalidDidDocument';
        resolutionMetadata.message = validation.error;
        resolutionMetadata.duration = Date.now() - startTime;

        return {
          didDocument: null,
          didResolutionMetadata: resolutionMetadata,
          didDocumentMetadata: {},
        };
      }

      // Extract metadata from response headers
      const didDocumentMetadata: DIDDocumentMetadata = {};
      const lastModified = response.headers.get('Last-Modified');
      if (lastModified) {
        didDocumentMetadata.updated = new Date(lastModified).toISOString();
      }

      // Cache the result
      if (options?.cache !== false && this.cache) {
        const ttl = options?.cacheTTL || 3600; // 1 hour default
        await this.cache.set(did, {
          didDocument,
          metadata: didDocumentMetadata,
          timestamp: Date.now(),
          ttl,
        });
      }

      resolutionMetadata.contentType = contentType;
      resolutionMetadata.duration = Date.now() - startTime;

      return {
        didDocument,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata,
      };
    } catch (error: any) {
      // Handle network errors
      if (error.name === 'AbortError') {
        resolutionMetadata.error = 'timeout';
        resolutionMetadata.message = `Resolution timeout after ${timeout}ms`;
      } else {
        // Try offline fallback
        if (options?.fallbackToCache && this.cache) {
          const cached = await this.cache.get(did);
          if (cached) {
            resolutionMetadata.cached = true;
            resolutionMetadata.message = 'Resolved from cache after network error';
            resolutionMetadata.duration = Date.now() - startTime;

            return {
              didDocument: cached.didDocument,
              didResolutionMetadata: resolutionMetadata,
              didDocumentMetadata: cached.metadata,
            };
          }
        }

        resolutionMetadata.error = 'networkError';
        resolutionMetadata.message = error.message || 'Network request failed';
      }

      resolutionMetadata.duration = Date.now() - startTime;
      return {
        didDocument: null,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata: {},
      };
    }
  }

  /**
   * Convert did:web DID to HTTPS URL
   *
   * Examples:
   * - did:web:example.com -> https://example.com/.well-known/did.json
   * - did:web:example.com:user:alice -> https://example.com/user/alice/did.json
   * - did:web:example.com%3A8080 -> https://example.com:8080/.well-known/did.json
   */
  private didToUrl(did: string): string {
    // Remove did:web: prefix
    const parts = did.replace('did:web:', '').split(':');

    // First part is domain (may contain %3A for port)
    const domain = parts[0].replace(/%3A/g, ':');

    // Remaining parts are path
    const path = parts.slice(1);

    if (path.length === 0) {
      // Root domain: use .well-known
      return `https://${domain}/.well-known/did.json`;
    } else {
      // Sub-resource: use path-based resolution
      return `https://${domain}/${path.join('/')}/did.json`;
    }
  }

  /**
   * Validate DID document structure and id matching
   */
  private validateDidDocument(
    didDocument: any,
    expectedDid: string
  ): { valid: boolean; error?: string } {
    if (!didDocument || typeof didDocument !== 'object') {
      return { valid: false, error: 'DID document must be a JSON object' };
    }

    if (!didDocument.id) {
      return { valid: false, error: 'DID document missing required "id" field' };
    }

    if (didDocument.id !== expectedDid) {
      return {
        valid: false,
        error: `DID document id "${didDocument.id}" does not match requested DID "${expectedDid}"`,
      };
    }

    if (!didDocument['@context']) {
      return { valid: false, error: 'DID document missing required "@context" field' };
    }

    // Ensure @context includes DID v1 context
    const contexts = Array.isArray(didDocument['@context'])
      ? didDocument['@context']
      : [didDocument['@context']];

    if (!contexts.includes('https://www.w3.org/ns/did/v1')) {
      return {
        valid: false,
        error: 'DID document @context must include https://www.w3.org/ns/did/v1',
      };
    }

    return { valid: true };
  }
}
