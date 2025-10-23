import { DIDDocument } from '../types';
import {
  DIDResolver,
  DIDResolutionResult,
  DIDResolutionOptions,
  DIDResolutionMetadata,
  DIDDocumentMetadata,
} from './types';
import { InMemoryCache } from './cache';

/**
 * did:web DID Method Resolver
 *
 * Spec: https://w3c-ccg.github.io/did-method-web/
 *
 * The did:web method enables discovery of DID documents hosted on
 * web servers using HTTPS. It provides a simple mapping from a
 * domain name to a DID document.
 *
 * Format: did:web:<domain>:<path>
 * Examples:
 * - did:web:example.com
 * - did:web:example.com:user:alice
 * - did:web:example.com%3A8443 (with port)
 *
 * Resolution:
 * - did:web:example.com -> https://example.com/.well-known/did.json
 * - did:web:example.com:user:alice -> https://example.com/user/alice/did.json
 */
export class DidWebResolver implements DIDResolver {
  readonly method = 'web';
  private readonly httpTimeout: number;
  private readonly cache?: import('./cache').ResolverCache;

  constructor(cache?: import('./cache').ResolverCache, httpTimeout: number = 5000) {
    this.cache = cache;
    this.httpTimeout = httpTimeout;
  }

  validateDID(did: string): boolean {
    // Basic format: did:web:<domain-and-optional-path>
    const pattern = /^did:web:[^\s]+$/;
    if (!pattern.test(did)) {
      return false;
    }

    // Extract domain part (after did:web:)
    const domainPart = did.substring(8); // Remove 'did:web:'
    
    // Should not be empty
    if (!domainPart) {
      return false;
    }

    // Should not contain invalid characters for domains
    // Basic check - should not contain slashes except as path separators
    // and should not end with a slash
    if (domainPart.endsWith('/')) {
      return false;
    }

    return true;
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
      const didDocument = await response.json() as DIDDocument;

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
        const requestTimeout = options?.timeout || this.httpTimeout;
        resolutionMetadata.error = 'timeout';
        resolutionMetadata.message = `Resolution timeout after ${requestTimeout}ms`;
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

        // DNS failures should be treated as notFound (domain doesn't exist)
        // Check for common DNS error codes and messages
        // Handle both direct errors and errors with causes (e.g., fetch failures)
        const errorCode = error.code || (error.cause && error.cause.code);
        const errorMessage = error.message || (error.cause && error.cause.message) || '';
        
        const isDnsFailure =
          errorCode === 'ENOTFOUND' ||
          errorCode === 'EAI_AGAIN' ||
          errorMessage.includes('getaddrinfo') ||
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('DNS');

        if (isDnsFailure) {
          resolutionMetadata.error = 'notFound';
          resolutionMetadata.message = `Domain not found: ${errorMessage || 'DNS lookup failed'}`;
        } else {
          resolutionMetadata.error = 'networkError';
          resolutionMetadata.message = errorMessage || 'Network request failed';
        }
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
   * Convert DID to HTTPS URL
   *
   * Examples:
   * - did:web:example.com -> https://example.com/.well-known/did.json
   * - did:web:example.com:user:alice -> https://example.com/user/alice/did.json
   * - did:web:example.com%3A8443 -> https://example.com:8443/.well-known/did.json
   */
  private didToUrl(did: string): string {
    // Remove 'did:web:' prefix
    let path = did.substring(8);

    // Handle port encoding (%3A = URL encoded colon)
    path = path.replace(/%3A/g, ':');

    // Split the entire path by colons
    const parts = path.split(':');
    
    // The first part is always the domain
    // Check if the second part is a port (numeric) or a path component
    let host = parts[0];
    let port = '';
    let pathParts: string[] = [];
    
    if (parts.length > 1) {
      // Check if the second part is all numeric (port) or has non-numeric characters (path)
      if (/^\d+$/.test(parts[1])) {
        // It's a port
        port = parts[1];
        pathParts = parts.slice(2);
      } else {
        // It's a path component
        pathParts = parts.slice(1);
      }
    }

    // Construct the URL
    let url = 'https://';
    url += host;
    if (port) {
      url += ':' + port;
    }

    if (pathParts.length > 0) {
      // Path-based DID
      url += '/' + pathParts.join('/') + '/did.json';
    } else {
      // Root domain DID
      url += '/.well-known/did.json';
    }

    return url;
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
      return { valid: false, error: 'DID document @context must include https://www.w3.org/ns/did/v1' };
    }

    return { valid: true };
  }
}