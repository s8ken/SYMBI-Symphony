import { KeyManagementServiceClient } from '@google-cloud/kms';
import {
  KMSProvider,
  KeyMetadata,
  CreateKeyOptions,
  SignOptions,
  VerifyOptions,
  EncryptOptions,
  DecryptOptions,
  KeyAlgorithm,
  KeyState,
} from './types';

/**
 * GCP Cloud KMS Provider
 *
 * Integrates with Google Cloud Key Management Service
 *
 * Features:
 * - FIPS 140-2 Level 3 validated HSMs
 * - Automatic key rotation
 * - Cloud Audit Logs integration
 * - IAM-based access control
 * - Global key distribution
 * - External Key Manager (EKM) support
 */
export class GCPKMSProvider implements KMSProvider {
  readonly name = 'gcp';
  private client: KeyManagementServiceClient;
  private projectId: string;
  private locationId: string;
  private keyRingId: string;

  constructor(projectId: string, locationId: string = 'global', keyRingId: string = 'symbi-keys', credentials?: any) {
    this.projectId = projectId;
    this.locationId = locationId;
    this.keyRingId = keyRingId;

    this.client = new KeyManagementServiceClient(
      credentials ? { credentials } : undefined
    );
  }

  /**
   * Initialize provider (ensure key ring exists)
   */
  async initialize(): Promise<void> {
    const parent = `projects/${this.projectId}/locations/${this.locationId}`;
    const keyRingPath = `${parent}/keyRings/${this.keyRingId}`;

    try {
      await this.client.getKeyRing({ name: keyRingPath });
    } catch (error: any) {
      if (error.code === 5) {
        // NOT_FOUND, create key ring
        await this.client.createKeyRing({
          parent,
          keyRingId: this.keyRingId,
        });
      } else {
        throw error;
      }
    }
  }

  async createKey(options: CreateKeyOptions): Promise<KeyMetadata> {
    const keyRingPath = this.getKeyRingPath();
    const keyId = options.alias || this.generateKeyId();

    const [key] = await this.client.createCryptoKey({
      parent: keyRingPath,
      cryptoKeyId: keyId,
      cryptoKey: {
        purpose: this.mapKeyUsage(options.usage),
        versionTemplate: {
          algorithm: this.mapKeyAlgorithm(options.algorithm, options.usage),
        },
        labels: options.tags,
      },
    });

    if (!key.name) {
      throw new Error('Failed to create key: No name returned');
    }

    const createdAt = key.createTime
      ? new Date(parseInt(key.createTime.seconds as any) * 1000)
      : new Date();

    return {
      keyId,
      alias: options.alias,
      algorithm: options.algorithm,
      usage: options.usage,
      state: 'ENABLED',
      createdAt,
      provider: 'gcp',
      resourceName: key.name,
    };
  }

  async getKey(keyId: string): Promise<KeyMetadata> {
    const keyPath = this.getKeyPath(keyId);
    const [key] = await this.client.getCryptoKey({ name: keyPath });

    if (!key.name) {
      throw new Error(`Key not found: ${keyId}`);
    }

    const createdAt = key.createTime
      ? new Date(parseInt(key.createTime.seconds as any) * 1000)
      : new Date();

    const algorithm = this.unmapAlgorithm(
      key.versionTemplate?.algorithm || 'CRYPTO_KEY_VERSION_ALGORITHM_UNSPECIFIED'
    );
    const usage = this.unmapPurpose(key.purpose || 'CRYPTO_KEY_PURPOSE_UNSPECIFIED');

    return {
      keyId,
      algorithm,
      usage,
      state: 'ENABLED',
      createdAt,
      provider: 'gcp',
      resourceName: key.name,
    };
  }

