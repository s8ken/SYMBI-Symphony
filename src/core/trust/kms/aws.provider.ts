import { KMSClient, CreateKeyCommand, DescribeKeyCommand, ListKeysCommand, DisableKeyCommand, EnableKeyCommand, ScheduleKeyDeletionCommand, SignCommand, VerifyCommand, EncryptCommand, DecryptCommand, GetPublicKeyCommand, CreateAliasCommand, KeySpec, SigningAlgorithmSpec, EncryptionAlgorithmSpec } from '@aws-sdk/client-kms';
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
 * AWS KMS Provider
 *
 * Integrates with AWS Key Management Service for production-grade key management
 *
 * Features:
 * - Hardware Security Modules (HSMs)
 * - Automatic key rotation
 * - CloudTrail audit logging
 * - Fine-grained IAM permissions
 * - Multi-region keys
 * - FIPS 140-2 Level 3 validated
 */
export class AWSKMSProvider implements KMSProvider {
  readonly name = 'aws';
  private client: KMSClient;
  private region: string;

  constructor(region: string = 'us-east-1', credentials?: any) {
    this.region = region;
    this.client = new KMSClient({
      region,
      credentials,
    });
  }

  async createKey(options: CreateKeyOptions): Promise<KeyMetadata> {
    const keySpec = this.mapKeyAlgorithm(options.algorithm);
    const keyUsage = options.usage === 'SIGN_VERIFY' ? 'SIGN_VERIFY' : 'ENCRYPT_DECRYPT';

    const command = new CreateKeyCommand({
      KeySpec: keySpec,
      KeyUsage: keyUsage,
      Description: options.description,
      Tags: options.tags
        ? Object.entries(options.tags).map(([key, value]) => ({
            TagKey: key,
            TagValue: value,
          }))
        : undefined,
    });

    const response = await this.client.send(command);

    if (!response.KeyMetadata?.KeyId) {
      throw new Error('Failed to create key: No KeyId returned');
    }

    const keyId = response.KeyMetadata.KeyId;

    // Create alias if provided
    if (options.alias) {
      const aliasName = options.alias.startsWith('alias/')
        ? options.alias
        : `alias/${options.alias}`;

      await this.client.send(
        new CreateAliasCommand({
          AliasName: aliasName,
          TargetKeyId: keyId,
        })
      );
    }

    return {
      keyId,
      alias: options.alias,
      algorithm: options.algorithm,
      usage: options.usage,
      state: this.mapKeyState(response.KeyMetadata.KeyState),
      createdAt: response.KeyMetadata.CreationDate || new Date(),
      provider: 'aws',
      arn: response.KeyMetadata.Arn,
    };
  }

  async getKey(keyId: string): Promise<KeyMetadata> {
    const command = new DescribeKeyCommand({ KeyId: keyId });
    const response = await this.client.send(command);

    if (!response.KeyMetadata) {
      throw new Error(`Key not found: ${keyId}`);
    }

    const metadata = response.KeyMetadata;

    return {
      keyId: metadata.KeyId!,
      algorithm: this.unmapKeySpec(metadata.KeySpec),
      usage: metadata.KeyUsage === 'SIGN_VERIFY' ? 'SIGN_VERIFY' : 'ENCRYPT_DECRYPT',
      state: this.mapKeyState(metadata.KeyState),
      createdAt: metadata.CreationDate || new Date(),
      provider: 'aws',
      arn: metadata.Arn,
    };
  }

  async listKeys(): Promise<KeyMetadata[]> {
    const command = new ListKeysCommand({});
    const response = await this.client.send(command);

    if (!response.Keys) {
      return [];
    }

    // Fetch full metadata for each key
    const keys = await Promise.all(
      response.Keys.map(async (key) => {
        if (!key.KeyId) return null;
        try {
          return await this.getKey(key.KeyId);
        } catch (error) {
          return null;
        }
      })
    );

    return keys.filter((k): k is KeyMetadata => k !== null);
  }

  async disableKey(keyId: string): Promise<void> {
    const command = new DisableKeyCommand({ KeyId: keyId });
    await this.client.send(command);
  }

  async enableKey(keyId: string): Promise<void> {
    const command = new EnableKeyCommand({ KeyId: keyId });
    await this.client.send(command);
  }

  async scheduleKeyDeletion(keyId: string, pendingWindowInDays: number = 30): Promise<void> {
    const command = new ScheduleKeyDeletionCommand({
      KeyId: keyId,
      PendingWindowInDays: pendingWindowInDays,
    });
    await this.client.send(command);
  }

  async sign(keyId: string, data: Buffer, options?: SignOptions): Promise<Buffer> {
    const key = await this.getKey(keyId);
    const signingAlgorithm = this.getSigningAlgorithm(key.algorithm);

    const command = new SignCommand({
      KeyId: keyId,
      Message: data,
      MessageType: options?.messageType || 'RAW',
      SigningAlgorithm: signingAlgorithm,
    });

    const response = await this.client.send(command);

    if (!response.Signature) {
      throw new Error('Signing failed: No signature returned');
    }

    return Buffer.from(response.Signature);
  }

