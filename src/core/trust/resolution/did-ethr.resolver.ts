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
 * Web3 Provider Interface
 * Abstraction to avoid hard dependency on specific Web3 libraries
 */
export interface Web3Provider {
  call(transaction: { to: string; data: string }): Promise<string>;
  getNetwork(): Promise<{ chainId: number; name: string }>;
}

/**
 * did:ethr DID Method Resolver
 *
 * Spec: https://github.com/decentralized-identity/ethr-did-resolver
 *
 * Format: did:ethr:<network>:<address>
 * - did:ethr:0x1234... (mainnet)
 * - did:ethr:sepolia:0x1234... (testnet)
 * - did:ethr:polygon:0x1234... (Polygon mainnet)
 *
 * Resolution:
 * - Queries ERC-1056 EthrDIDRegistry contract
 * - Supports identity owner, delegates, and attributes
 * - Caching recommended due to blockchain query costs
 *
 * Registry Events:
 * - DIDOwnerChanged: Owner transfer
 * - DIDDelegateChanged: Add/remove delegate
 * - DIDAttributeChanged: Add/update attribute
 */
export class DidEthrResolver implements DIDResolver {
  readonly method = 'ethr';
  private cache?: ResolverCache;
  private providers: Map<string, Web3Provider>;
  private registryAddress: string;

  // ERC-1056 EthrDIDRegistry contract ABI fragments
  private readonly REGISTRY_ABI = {
    identityOwner: '0x609ff1bd', // identityOwner(address)
    changed: '0xf96d0f9f', // changed(address)
    nonce: '0xaffed0e0', // nonce(address)
  };

  // Network configurations
  private readonly NETWORKS: Record<string, { chainId: number; registry: string }> = {
    mainnet: { chainId: 1, registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b' },
    sepolia: { chainId: 11155111, registry: '0x03d5003bf0e79c5f5223588f347eba39afbc3818' },
    goerli: { chainId: 5, registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b' },
    polygon: { chainId: 137, registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b' },
    mumbai: { chainId: 80001, registry: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b' },
  };

  constructor(
    providers: Map<string, Web3Provider>,
    cache?: ResolverCache,
    registryAddress?: string
  ) {
    this.providers = providers;
    this.cache = cache;
    this.registryAddress =
      registryAddress || this.NETWORKS.mainnet.registry;
  }

  validateDID(did: string): boolean {
    // did:ethr:<address> or did:ethr:<network>:<address>
    const pattern = /^did:ethr:(?:([a-z]+):)?(0x[0-9a-fA-F]{40})$/;
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
      resolutionMetadata.message = 'DID format is invalid for did:ethr method';
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

    // Parse DID
    const { network, address } = this.parseDid(did);

    // Get provider for network
    const provider = this.providers.get(network);
    if (!provider) {
      resolutionMetadata.error = 'methodNotSupported';
      resolutionMetadata.message = `No provider configured for network: ${network}`;
      resolutionMetadata.duration = Date.now() - startTime;
      return {
        didDocument: null,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata: {},
      };
    }

    try {
      // Query registry for identity owner
      const owner = await this.getIdentityOwner(provider, address);
      const lastChanged = await this.getLastChanged(provider, address);

      // Generate DID document
      const didDocument = this.generateDidDocument(did, address, owner);

      // Metadata
      const didDocumentMetadata: DIDDocumentMetadata = {};
      if (lastChanged > 0) {
        const timestamp = new Date(lastChanged * 1000).toISOString();
        didDocumentMetadata.updated = timestamp;
      }

      // Check if identity is deactivated (owner is 0x0)
      if (owner === '0x0000000000000000000000000000000000000000') {
        didDocumentMetadata.deactivated = true;
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

      resolutionMetadata.contentType = 'application/did+ld+json';
      resolutionMetadata.duration = Date.now() - startTime;

      return {
        didDocument,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata,
      };
    } catch (error: any) {
      resolutionMetadata.error = 'networkError';
      resolutionMetadata.message = error.message || 'Failed to query blockchain';
      resolutionMetadata.duration = Date.now() - startTime;

      return {
        didDocument: null,
        didResolutionMetadata: resolutionMetadata,
        didDocumentMetadata: {},
      };
    }
  }

  /**
   * Parse did:ethr into network and address
   */
  private parseDid(did: string): { network: string; address: string } {
    const match = did.match(/^did:ethr:(?:([a-z]+):)?(0x[0-9a-fA-F]{40})$/);
    if (!match) {
      throw new Error('Invalid did:ethr format');
    }

    return {
      network: match[1] || 'mainnet',
      address: match[2],
    };
  }

  /**
   * Query EthrDIDRegistry for identity owner
   */
  private async getIdentityOwner(
    provider: Web3Provider,
    address: string
  ): Promise<string> {
    const data = this.REGISTRY_ABI.identityOwner + address.slice(2).padStart(64, '0');

    const result = await provider.call({
      to: this.registryAddress,
      data,
    });

    // Extract address from result (last 20 bytes)
    return '0x' + result.slice(-40);
  }

  /**
   * Query EthrDIDRegistry for last changed block timestamp
   */
  private async getLastChanged(
    provider: Web3Provider,
    address: string
  ): Promise<number> {
    const data = this.REGISTRY_ABI.changed + address.slice(2).padStart(64, '0');

    const result = await provider.call({
      to: this.registryAddress,
      data,
    });

    // Convert hex to number
    return parseInt(result, 16);
  }

  /**
   * Generate minimal DID document for Ethereum address
   *
   * Note: Full resolution would require parsing registry events
   * to extract delegates and attributes. This is a minimal implementation
   * suitable for basic verification.
   */
  private generateDidDocument(
    did: string,
    address: string,
    owner: string
  ): DIDDocument {
    const keyId = `${did}#controller`;
    const blockchainAccountId = `eip155:1:${address}`;

    // Use owner if different from address, otherwise use address
    const controllerAddress = owner !== address ? owner : address;
    const controllerKeyId = `${did}#owner`;

    const didDocument: DIDDocument = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/secp256k1recovery-2020/v2',
      ],
      id: did,
      verificationMethod: [
        {
          id: keyId,
          type: 'EcdsaSecp256k1RecoveryMethod2020',
          controller: did,
          blockchainAccountId,
        },
      ],
      authentication: [keyId],
      assertionMethod: [keyId],
    };

    // Add controller if different from subject
    if (owner !== address) {
      didDocument.controller = `did:ethr:${controllerAddress}`;
    }

    return didDocument;
  }

  /**
   * Helper to add a Web3 provider for a network
   */
  addProvider(network: string, provider: Web3Provider): void {
    this.providers.set(network, provider);
  }

  /**
   * Helper to get registry address for network
   */
  getRegistryAddress(network: string): string | undefined {
    return this.NETWORKS[network]?.registry;
  }
}
