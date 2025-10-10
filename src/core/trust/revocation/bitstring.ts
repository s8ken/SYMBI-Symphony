import { gunzipSync, gzipSync } from 'zlib';

/**
 * Bitstring Operations for Status List 2021
 *
 * Implements bitstring encoding/decoding with GZIP compression
 * as specified in W3C Status List 2021
 */
export class Bitstring {
  private bits: Uint8Array;
  private length: number;

  constructor(length: number) {
    if (length <= 0 || length > 2 ** 31) {
      throw new Error('Invalid bitstring length');
    }
    // Calculate bytes needed (round up to nearest byte)
    const byteLength = Math.ceil(length / 8);
    this.bits = new Uint8Array(byteLength);
    this.length = length;
  }

  /**
   * Set bit at index to 1 (revoked/suspended)
   */
  set(index: number): void {
    this.validateIndex(index);
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    this.bits[byteIndex] |= 1 << bitIndex;
  }

  /**
   * Clear bit at index to 0 (active)
   */
  clear(index: number): void {
    this.validateIndex(index);
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    this.bits[byteIndex] &= ~(1 << bitIndex);
  }

  /**
   * Get bit value at index (0 = active, 1 = revoked/suspended)
   */
  get(index: number): boolean {
    this.validateIndex(index);
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    return (this.bits[byteIndex] & (1 << bitIndex)) !== 0;
  }

  /**
   * Get total number of bits
   */
  getLength(): number {
    return this.length;
  }

  /**
   * Count number of set bits (total revoked/suspended)
   */
  count(): number {
    let total = 0;
    for (let i = 0; i < this.length; i++) {
      if (this.get(i)) total++;
    }
    return total;
  }

  /**
   * Encode to base64url-encoded, GZIP-compressed string
   */
  encode(): string {
    // GZIP compress the bitstring
    const compressed = gzipSync(this.bits);

    // Base64url encode (RFC 4648)
    return Buffer.from(compressed)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Decode from base64url-encoded, GZIP-compressed string
   */
  static decode(encoded: string, expectedLength?: number): Bitstring {
    // Restore base64 padding if needed
    const paddingNeeded = (4 - (encoded.length % 4)) % 4;
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(encoded.length + paddingNeeded, '=');

    // Base64 decode
    const compressed = Buffer.from(base64, 'base64');

    // GZIP decompress
    const decompressed = gunzipSync(compressed);

    // Calculate bitstring length from byte array
    const calculatedLength = decompressed.length * 8;

    // Validate expected length if provided
    if (expectedLength !== undefined && calculatedLength < expectedLength) {
      throw new Error(
        `Decoded bitstring length ${calculatedLength} is less than expected ${expectedLength}`
      );
    }

    // Create bitstring and copy data
    const length = expectedLength || calculatedLength;
    const bitstring = new Bitstring(length);
    bitstring.bits.set(decompressed);

    return bitstring;
  }

  /**
   * Create from existing byte array
   */
  static fromBytes(bytes: Uint8Array, length?: number): Bitstring {
    const actualLength = length || bytes.length * 8;
    const bitstring = new Bitstring(actualLength);
    bitstring.bits.set(bytes);
    return bitstring;
  }

  /**
   * Get underlying byte array
   */
  toBytes(): Uint8Array {
    return new Uint8Array(this.bits);
  }

  /**
   * Clone bitstring
   */
  clone(): Bitstring {
    const cloned = new Bitstring(this.length);
    cloned.bits.set(this.bits);
    return cloned;
  }

  /**
   * Validate index is within bounds
   */
  private validateIndex(index: number): void {
    if (index < 0 || index >= this.length) {
      throw new Error(`Index ${index} out of bounds [0, ${this.length})`);
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    length: number;
    byteLength: number;
    setBits: number;
    clearBits: number;
    utilization: number;
  } {
    const setBits = this.count();
    return {
      length: this.length,
      byteLength: this.bits.length,
      setBits,
      clearBits: this.length - setBits,
      utilization: setBits / this.length,
    };
  }
}
