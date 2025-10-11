# DID Method Auto-Configuration

This document describes the streamlined DID method enablement system that provides out-of-the-box registration for `did:ethr` and `did:ion` methods.

## Overview

Previously, enabling blockchain-based DID methods like `did:ethr` and `did:ion` required manual configuration of Web3 providers and ION nodes. The auto-configuration system simplifies this process by providing sensible defaults and environment-based configuration.

## Quick Start

### Enable All Methods with Defaults

```typescript
import { createFullyEnabledResolver } from '@/core/trust/resolution';

// Creates a resolver with all DID methods enabled
const resolver = createFullyEnabledResolver();

// Now you can resolve any supported DID method
const result = await resolver.resolve('did:ethr:0x1234...');
const ionResult = await resolver.resolve('did:ion:EiD...');
```

### Custom Configuration

```typescript
import { createAutoConfiguredResolver } from '@/core/trust/resolution';

const resolver = createAutoConfiguredResolver({
  ethr: {
    enabled: true,
    defaultNetworks: ['mainnet', 'polygon', 'arbitrum']
  },
  ion: {
    enabled: true,
    nodes: ['https://my-ion-node.com']
  }
});
```

### Environment-Based Configuration

Set environment variables and use automatic configuration:

```bash
# Enable DID methods
export ENABLE_DID_ETHR=true
export ENABLE_DID_ION=true

# Configure networks and providers
export ETHR_NETWORKS=mainnet,polygon,arbitrum
export INFURA_PROJECT_ID=your_project_id

# Custom ION nodes (optional)
export ION_NODES=https://node1.com,https://node2.com
```

```typescript
import { createResolverFromEnvironment } from '@/core/trust/resolution';

// Automatically configured from environment variables
const resolver = createResolverFromEnvironment();
```

## Configuration Options

### Ethereum DID Configuration

```typescript
interface EthrConfig {
  enabled: boolean;
  providers?: Map<string, Web3Provider>;  // Custom providers
  defaultNetworks?: string[];             // Networks to enable
}
```

**Supported Networks:**
- `mainnet` - Ethereum mainnet
- `goerli` - Goerli testnet (deprecated)
- `sepolia` - Sepolia testnet
- `polygon` - Polygon mainnet
- `arbitrum` - Arbitrum One

### ION DID Configuration

```typescript
interface IonConfig {
  enabled: boolean;
  nodes?: string[];      // Custom ION node URLs
  useDefaults?: boolean; // Use default Microsoft ION nodes
}
```

**Default ION Nodes:**
- `https://ion.msidentity.com` (mainnet)
- `https://beta.ion.msidentity.com` (testnet)

## Global Resolver

Use the global auto-configured resolver for convenience:

```typescript
import { getGlobalAutoResolver } from '@/core/trust/resolution';

// Gets or creates a global resolver configured from environment
const resolver = getGlobalAutoResolver();
const result = await resolver.resolve('did:ethr:mainnet:0x1234...');
```

## Migration Guide

### From Manual Configuration

**Before:**
```typescript
import { UniversalResolver, DidEthrResolver } from '@/core/trust/resolution';

const resolver = new UniversalResolver();

// Manual Web3 provider setup
const web3Providers = new Map();
web3Providers.set('mainnet', myWeb3Provider);

const ethrResolver = new DidEthrResolver(web3Providers);
resolver.registerResolver(ethrResolver);
```

**After:**
```typescript
import { createAutoConfiguredResolver } from '@/core/trust/resolution';

const resolver = createAutoConfiguredResolver({
  ethr: { enabled: true, defaultNetworks: ['mainnet'] }
});
```

### From Environment Variables

**Before:**
```typescript
// Custom environment parsing and resolver setup
const resolver = new UniversalResolver();
if (process.env.ENABLE_ETHR === 'true') {
  // Manual provider creation and registration
}
```

**After:**
```typescript
import { createResolverFromEnvironment } from '@/core/trust/resolution';

const resolver = createResolverFromEnvironment();
```

## Advanced Usage

### Custom Web3 Providers

```typescript
import { createAutoConfiguredResolver } from '@/core/trust/resolution';

const customProviders = new Map();
customProviders.set('mainnet', {
  async call(transaction) {
    // Custom RPC implementation
  },
  async getNetwork() {
    return { chainId: 1, name: 'mainnet' };
  }
});

const resolver = createAutoConfiguredResolver({
  ethr: {
    enabled: true,
    providers: customProviders
  }
});
```

### Production Deployment

For production environments, use environment-based configuration:

```dockerfile
# Dockerfile
ENV ENABLE_DID_ETHR=true
ENV ENABLE_DID_ION=true
ENV ETHR_NETWORKS=mainnet,polygon
ENV INFURA_PROJECT_ID=your_production_key
```

```typescript
// app.ts
import { setGlobalAutoResolver, createResolverFromEnvironment } from '@/core/trust/resolution';

// Initialize global resolver from environment
const resolver = createResolverFromEnvironment();
setGlobalAutoResolver(resolver);
```

## Error Handling

The auto-configuration system includes graceful error handling:

```typescript
// If a DID method fails to register, it logs a warning but continues
const resolver = createAutoConfiguredResolver({
  ethr: { enabled: true },  // May fail if Web3 dependencies missing
  ion: { enabled: true }    // May fail if ION nodes unreachable
});

// Check which methods are actually available
console.log('Supported methods:', resolver.getSupportedMethods());
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `ENABLE_DID_ETHR` | Enable did:ethr method | `true` |
| `ENABLE_DID_ION` | Enable did:ion method | `true` |
| `ETHR_NETWORKS` | Comma-separated network names | `mainnet,polygon` |
| `ION_NODES` | Comma-separated ION node URLs | `https://node1.com,https://node2.com` |
| `INFURA_PROJECT_ID` | Infura project ID for default providers | `abc123...` |

## Best Practices

1. **Use Environment Configuration**: For production deployments, prefer environment-based configuration over hardcoded values.

2. **Enable Only Needed Methods**: Only enable DID methods you actually use to reduce startup time and dependencies.

3. **Provide Fallback Nodes**: For ION, specify multiple nodes for redundancy.

4. **Monitor Provider Health**: Implement health checks for Web3 providers and ION nodes.

5. **Cache Configuration**: The resolver includes built-in caching, but consider persistent caching for production.

## Troubleshooting

### Common Issues

**DID method not registered:**
- Check that the method is enabled in configuration
- Verify required dependencies are installed
- Check console for registration warnings

**Network connection errors:**
- Verify Web3 provider URLs are accessible
- Check ION node connectivity
- Ensure API keys are valid

**Resolution failures:**
- Verify DID format is correct
- Check network-specific registry addresses
- Enable debug logging for detailed error information