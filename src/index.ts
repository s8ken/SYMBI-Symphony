/**
 * SYMBI Symphony - W3C Trust Infrastructure for AI Agents
 *
 * The first production-ready W3C trust infrastructure for decentralized AI agent systems.
 *
 * @packageDocumentation
 * @module @symbi/trust-protocol
 *
 * @example
 * ```typescript
 * import { UniversalResolver, AgentFactory, verifyRemoteStatus } from '@symbi/trust-protocol';
 *
 * // Resolve a DID
 * const resolver = new UniversalResolver();
 * const result = await resolver.resolve('did:web:example.com');
 *
 * // Create a trust declaration
 * const declaration = AgentFactory.createTrustDeclaration(
 *   'agent-123',
 *   'MyAIAgent',
 *   {
 *     inspection_mandate: true,
 *     consent_architecture: true,
 *     ethical_override: true,
 *     continuous_validation: false,
 *     right_to_disconnect: false,
 *     moral_recognition: false
 *   }
 * );
 *
 * // Check revocation status
 * const statusEntry = {
 *   id: 'https://example.com/status/1#42',
 *   type: 'StatusList2021Entry',
 *   statusPurpose: 'revocation',
 *   statusListIndex: '42',
 *   statusListCredential: 'https://example.com/status/1'
 * };
 * const status = await verifyRemoteStatus(statusEntry);
 * ```
 */

// Core trust protocol exports
export * from './core/trust';

// Version information
export const VERSION = '0.1.0';
export const PROTOCOL_VERSION = '1.0.0';
