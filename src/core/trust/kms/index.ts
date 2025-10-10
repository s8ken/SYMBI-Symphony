/**
 * Key Management System (KMS) Module
 *
 * Provides unified interface for multiple KMS providers:
 * - AWS KMS: Production-grade cloud KMS
 * - GCP Cloud KMS: Google Cloud key management
 * - Local KMS: File-based storage for development
 *
 * @module trust/kms
 */

export * from './types';
export * from './local.provider';
export * from './aws.provider';
export * from './gcp.provider';

import { KMSProvider, KMSConfig } from './types';
import { LocalKMSProvider } from './local.provider';
import { AWSKMSProvider } from './aws.provider';
import { GCPKMSProvider } from './gcp.provider';

/**
 * KMS Factory
 *
 * Creates appropriate KMS provider based on configuration
 */
export class KMSFactory {
  static async createProvider(config: KMSConfig): Promise<KMSProvider> {
    switch (config.provider) {
      case 'local': {
        const storePath = config.localStorePath || './kms-store';
        const provider = new LocalKMSProvider(storePath);
        await provider.initialize();
        return provider;
      }

      case 'aws': {
        const region = config.region || 'us-east-1';
        return new AWSKMSProvider(region, config.credentials);
      }

      case 'gcp': {
        if (!config.projectId) {
          throw new Error('GCP KMS requires projectId in config');
        }
        const locationId = config.region || 'global';
        const keyRing = config.keyRing || 'symbi-keys';
        const provider = new GCPKMSProvider(
          config.projectId,
          locationId,
          keyRing,
          config.credentials
        );
        await provider.initialize();
        return provider;
      }

      default:
        throw new Error(`Unsupported KMS provider: ${config.provider}`);
    }
  }
}

/**
 * Global KMS instance
 */
let globalKMS: KMSProvider | null = null;

/**
 * Initialize global KMS instance
 */
export async function initializeKMS(config: KMSConfig): Promise<KMSProvider> {
  globalKMS = await KMSFactory.createProvider(config);
  return globalKMS;
}

/**
 * Get global KMS instance
 */
export function getKMS(): KMSProvider {
  if (!globalKMS) {
    throw new Error('KMS not initialized. Call initializeKMS() first.');
  }
  return globalKMS;
}

/**
 * Set global KMS instance
 */
export function setKMS(provider: KMSProvider): void {
  globalKMS = provider;
}