  async listKeys(): Promise<KeyMetadata[]> {
    const keyRingPath = this.getKeyRingPath();
    const [keys] = await this.client.listCryptoKeys({ parent: keyRingPath });

    return keys
      .filter((key) => key.name)
      .map((key) => {
        const keyId = key.name!.split('/').pop()!;
        const createdAt = key.createTime
          ? new Date(parseInt(key.createTime.seconds as any) * 1000)
          : new Date();

        const algorithm = this.unmapAlgorithm(
          key.versionTemplate?.algorithm || 'CRYPTO_KEY_VERSION_ALGORITHM_UNSPECIFIED'
        );
        const usage = this.unmapPurpose(key.purpose || 'CRYPTO_KEY_PURPOSE_UNSPECIFIED');

        return {
          keyId,
          algorithm,
          usage,
          state: 'ENABLED',
          createdAt,
          provider: 'gcp' as const,
          resourceName: key.name,
        };
      });
  }

  async disableKey(keyId: string): Promise<void> {
    // GCP doesn't disable keys at the key level, only at version level
    // We'll get the primary version and disable it
    const keyPath = this.getKeyPath(keyId);
    const [key] = await this.client.getCryptoKey({ name: keyPath });

    if (key.primary?.name) {
      await this.client.updateCryptoKeyVersion({
        cryptoKeyVersion: {
          name: key.primary.name,
          state: 'DISABLED',
        },
        updateMask: { paths: ['state'] },
      });
    }
  }

  async enableKey(keyId: string): Promise<void> {
    const keyPath = this.getKeyPath(keyId);
    const [key] = await this.client.getCryptoKey({ name: keyPath });

    if (key.primary?.name) {
      await this.client.updateCryptoKeyVersion({
        cryptoKeyVersion: {
          name: key.primary.name,
          state: 'ENABLED',
        },
        updateMask: { paths: ['state'] },
      });
    }
  }

  async scheduleKeyDeletion(keyId: string, pendingWindowInDays?: number): Promise<void> {
    // GCP doesn't support scheduled deletion, keys are soft-deleted immediately
    const keyPath = this.getKeyPath(keyId);
    const [key] = await this.client.getCryptoKey({ name: keyPath });

    if (key.primary?.name) {
      await this.client.destroyCryptoKeyVersion({
        name: key.primary.name,
      });
    }
  }

  async sign(keyId: string, data: Buffer, options?: SignOptions): Promise<Buffer> {
    const versionPath = await this.getPrimaryVersionPath(keyId);

    const digest = this.computeDigest(data);

    const [response] = await this.client.asymmetricSign({
      name: versionPath,
      digest,
    });

    if (!response.signature) {
      throw new Error('Signing failed: No signature returned');
    }

    return Buffer.from(response.signature as Uint8Array);
  }

