/**
 * JWT Helper - SYMBI Symphony
 * 
 * Simple JWT implementation for the SYMBI AI Agent ecosystem.
 * Provides basic JWT functionality without external dependencies.
 */

import crypto from 'crypto';

export interface JwtPayload {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  [key: string]: any;
}

export interface JwtHeader {
  alg: string;
  typ: string;
}

export class JwtHelper {
  /**
   * Sign a JWT token
   */
  static sign(
    payload: JwtPayload,
    secret: string,
    options?: {
      algorithm?: 'HS256' | 'HS384' | 'HS512';
      expiresIn?: number; // seconds
    }
  ): string {
    const algorithm = options?.algorithm || 'HS256';
    
    const header: JwtHeader = {
      alg: algorithm,
      typ: 'JWT'
    };

    // Add expiration if specified
    if (options?.expiresIn) {
      payload.exp = Math.floor(Date.now() / 1000) + options.expiresIn;
    }

    // Add issued at time
    payload.iat = Math.floor(Date.now() / 1000);

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    
    const signature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      secret,
      algorithm
    );

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify and decode a JWT token
   */
  static verify(
    token: string,
    secret: string,
    options?: {
      algorithms?: string[];
      issuer?: string;
      audience?: string | string[];
    }
  ): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Decode header and payload
    const header = JSON.parse(this.base64UrlDecode(encodedHeader)) as JwtHeader;
    const payload = JSON.parse(this.base64UrlDecode(encodedPayload)) as JwtPayload;

    // Verify algorithm
    if (options?.algorithms && !options.algorithms.includes(header.alg)) {
      throw new Error('Invalid algorithm');
    }

    // Verify signature
    const expectedSignature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      secret,
      header.alg as 'HS256' | 'HS384' | 'HS512'
    );

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new Error('Invalid signature');
    }

    // Verify expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    // Verify issuer
    if (options?.issuer && payload.iss !== options.issuer) {
      throw new Error('Invalid issuer');
    }

    // Verify audience
    if (options?.audience) {
      const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      const expectedAudiences = Array.isArray(options.audience) ? options.audience : [options.audience];
      
      const hasValidAudience = expectedAudiences.some(expected => 
        audiences?.includes(expected)
      );
      
      if (!hasValidAudience) {
        throw new Error('Invalid audience');
      }
    }

    return payload;
  }

  /**
   * Decode JWT without verification (for debugging)
   */
  static decode(token: string): { header: JwtHeader; payload: JwtPayload } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const header = JSON.parse(this.base64UrlDecode(parts[0])) as JwtHeader;
      const payload = JSON.parse(this.base64UrlDecode(parts[1])) as JwtPayload;

      return { header, payload };
    } catch (error) {
      return null;
    }
  }

  /**
   * Create HMAC signature
   */
  private static createSignature(
    data: string,
    secret: string,
    algorithm: 'HS256' | 'HS384' | 'HS512'
  ): string {
    const algorithmMap = {
      'HS256': 'sha256',
      'HS384': 'sha384',
      'HS512': 'sha512'
    };

    const hmac = crypto.createHmac(algorithmMap[algorithm], secret);
    hmac.update(data);
    return this.base64UrlEncode(hmac.digest());
  }

  /**
   * Base64 URL encode
   */
  private static base64UrlEncode(data: string | Buffer): string {
    const base64 = Buffer.from(data).toString('base64');
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decode
   */
  private static base64UrlDecode(data: string): string {
    let base64 = data
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }

    return Buffer.from(base64, 'base64').toString('utf-8');
  }
}