import { UniversalResolver } from './resolver';
import { DidEthrResolver, Web3Provider } from './did-ethr.resolver';
import { DidIonResolver } from './did-ion.resolver';
import { ResolverCache, InMemoryCache } from './cache';

/**
 * Configuration for automatic DID method enablement
 */
export interface AutoDIDConfig {
  /** Enable did:ethr with default or custom Web3 providers */
  ethr?: {
    enabled: boolean;
    /** Custom Web3 providers (network name -> provider) */
    providers?: Map<string, Web3Provider>;
    /** Default networks to enable if no custom providers specified */
    defaultNetworks?: string[];
  };
  
  /** Enable did:ion with default or custom ION nodes */
  ion?: {
    enabled: boolean;
    /** Custom ION node URLs */
    nodes?: string[];
    /** Use default ION mainnet nodes if no custom nodes specified */
    useDefaults?: boolean;
  };
  
  /** Custom cache implementation */
  cache?: ResolverCache;
}

/**
 * Default Web3 provider configurations for common networks
 */
const DEFAULT_WEB3_PROVIDERS = new Map<string, string>([
  ['mainnet', 'https://mainnet.infura.io/v3/'],
  ['goerli', 'https://goerli.infura.io/v3/'],
  ['sepolia', 'https://sepolia.infura.io/v3/'],
  ['polygon', 'https://polygon-rpc.com/'],
  ['arbitrum', 'https://arb1.arbitrum.io/rpc'],
]);

/**
 * Default ION node URLs
 */
const DEFAULT_ION_NODES = [
  'https://ion.msidentity.com',
  'https://beta.ion.msidentity.com',
];

/**
 * Create Web3 providers from configuration
 */
function createWeb3Providers(config: AutoDIDConfig['ethr']): Map<string, Web3Provider> | undefined {
  if (!config?.enabled) return undefined;

  // Use custom providers if specified
  if (config.providers) {
    return config.providers;
  }

  // Create default providers for specified networks
  const networks = config.defaultNetworks || ['mainnet'];
  const providers = new Map<string, Web3Provider>();

  for (const network of networks) {
    const rpcUrl = DEFAULT_WEB3_PROVIDERS.get(network);
    if (rpcUrl) {
      // Create a simple Web3Provider-compatible object
      providers.set(network, {
        async call(transaction: { to: string; data: string }): Promise<string> {
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now(),
              method: 'eth_call',
              params: [transaction, 'latest'],
            }),
          });
          const data = await response.json() as any;
          if (data.error) throw new Error(data.error.message);
          return data.result;
        },
        async getNetwork(): Promise<{ chainId: number; name: string }> {
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now(),
              method: 'eth_chainId',
              params: [],
            }),
          });
          const data = await response.json() as any;
          if (data.error) throw new Error(data.error.message);
          const chainId = parseInt(data.result, 16);
          return { chainId, name: network };
        },
      });
    }
  }

  return providers.size > 0 ? providers : undefined;
}

/**
 * Get ION nodes from configuration
 */
function getIonNodes(config: AutoDIDConfig['ion']): string[] | undefined {
  if (!config?.enabled) return undefined;

  // Use custom nodes if specified
  if (config.nodes && config.nodes.length > 0) {
    return config.nodes;
  }

  // Use default nodes if requested
  if (config.useDefaults !== false) {
    return DEFAULT_ION_NODES;
  }

  return undefined;
}

/**
 * Create a UniversalResolver with automatic DID method enablement
 * 
 * This function provides out-of-the-box registration for did:ethr and did:ion
 * with sensible defaults, while still allowing customization.
 * 
 * @param config Configuration for automatic enablement
 * @returns Configured UniversalResolver
 * 
 * @example
 * ```typescript
 * // Enable both did:ethr and did:ion with defaults
 * const resolver = createAutoConfiguredResolver({
 *   ethr: { enabled: true },
 *   ion: { enabled: true }
 * });
 * 
 * // Enable did:ethr with specific networks
 * const resolver = createAutoConfiguredResolver({
 *   ethr: { 
 *     enabled: true, 
 *     defaultNetworks: ['mainnet', 'polygon'] 
 *   }
 * });
 * 
 * // Enable did:ion with custom nodes
 * const resolver = createAutoConfiguredResolver({
 *   ion: { 
 *     enabled: true, 
 *     nodes: ['https://my-ion-node.com'] 
 *   }
 * });
 * ```
 */