  async verify(
    keyId: string,
    data: Buffer,
    signature: Buffer,
    options?: VerifyOptions
  ): Promise<boolean> {
    // GCP KMS doesn't provide verify operation, must fetch public key and verify locally
    const publicKey = await this.getPublicKey(keyId);

    // Use Node.js crypto for verification (implementation depends on algorithm)
    const crypto = require('crypto');
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature);
  }

  async encrypt(keyId: string, plaintext: Buffer, options?: EncryptOptions): Promise<Buffer> {
    const versionPath = await this.getPrimaryVersionPath(keyId);

    const [response] = await this.client.encrypt({
      name: this.getKeyPath(keyId),
      plaintext: plaintext,
      additionalAuthenticatedData: options?.context
        ? Buffer.from(JSON.stringify(options.context))
        : undefined,
    });

    if (!response.ciphertext) {
      throw new Error('Encryption failed: No ciphertext returned');
    }

    return Buffer.from(response.ciphertext as Uint8Array);
  }

  async decrypt(keyId: string, ciphertext: Buffer, options?: DecryptOptions): Promise<Buffer> {
    const [response] = await this.client.decrypt({
      name: this.getKeyPath(keyId),
      ciphertext: ciphertext,
      additionalAuthenticatedData: options?.context
        ? Buffer.from(JSON.stringify(options.context))
        : undefined,
    });

    if (!response.plaintext) {
      throw new Error('Decryption failed: No plaintext returned');
    }

    return Buffer.from(response.plaintext as Uint8Array);
  }

  async getPublicKey(keyId: string): Promise<Buffer> {
    const versionPath = await this.getPrimaryVersionPath(keyId);

    const [publicKey] = await this.client.getPublicKey({
      name: versionPath,
    });

    if (!publicKey.pem) {
      throw new Error('Failed to get public key');
    }

    return Buffer.from(publicKey.pem);
  }

  async rotateKey(keyId: string): Promise<void> {
    // Create new version (automatic rotation)
    const keyPath = this.getKeyPath(keyId);
    await this.client.updateCryptoKeyPrimaryVersion({
      name: keyPath,
      cryptoKeyVersionId: '', // Let GCP create new version
    });
  }

  /**
   * Helper methods
   */

  private getKeyRingPath(): string {
    return `projects/${this.projectId}/locations/${this.locationId}/keyRings/${this.keyRingId}`;
  }

  private getKeyPath(keyId: string): string {
    return `${this.getKeyRingPath()}/cryptoKeys/${keyId}`;
  }

  private async getPrimaryVersionPath(keyId: string): Promise<string> {
    const keyPath = this.getKeyPath(keyId);
    const [key] = await this.client.getCryptoKey({ name: keyPath });

    if (!key.primary?.name) {
      throw new Error(`No primary version for key: ${keyId}`);
    }

    return key.primary.name;
  }

  private generateKeyId(): string {
    return `key-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  private mapKeyAlgorithm(algorithm: KeyAlgorithm, usage: string): string {
    if (usage === 'SIGN_VERIFY') {
      switch (algorithm) {
        case 'RSA_2048':
          return 'RSA_SIGN_PKCS1_2048_SHA256';
        case 'RSA_4096':
          return 'RSA_SIGN_PKCS1_4096_SHA256';
        case 'EC_P256':
          return 'EC_SIGN_P256_SHA256';
        case 'EC_P384':
          return 'EC_SIGN_P384_SHA384';
        default:
          throw new Error(`Unsupported signing algorithm: ${algorithm}`);
      }
    } else {
      switch (algorithm) {
        case 'RSA_2048':
          return 'RSA_DECRYPT_OAEP_2048_SHA256';
        case 'RSA_4096':
          return 'RSA_DECRYPT_OAEP_4096_SHA256';
        case 'AES_256':
          return 'GOOGLE_SYMMETRIC_ENCRYPTION';
        default:
          throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
      }
    }
  }

  private unmapAlgorithm(gcpAlgorithm: string): KeyAlgorithm {
    if (gcpAlgorithm.includes('2048')) return 'RSA_2048';
    if (gcpAlgorithm.includes('4096')) return 'RSA_4096';
    if (gcpAlgorithm.includes('P256')) return 'EC_P256';
    if (gcpAlgorithm.includes('P384')) return 'EC_P384';
    if (gcpAlgorithm.includes('SYMMETRIC')) return 'AES_256';
    return 'RSA_2048'; // default
  }

  private mapKeyUsage(usage: string): string {
    switch (usage) {
      case 'SIGN_VERIFY':
        return 'ASYMMETRIC_SIGN';
      case 'ENCRYPT_DECRYPT':
        return 'ENCRYPT_DECRYPT';
      default:
        return 'ENCRYPT_DECRYPT';
    }
  }

  private unmapPurpose(purpose: string): 'SIGN_VERIFY' | 'ENCRYPT_DECRYPT' | 'WRAP_UNWRAP' {
    if (purpose.includes('SIGN')) return 'SIGN_VERIFY';
    return 'ENCRYPT_DECRYPT';
  }

  private computeDigest(data: Buffer): { sha256?: Uint8Array } {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(data).digest();
    return { sha256: new Uint8Array(hash) };
  }
}
