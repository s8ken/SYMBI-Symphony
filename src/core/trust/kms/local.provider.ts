import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
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
 * Local File-based KMS Provider
 *
 * Stores keys in local filesystem (encrypted with master key)
 * Suitable for development, testing, and single-instance deployments
 *
 * WARNING: Not recommended for production multi-instance deployments
 * Use AWS KMS or GCP KMS for production
 */
export class LocalKMSProvider implements KMSProvider {
  readonly name = 'local';
  private storePath: string;
  private masterKey: Buffer;
  private keys: Map<string, LocalKey>;

  constructor(storePath: string, masterPassword?: string) {
    this.storePath = storePath;
    this.masterKey = this.deriveMasterKey(masterPassword || 'default-master-key');
    this.keys = new Map();
  }

  /**
   * Initialize provider (load existing keys)
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.storePath, { recursive: true });
      await this.loadKeys();
    } catch (error: any) {
      throw new Error(`Failed to initialize local KMS: ${error.message}`);
    }
  }

  async createKey(options: CreateKeyOptions): Promise<KeyMetadata> {
    const keyId = crypto.randomUUID();
    const now = new Date();

    // Generate key pair based on algorithm
    const keyPair = this.generateKeyPair(options.algorithm);

    const localKey: LocalKey = {
      keyId,
      alias: options.alias,
      algorithm: options.algorithm,
      usage: options.usage,
      state: 'ENABLED',
      createdAt: now,
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      description: options.description,
      tags: options.tags,
    };

    this.keys.set(keyId, localKey);
    await this.persistKey(localKey);

    return {
      keyId,
      alias: options.alias,
      algorithm: options.algorithm,
      usage: options.usage,
      state: 'ENABLED',
      createdAt: now,
      provider: 'local',
    };
  }

  async getKey(keyId: string): Promise<KeyMetadata> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    return {
      keyId: key.keyId,
      alias: key.alias,
      algorithm: key.algorithm,
      usage: key.usage,
      state: key.state,
      createdAt: key.createdAt,
      provider: 'local',
    };
  }

  async listKeys(): Promise<KeyMetadata[]> {
    return Array.from(this.keys.values()).map((key) => ({
      keyId: key.keyId,
      alias: key.alias,
      algorithm: key.algorithm,
      usage: key.usage,
      state: key.state,
      createdAt: key.createdAt,
      provider: 'local',
    }));
  }

  async disableKey(keyId: string): Promise<void> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }
    key.state = 'DISABLED';
    await this.persistKey(key);
  }

  async enableKey(keyId: string): Promise<void> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }
    if (key.state === 'DESTROYED') {
      throw new Error('Cannot enable destroyed key');
    }
    key.state = 'ENABLED';
    await this.persistKey(key);
  }

  async scheduleKeyDeletion(keyId: string, pendingWindowInDays: number = 30): Promise<void> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }
    key.state = 'PENDING_DELETION';
    key.deletionDate = new Date(Date.now() + pendingWindowInDays * 24 * 60 * 60 * 1000);
    await this.persistKey(key);
  }

  async sign(keyId: string, data: Buffer, options?: SignOptions): Promise<Buffer> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }
    if (key.state !== 'ENABLED') {
      throw new Error(`Key is not enabled: ${key.state}`);
    }
    if (key.usage !== 'SIGN_VERIFY') {
      throw new Error(`Key usage is not SIGN_VERIFY: ${key.usage}`);
    }

    const algorithm = this.getSignAlgorithm(key.algorithm);
    const sign = crypto.createSign(algorithm);
    sign.update(data);
    return sign.sign(key.privateKey);
  }

  async verify(
    keyId: string,
    data: Buffer,
    signature: Buffer,
    options?: VerifyOptions
  ): Promise<boolean> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    const algorithm = this.getSignAlgorithm(key.algorithm);
    const verify = crypto.createVerify(algorithm);
    verify.update(data);
    return verify.verify(key.publicKey, signature);
  }

  async encrypt(keyId: string, plaintext: Buffer, options?: EncryptOptions): Promise<Buffer> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }
    if (key.state !== 'ENABLED') {
      throw new Error(`Key is not enabled: ${key.state}`);
    }

    if (key.algorithm === 'AES_256') {
      // Symmetric encryption
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', key.privateKey.slice(0, 32), iv);

      const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // Return: iv (16) + authTag (16) + ciphertext
      return Buffer.concat([iv, authTag, encrypted]);
    } else {
      // Asymmetric encryption
      return crypto.publicEncrypt(
        {
          key: key.publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        plaintext
      );
    }
  }

  async decrypt(keyId: string, ciphertext: Buffer, options?: DecryptOptions): Promise<Buffer> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }
    if (key.state !== 'ENABLED') {
      throw new Error(`Key is not enabled: ${key.state}`);
    }

    if (key.algorithm === 'AES_256') {
      // Symmetric decryption
      const iv = ciphertext.slice(0, 16);
      const authTag = ciphertext.slice(16, 32);
      const encrypted = ciphertext.slice(32);

      const decipher = crypto.createDecipheriv('aes-256-gcm', key.privateKey.slice(0, 32), iv);
      decipher.setAuthTag(authTag);

      return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } else {
      // Asymmetric decryption
      return crypto.privateDecrypt(
        {
          key: key.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        ciphertext
      );
    }
  }

  async getPublicKey(keyId: string): Promise<Buffer> {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }
    return key.publicKey;
  }

  async rotateKey(keyId: string): Promise<void> {
    const oldKey = this.keys.get(keyId);
    if (!oldKey) {
      throw new Error(`Key not found: ${keyId}`);
    }

    // Generate new key pair
    const keyPair = this.generateKeyPair(oldKey.algorithm);

    oldKey.privateKey = keyPair.privateKey;
    oldKey.publicKey = keyPair.publicKey;
    oldKey.rotatedAt = new Date();

    await this.persistKey(oldKey);
  }

  /**
   * Generate key pair based on algorithm
   */
  private generateKeyPair(algorithm: KeyAlgorithm): { privateKey: Buffer; publicKey: Buffer } {
    switch (algorithm) {
      case 'RSA_2048':
        return this.generateRSAKeyPair(2048);
      case 'RSA_4096':
        return this.generateRSAKeyPair(4096);
      case 'EC_P256':
        return this.generateECKeyPair('prime256v1');
      case 'EC_P384':
        return this.generateECKeyPair('secp384r1');
      case 'ED25519':
        return this.generateED25519KeyPair();
      case 'AES_256':
        return this.generateAESKey();
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
  }

  private generateRSAKeyPair(modulusLength: number): { privateKey: Buffer; publicKey: Buffer } {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength,
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });
    return { privateKey, publicKey };
  }

  private generateECKeyPair(namedCurve: string): { privateKey: Buffer; publicKey: Buffer } {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve,
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });
    return { privateKey, publicKey };
  }

  private generateED25519KeyPair(): { privateKey: Buffer; publicKey: Buffer } {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });
    return { privateKey, publicKey };
  }

  private generateAESKey(): { privateKey: Buffer; publicKey: Buffer } {
    const key = crypto.randomBytes(32); // 256 bits
    return { privateKey: key, publicKey: key };
  }

  /**
   * Get signing algorithm for crypto module
   */
  private getSignAlgorithm(keyAlgorithm: KeyAlgorithm): string {
    switch (keyAlgorithm) {
      case 'RSA_2048':
      case 'RSA_4096':
        return 'RSA-SHA256';
      case 'EC_P256':
        return 'SHA256';
      case 'EC_P384':
        return 'SHA384';
      case 'ED25519':
        return 'Ed25519';
      default:
        throw new Error(`No signing algorithm for: ${keyAlgorithm}`);
    }
  }

  /**
   * Persist key to disk (encrypted)
   */
  private async persistKey(key: LocalKey): Promise<void> {
    const keyPath = path.join(this.storePath, `${key.keyId}.key`);
    const keyData = JSON.stringify({
      ...key,
      privateKey: key.privateKey.toString('base64'),
      publicKey: key.publicKey.toString('base64'),
      createdAt: key.createdAt.toISOString(),
      rotatedAt: key.rotatedAt?.toISOString(),
      deletionDate: key.deletionDate?.toISOString(),
    });

    // Encrypt key data with master key
    const encrypted = this.encryptWithMasterKey(Buffer.from(keyData, 'utf8'));
    await fs.writeFile(keyPath, encrypted);
  }

  /**
   * Load all keys from disk
   */
  private async loadKeys(): Promise<void> {
    try {
      const files = await fs.readdir(this.storePath);
      const keyFiles = files.filter((f) => f.endsWith('.key'));

      for (const file of keyFiles) {
        const keyPath = path.join(this.storePath, file);
        const encrypted = await fs.readFile(keyPath);
        const decrypted = this.decryptWithMasterKey(encrypted);
        const keyData = JSON.parse(decrypted.toString('utf8'));

        const key: LocalKey = {
          ...keyData,
          privateKey: Buffer.from(keyData.privateKey, 'base64'),
          publicKey: Buffer.from(keyData.publicKey, 'base64'),
          createdAt: new Date(keyData.createdAt),
          rotatedAt: keyData.rotatedAt ? new Date(keyData.rotatedAt) : undefined,
          deletionDate: keyData.deletionDate ? new Date(keyData.deletionDate) : undefined,
        };

        this.keys.set(key.keyId, key);
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Derive master key from password
   */
  private deriveMasterKey(password: string): Buffer {
    return crypto.pbkdf2Sync(password, 'symbi-kms-salt', 100000, 32, 'sha256');
  }

  /**
   * Encrypt data with master key
   */
  private encryptWithMasterKey(data: Buffer): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt data with master key
   */
  private decryptWithMasterKey(data: Buffer): Buffer {
    const iv = data.slice(0, 16);
    const authTag = data.slice(16, 32);
    const encrypted = data.slice(32);

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}

/**
 * Local key structure
 */
interface LocalKey {
  keyId: string;
  alias?: string;
  algorithm: KeyAlgorithm;
  usage: string;
  state: KeyState;
  createdAt: Date;
  rotatedAt?: Date;
  deletionDate?: Date;
  privateKey: Buffer;
  publicKey: Buffer;
  description?: string;
  tags?: Record<string, string>;
}