export function createAutoConfiguredResolver(config: AutoDIDConfig = {}): UniversalResolver {
  const cache = config.cache || new InMemoryCache();
  const resolver = new UniversalResolver(cache);

  // Auto-register did:ethr if enabled
  const web3Providers = createWeb3Providers(config.ethr);
  if (web3Providers) {
    try {
      const ethrResolver = new DidEthrResolver(web3Providers, cache);
      resolver.registerResolver(ethrResolver);
    } catch (error) {
      console.warn('Failed to register did:ethr resolver:', error);
    }
  }

  // Auto-register did:ion if enabled
  const ionNodes = getIonNodes(config.ion);
  if (ionNodes) {
    try {
      const ionResolver = new DidIonResolver(ionNodes, cache);
      resolver.registerResolver(ionResolver);
    } catch (error) {
      console.warn('Failed to register did:ion resolver:', error);
    }
  }

  return resolver;
}

/**
 * Create a fully-enabled resolver with all supported DID methods
 * 
 * This is a convenience function that enables all DID methods with
 * reasonable defaults for production use.
 * 
 * @param options Optional configuration overrides
 * @returns UniversalResolver with all methods enabled
 */
export function createFullyEnabledResolver(options: {
  ethrNetworks?: string[];
  ionNodes?: string[];
  cache?: ResolverCache;
} = {}): UniversalResolver {
  return createAutoConfiguredResolver({
    ethr: {
      enabled: true,
      defaultNetworks: options.ethrNetworks || ['mainnet', 'polygon'],
    },
    ion: {
      enabled: true,
      nodes: options.ionNodes,
      useDefaults: !options.ionNodes,
    },
    cache: options.cache,
  });
}

/**
 * Environment-based auto-configuration
 * 
 * Automatically enables DID methods based on environment variables:
 * - ENABLE_DID_ETHR=true
 * - ENABLE_DID_ION=true
 * - ETHR_NETWORKS=mainnet,polygon
 * - ION_NODES=https://node1.com,https://node2.com
 * - INFURA_PROJECT_ID=your_project_id
 */
export function createResolverFromEnvironment(): UniversalResolver {
  const config: AutoDIDConfig = {};

  // Configure did:ethr from environment
  if (process.env.ENABLE_DID_ETHR === 'true') {
    config.ethr = { enabled: true };
    
    if (process.env.ETHR_NETWORKS) {
      config.ethr.defaultNetworks = process.env.ETHR_NETWORKS.split(',').map(n => n.trim());
    }

    // If Infura project ID is available, use it for default providers
    if (process.env.INFURA_PROJECT_ID) {
      const providers = new Map<string, Web3Provider>();
      const networks = config.ethr.defaultNetworks || ['mainnet'];
      
      for (const network of networks) {
        const baseUrl = DEFAULT_WEB3_PROVIDERS.get(network);
        if (baseUrl && baseUrl.includes('infura.io')) {
          const rpcUrl = baseUrl + process.env.INFURA_PROJECT_ID;
          providers.set(network, {
            async call(transaction: { to: string; data: string }): Promise<string> {
              const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: Date.now(),
                  method: 'eth_call',
                  params: [transaction, 'latest'],
                }),
              });
              const data = await response.json() as any;
              if (data.error) throw new Error(data.error.message);
              return data.result;
            },
            async getNetwork(): Promise<{ chainId: number; name: string }> {
              const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: Date.now(),
                  method: 'eth_chainId',
                  params: [],
                }),
              });
              const data = await response.json() as any;
              if (data.error) throw new Error(data.error.message);
              const chainId = parseInt(data.result, 16);
              return { chainId, name: network };
            },
          });
        }
      }
      
      if (providers.size > 0) {
        config.ethr.providers = providers;
      }
    }
  }

  // Configure did:ion from environment
  if (process.env.ENABLE_DID_ION === 'true') {
    config.ion = { enabled: true };
    
    if (process.env.ION_NODES) {
      config.ion.nodes = process.env.ION_NODES.split(',').map(n => n.trim());
    } else {
      config.ion.useDefaults = true;
    }
  }

  return createAutoConfiguredResolver(config);
}

/**
 * Global auto-configured resolver instance
 */
let globalAutoResolver: UniversalResolver | null = null;

/**
 * Get or create global auto-configured resolver
 * 
 * This resolver is automatically configured based on environment variables
 * and provides a drop-in replacement for the standard global resolver.
 */
export function getGlobalAutoResolver(): UniversalResolver {
  if (!globalAutoResolver) {
    globalAutoResolver = createResolverFromEnvironment();
  }
  return globalAutoResolver;
}

/**
 * Set global auto-configured resolver
 */
export function setGlobalAutoResolver(resolver: UniversalResolver): void {
  globalAutoResolver = resolver;
}