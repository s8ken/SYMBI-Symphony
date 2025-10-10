/**
 * Authentication & Authorization Module - SYMBI Symphony
 * 
 * Comprehensive authentication, authorization, and security management
 * for the SYMBI AI Agent ecosystem.
 */

import { Authenticator } from './authenticator';
import { Authorizer } from './authorizer';
import { JwtHelper } from './jwt-helper';

export * from './types';
export * from './authenticator';
export * from './authorizer';
export * from './jwt-helper';

// Convenience exports
export { Authenticator } from './authenticator';
export { Authorizer } from './authorizer';
export { JwtHelper } from './jwt-helper';

// Create default instances
export const defaultJwtHelper = JwtHelper;
export const defaultAuthenticator = new Authenticator();
export const defaultAuthorizer = new Authorizer();

// Convenience functions
export function createAuthenticator(config?: any) {
  return new Authenticator(config);
}

export function createAuthorizer() {
  return new Authorizer();
}

export function createJwtHelper() {
  return JwtHelper;
}