  async verify(
    keyId: string,
    data: Buffer,
    signature: Buffer,
    options?: VerifyOptions
  ): Promise<boolean> {
    const key = await this.getKey(keyId);
    const signingAlgorithm = this.getSigningAlgorithm(key.algorithm);

    const command = new VerifyCommand({
      KeyId: keyId,
      Message: data,
      Signature: signature,
      MessageType: options?.messageType || 'RAW',
      SigningAlgorithm: signingAlgorithm,
    });

    const response = await this.client.send(command);
    return response.SignatureValid || false;
  }

  async encrypt(keyId: string, plaintext: Buffer, options?: EncryptOptions): Promise<Buffer> {
    const command = new EncryptCommand({
      KeyId: keyId,
      Plaintext: plaintext,
      EncryptionAlgorithm: (options?.algorithm as EncryptionAlgorithmSpec) || 'RSAES_OAEP_SHA_256',
      EncryptionContext: options?.context,
    });

    const response = await this.client.send(command);

    if (!response.CiphertextBlob) {
      throw new Error('Encryption failed: No ciphertext returned');
    }

    return Buffer.from(response.CiphertextBlob);
  }

  async decrypt(keyId: string, ciphertext: Buffer, options?: DecryptOptions): Promise<Buffer> {
    const command = new DecryptCommand({
      KeyId: keyId,
      CiphertextBlob: ciphertext,
      EncryptionAlgorithm: (options?.algorithm as EncryptionAlgorithmSpec) || 'RSAES_OAEP_SHA_256',
      EncryptionContext: options?.context,
    });

    const response = await this.client.send(command);

    if (!response.Plaintext) {
      throw new Error('Decryption failed: No plaintext returned');
    }

    return Buffer.from(response.Plaintext);
  }

  async getPublicKey(keyId: string): Promise<Buffer> {
    const command = new GetPublicKeyCommand({ KeyId: keyId });
    const response = await this.client.send(command);

    if (!response.PublicKey) {
      throw new Error('Failed to get public key');
    }

    return Buffer.from(response.PublicKey);
  }

  async rotateKey(keyId: string): Promise<void> {
    // AWS KMS handles automatic rotation, but we can trigger it
    // Note: This requires enabling automatic key rotation
    throw new Error('Use AWS Console or CLI to enable automatic key rotation');
  }

  /**
   * Map our KeyAlgorithm to AWS KeySpec
   */
  private mapKeyAlgorithm(algorithm: KeyAlgorithm): KeySpec {
    switch (algorithm) {
      case 'RSA_2048':
        return 'RSA_2048';
      case 'RSA_4096':
        return 'RSA_4096';
      case 'EC_P256':
        return 'ECC_NIST_P256';
      case 'EC_P384':
        return 'ECC_NIST_P384';
      case 'AES_256':
        return 'SYMMETRIC_DEFAULT';
      default:
        throw new Error(`Unsupported algorithm for AWS KMS: ${algorithm}`);
    }
  }

  /**
   * Map AWS KeySpec back to our KeyAlgorithm
   */
  private unmapKeySpec(keySpec?: string): KeyAlgorithm {
    switch (keySpec) {
      case 'RSA_2048':
        return 'RSA_2048';
      case 'RSA_4096':
        return 'RSA_4096';
      case 'ECC_NIST_P256':
        return 'EC_P256';
      case 'ECC_NIST_P384':
        return 'EC_P384';
      case 'SYMMETRIC_DEFAULT':
        return 'AES_256';
      default:
        throw new Error(`Unknown AWS KeySpec: ${keySpec}`);
    }
  }

  /**
   * Map AWS KeyState to our KeyState
   */
  private mapKeyState(state?: string): KeyState {
    switch (state) {
      case 'Enabled':
        return 'ENABLED';
      case 'Disabled':
        return 'DISABLED';
      case 'PendingDeletion':
        return 'PENDING_DELETION';
      case 'PendingImport':
      case 'Unavailable':
        return 'DISABLED';
      default:
        return 'DISABLED';
    }
  }

  /**
   * Get AWS signing algorithm for key algorithm
   */
  private getSigningAlgorithm(algorithm: KeyAlgorithm): SigningAlgorithmSpec {
    switch (algorithm) {
      case 'RSA_2048':
      case 'RSA_4096':
        return 'RSASSA_PKCS1_V1_5_SHA_256';
      case 'EC_P256':
        return 'ECDSA_SHA_256';
      case 'EC_P384':
        return 'ECDSA_SHA_384';
      default:
        throw new Error(`No signing algorithm for: ${algorithm}`);
    }
  }
}
