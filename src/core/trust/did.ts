/**
 * Decentralized Identifier (DID) Manager
 * Handles DID generation and resolution
 */

import { DIDDocument, VerificationMethod, ServiceEndpoint } from '../agent/types';
import { UniversalResolver, resolveDID } from './resolution/resolver';

export type DIDMethod = 'web' | 'key' | 'ethr' | 'ion';

export interface DIDGenerationOptions {
  method: DIDMethod;
  identifier?: string;
  domain?: string;  // For did:web
  publicKey?: string;
}

export class DIDManager {
  private universalResolver: UniversalResolver;

  constructor() {
    // Initialize the universal resolver
    this.universalResolver = new UniversalResolver();
  }

  /**
   * Generate a DID for an agent
   */
  generateDID(agentId: string, options: DIDGenerationOptions): string {
    const { method, identifier, domain } = options;

    switch (method) {
      case 'web':
        // did:web:domain:agents:agentId
        const webDomain = domain || 'symbi.trust';
        return `did:web:${webDomain}:agents:${agentId}`;

      case 'key':
        // did:key:publicKeyMultibase
        const keyId = identifier || this.generateKeyIdentifier();
        return `did:key:${keyId}`;

      case 'ethr':
        // did:ethr:address
        const ethAddress = identifier || this.generateEthereumAddress();
        return `did:ethr:${ethAddress}`;

      case 'ion':
        // did:ion:identifier
        const ionId = identifier || this.generateIONIdentifier();
        return `did:ion:${ionId}`;

      default:
        throw new Error(`Unsupported DID method: ${method}`);
    }
  }

  /**
   * Create a DID document for an agent
   */
  createDIDDocument(did: string, options: {
    publicKey?: string;
    serviceEndpoint?: string;
  }): DIDDocument {
    const verificationMethod: VerificationMethod = {
      id: `${did}#key-1`,
      type: 'Ed25519VerificationKey2020',
      controller: did,
      publicKeyMultibase: options.publicKey || this.generatePublicKey()
    };

    const services: ServiceEndpoint[] = [];
    if (options.serviceEndpoint) {
      services.push({
        id: `${did}#trust-endpoint`,
        type: 'SymbiTrustProtocol',
        serviceEndpoint: options.serviceEndpoint
      });
    }

    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      id: did,
      verificationMethod: [verificationMethod],
      authentication: ['#key-1'],
      assertionMethod: ['#key-1'],
      service: services.length > 0 ? services : undefined
    };
  }

  /**
   * Resolve a DID to its DID document
   */
  async resolveDID(did: string): Promise<DIDDocument | null> {
    try {
      const result = await this.universalResolver.resolve(did);
      return result.didDocument;
    } catch (error) {
      console.error(`Failed to resolve DID ${did}:`, error);
      return null;
    }
  }

  /**
   * Extract method from DID
   */
  extractDIDMethod(did: string): DIDMethod | null {
    const match = did.match(/^did:([a-z0-9]+):/);
    if (!match) return null;

    const method = match[1];
    if (['web', 'key', 'ethr', 'ion'].includes(method)) {
      return method as DIDMethod;
    }

    return null;
  }

  /**
   * Generate a key identifier for did:key
   */
  private generateKeyIdentifier(): string {
    // Simplified - in production, this would be a proper multibase-encoded public key
    return 'z' + this.generateRandomString(48);
  }

  /**
   * Generate an Ethereum address for did:ethr
   */
  private generateEthereumAddress(): string {
    // Simplified - in production, this would be a real Ethereum address
    return '0x' + this.generateRandomString(40, '0123456789abcdef');
  }

  /**
   * Generate an ION identifier
   */
  private generateIONIdentifier(): string {
    // Simplified - in production, this would be a real ION identifier
    return 'EiD' + this.generateRandomString(42);
  }

  /**
   * Generate a public key (placeholder)
   */
  private generatePublicKey(): string {
    // Simplified - in production, this would be a real public key
    return 'z' + this.generateRandomString(48);
  }

  /**
   * Generate random string
   */
  private generateRandomString(length: number, charset?: string): string {
    const chars = charset || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Verify DID ownership (placeholder)
   */
  async verifyDIDOwnership(did: string, proof: any): Promise<boolean> {
    // TODO: Implement actual ownership verification
    // This would involve verifying a signature with the DID's public key

    return true;
  }
}

// Export singleton instance
export const didManager = new DIDManager();