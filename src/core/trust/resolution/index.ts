/**
 * DID Resolution Module
 *
 * Provides DID resolution infrastructure for the SYMBI Trust Protocol.
 *
 * Supported DID Methods:
 * - did:web - HTTPS-based resolution with .well-known support
 * - did:key - Stateless cryptographic DIDs
 * - did:ethr - Ethereum-based DIDs using ERC-1056
 * - did:ion - Bitcoin-anchored Sidetree DIDs
 *
 * @module trust/resolution
 */

// Core types
export * from './types';

// Cache implementations
export * from './cache';

// Method-specific resolvers
export { DidWebResolver } from './did-web.resolver';
export { DidKeyResolver } from './did-key.resolver';
export { DidEthrResolver, Web3Provider } from './did-ethr.resolver';
export { DidIonResolver, IONNodeClient, SidetreeOperation } from './did-ion.resolver';

// Universal resolver
export {
  UniversalResolver,
  createUniversalResolver,
  getGlobalResolver,
  setGlobalResolver,
  resolveDID,
} from './resolver';

// Auto-configuration for streamlined DID method enablement
export {
  AutoDIDConfig,
  createAutoConfiguredResolver,
  createFullyEnabledResolver,
  createResolverFromEnvironment,
  getGlobalAutoResolver,
  setGlobalAutoResolver,
} from './auto-config';
