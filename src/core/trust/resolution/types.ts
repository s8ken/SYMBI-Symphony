import { DIDDocument } from '../types';

/**
 * DID Resolution Options
 */
export interface DIDResolutionOptions {
  accept?: string;
  cache?: boolean;
  cacheTTL?: number; // seconds
  timeout?: number; // milliseconds
  fallbackToCache?: boolean;
}

/**
 * DID Resolution Result
 * Based on W3C DID Core Resolution spec
 */
export interface DIDResolutionResult {
  didDocument: DIDDocument | null;
  didResolutionMetadata: DIDResolutionMetadata;
  didDocumentMetadata: DIDDocumentMetadata;
}

/**
 * DID Resolution Metadata
 */
export interface DIDResolutionMetadata {
  contentType?: string;
  error?: DIDResolutionError;
  message?: string;
  duration?: number; // milliseconds
  cached?: boolean;
  cacheExpiry?: Date;
}

/**
 * DID Document Metadata
 */
export interface DIDDocumentMetadata {
  created?: string;
  updated?: string;
  deactivated?: boolean;
  nextUpdate?: string;
  versionId?: string;
  nextVersionId?: string;
  equivalentId?: string[];
  canonicalId?: string;
}

/**
 * DID Resolution Errors (W3C standard)
 */
export type DIDResolutionError =
  | 'invalidDid'
  | 'notFound'
  | 'representationNotSupported'
  | 'methodNotSupported'
  | 'invalidDidDocument'
  | 'invalidDidDocumentLength'
  | 'timeout'
  | 'networkError'
  | 'internalError';

/**
 * Base interface for DID method resolvers
 */
export interface DIDResolver {
  readonly method: string;
  resolve(did: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult>;
  validateDID(did: string): boolean;
}

/**
 * Cache entry structure
 */
export interface CacheEntry {
  didDocument: DIDDocument;
  metadata: DIDDocumentMetadata;
  timestamp: number;
  ttl: number; // seconds
}
