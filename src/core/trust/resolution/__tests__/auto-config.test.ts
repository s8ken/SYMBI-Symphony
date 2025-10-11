import {
  AutoDIDConfig,
  createAutoConfiguredResolver,
  createFullyEnabledResolver,
  createResolverFromEnvironment,
} from '../auto-config';
import { UniversalResolver } from '../resolver';

describe('DID Auto-Configuration', () => {
  describe('createAutoConfiguredResolver', () => {
    it('should create resolver with only default methods when no config provided', () => {
      const resolver = createAutoConfiguredResolver();
      
      expect(resolver).toBeInstanceOf(UniversalResolver);
      // Should have did:web and did:key by default
      expect(resolver.getSupportedMethods()).toContain('web');
      expect(resolver.getSupportedMethods()).toContain('key');
    });

    it('should enable did:ethr with default provider when configured', () => {
      const config: AutoDIDConfig = {
        ethr: {
          enabled: true,
        },
      };
      
      const resolver = createAutoConfiguredResolver(config);
      
      expect(resolver.getSupportedMethods()).toContain('ethr');
      expect(resolver.getSupportedMethods()).toContain('web');
      expect(resolver.getSupportedMethods()).toContain('key');
    });

    it('should enable did:ion with default nodes when configured', () => {
      const config: AutoDIDConfig = {
        ion: {
          enabled: true,
        },
      };
      
      const resolver = createAutoConfiguredResolver(config);
      
      expect(resolver.getSupportedMethods()).toContain('ion');
      expect(resolver.getSupportedMethods()).toContain('web');
      expect(resolver.getSupportedMethods()).toContain('key');
    });

    it('should enable both did:ethr and did:ion when configured', () => {
      const config: AutoDIDConfig = {
        ethr: {
          enabled: true,
        },
        ion: {
          enabled: true,
        },
      };
      
      const resolver = createAutoConfiguredResolver(config);
      
      expect(resolver.getSupportedMethods()).toContain('ethr');
      expect(resolver.getSupportedMethods()).toContain('ion');
      expect(resolver.getSupportedMethods()).toContain('web');
      expect(resolver.getSupportedMethods()).toContain('key');
    });

    it('should use custom Ethereum providers when provided', () => {
      const customProvider = {
        async call(transaction: { to: string; data: string }): Promise<string> {
          return 'custom-result';
        },
        async getNetwork(): Promise<{ chainId: number; name: string }> {
          return { chainId: 1337, name: 'custom-network' };
        },
      };

      const providers = new Map();
      providers.set('mainnet', customProvider);

      const config: AutoDIDConfig = {
        ethr: {
          enabled: true,
          providers,
        },
      };
      
      const resolver = createAutoConfiguredResolver(config);
      
      expect(resolver.getSupportedMethods()).toContain('ethr');
    });

    it('should use custom ION nodes when provided', () => {
      const config: AutoDIDConfig = {
        ion: {
          enabled: true,
          nodes: ['https://custom-ion-node.example.com'],
        },
      };
      
      const resolver = createAutoConfiguredResolver(config);
      
      expect(resolver.getSupportedMethods()).toContain('ion');
    });
  });

  describe('createFullyEnabledResolver', () => {
    it('should create resolver with all methods enabled', () => {
      const resolver = createFullyEnabledResolver();
      
      expect(resolver.getSupportedMethods()).toContain('web');
      expect(resolver.getSupportedMethods()).toContain('key');
      expect(resolver.getSupportedMethods()).toContain('ethr');
      expect(resolver.getSupportedMethods()).toContain('ion');
    });

    it('should accept custom providers and nodes', () => {
      const resolver = createFullyEnabledResolver({
        ethrNetworks: ['mainnet', 'goerli'],
        ionNodes: ['https://custom-ion.example.com'],
      });
      
      expect(resolver.getSupportedMethods()).toContain('ethr');
      expect(resolver.getSupportedMethods()).toContain('ion');
    });
  });

  describe('createResolverFromEnvironment', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create resolver with default methods when no env vars set', () => {
      const resolver = createResolverFromEnvironment();
      
      expect(resolver.getSupportedMethods()).toContain('web');
      expect(resolver.getSupportedMethods()).toContain('key');
      expect(resolver.getSupportedMethods()).not.toContain('ethr');
      expect(resolver.getSupportedMethods()).not.toContain('ion');
    });

    it('should enable did:ethr when ENABLE_DID_ETHR is set', () => {
      process.env.ENABLE_DID_ETHR = 'true';
      
      const resolver = createResolverFromEnvironment();
      
      expect(resolver.getSupportedMethods()).toContain('ethr');
    });

    it('should enable did:ion when ENABLE_DID_ION is set', () => {
      process.env.ENABLE_DID_ION = 'true';
      
      const resolver = createResolverFromEnvironment();
      
      expect(resolver.getSupportedMethods()).toContain('ion');
    });

    it('should use custom Ethereum RPC URL when provided', () => {
      process.env.ENABLE_DID_ETHR = 'true';
      process.env.ETHEREUM_RPC_URL = 'https://custom-ethereum-rpc.example.com';
      
      const resolver = createResolverFromEnvironment();
      
      expect(resolver.getSupportedMethods()).toContain('ethr');
    });

    it('should use custom ION nodes when provided', () => {
      process.env.ENABLE_DID_ION = 'true';
      process.env.ION_NODES = 'https://ion1.example.com,https://ion2.example.com';
      
      const resolver = createResolverFromEnvironment();
      
      expect(resolver.getSupportedMethods()).toContain('ion');
    });

    it('should handle boolean environment variables correctly', () => {
      // Test various truthy values
      process.env.ENABLE_DID_ETHR = '1';
      process.env.ENABLE_DID_ION = 'yes';
      
      const resolver = createResolverFromEnvironment();
      
      expect(resolver.getSupportedMethods()).toContain('ethr');
      expect(resolver.getSupportedMethods()).toContain('ion');
    });

    it('should handle falsy environment variables correctly', () => {
      process.env.ENABLE_DID_ETHR = 'false';
      process.env.ENABLE_DID_ION = '0';
      
      const resolver = createResolverFromEnvironment();
      
      expect(resolver.getSupportedMethods()).not.toContain('ethr');
      expect(resolver.getSupportedMethods()).not.toContain('ion');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid Ethereum RPC URLs gracefully', () => {
      const customProvider = {
        async call(): Promise<string> {
          throw new Error('Network error');
        },
        async getNetwork(): Promise<{ chainId: number; name: string }> {
          throw new Error('Network error');
        },
      };

      const providers = new Map();
      providers.set('mainnet', customProvider);

      const config: AutoDIDConfig = {
        ethr: {
          enabled: true,
          providers,
        },
      };
      
      // Should not throw during resolver creation
      expect(() => createAutoConfiguredResolver(config)).not.toThrow();
    });

    it('should handle empty ION nodes array', () => {
      const config: AutoDIDConfig = {
        ion: {
          enabled: true,
          nodes: [],
        },
      };
      
      // Should fall back to default nodes
      expect(() => createAutoConfiguredResolver(config)).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should create resolver that can resolve different DID methods', async () => {
      const resolver = createFullyEnabledResolver();
      
      // Test that the resolver has the expected methods
      const supportedMethods = resolver.getSupportedMethods();
      expect(supportedMethods).toContain('web');
      expect(supportedMethods).toContain('key');
      expect(supportedMethods).toContain('ethr');
      expect(supportedMethods).toContain('ion');
    });

    it('should maintain resolver configuration across multiple calls', () => {
      const config: AutoDIDConfig = {
        ethr: {
          enabled: true,
        },
        ion: {
          enabled: false,
        },
      };
      
      const resolver1 = createAutoConfiguredResolver(config);
      const resolver2 = createAutoConfiguredResolver(config);
      
      expect(resolver1.getSupportedMethods()).toEqual(resolver2.getSupportedMethods());
    });
  });
});