/**
 * Key Management System (KMS) Types
 *
 * Unified interface for multiple KMS providers (AWS KMS, GCP KMS, Local)
 */

/**
 * Supported key algorithms
 */
export type KeyAlgorithm = 'RSA_2048' | 'RSA_4096' | 'EC_P256' | 'EC_P384' | 'ED25519' | 'AES_256';

/**
 * Key usage types
 */
export type KeyUsage = 'SIGN_VERIFY' | 'ENCRYPT_DECRYPT' | 'WRAP_UNWRAP';

/**
 * Key state
 */
export type KeyState = 'ENABLED' | 'DISABLED' | 'PENDING_DELETION' | 'DESTROYED';

/**
 * Key metadata
 */
export interface KeyMetadata {
  keyId: string;
  alias?: string;
  algorithm: KeyAlgorithm;
  usage: KeyUsage;
  state: KeyState;
  createdAt: Date;
  provider: 'aws' | 'gcp' | 'local';
  arn?: string; // AWS KMS
  resourceName?: string | null; // GCP KMS (allows null from GCP library)
}

/**
 * Key creation options
 */
export interface CreateKeyOptions {
  alias?: string;
  algorithm: KeyAlgorithm;
  usage: KeyUsage;
  description?: string;
  tags?: Record<string, string>;
}

/**
 * Signing options
 */
export interface SignOptions {
  messageType?: 'RAW' | 'DIGEST';
  algorithm?: string; // Provider-specific algorithm identifier
}

/**
 * Verification options
 */
export interface VerifyOptions {
  messageType?: 'RAW' | 'DIGEST';
  algorithm?: string;
}

/**
 * Encryption options
 */
export interface EncryptOptions {
  algorithm?: string;
  context?: Record<string, string>; // Encryption context for AAD
}

/**
 * Decryption options
 */
export interface DecryptOptions {
  algorithm?: string;
  context?: Record<string, string>;
}

/**
 * Base KMS Provider Interface
 */
export interface KMSProvider {
  readonly name: string;

  /**
   * Create a new key
   */
  createKey(options: CreateKeyOptions): Promise<KeyMetadata>;

  /**
   * Get key metadata
   */
  getKey(keyId: string): Promise<KeyMetadata>;

  /**
   * List all keys
   */
  listKeys(): Promise<KeyMetadata[]>;

  /**
   * Disable a key (prevent usage but retain)
   */
  disableKey(keyId: string): Promise<void>;

  /**
   * Enable a disabled key
   */
  enableKey(keyId: string): Promise<void>;

  /**
   * Schedule key deletion
   */
  scheduleKeyDeletion(keyId: string, pendingWindowInDays?: number): Promise<void>;

  /**
   * Sign data with a key
   */
  sign(keyId: string, data: Buffer, options?: SignOptions): Promise<Buffer>;

  /**
   * Verify signature
   */
  verify(
    keyId: string,
    data: Buffer,
    signature: Buffer,
    options?: VerifyOptions
  ): Promise<boolean>;

  /**
   * Encrypt data
   */
  encrypt(keyId: string, plaintext: Buffer, options?: EncryptOptions): Promise<Buffer>;

  /**
   * Decrypt data
   */
  decrypt(keyId: string, ciphertext: Buffer, options?: DecryptOptions): Promise<Buffer>;

  /**
   * Get public key (for asymmetric keys)
   */
  getPublicKey(keyId: string): Promise<Buffer>;

  /**
   * Rotate key (create new version)
   */
  rotateKey(keyId: string): Promise<void>;
}

/**
 * KMS Operation Result
 */
export interface KMSOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  keyId: string;
  timestamp: Date;
}

/**
 * KMS Configuration
 */
export interface KMSConfig {
  provider: 'aws' | 'gcp' | 'local';
  region?: string; // AWS region or GCP location
  projectId?: string; // GCP project ID
  keyRing?: string; // GCP key ring
  localStorePath?: string; // Local KMS storage path
  credentials?: any; // Provider-specific credentials
}
