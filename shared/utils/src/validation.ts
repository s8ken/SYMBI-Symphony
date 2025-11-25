/**
 * SYMBI Validation Utilities
 * Common validation functions and schemas
 */

import type { CIQMetrics, TrustReceipt, Agent } from '@symbi/types';

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate CIQ metrics
 */
export function validateCIQMetrics(metrics: CIQMetrics): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (metrics.clarity < 0 || metrics.clarity > 100) {
    errors.push('Clarity must be between 0 and 100');
  }

  if (metrics.integrity < 0 || metrics.integrity > 100) {
    errors.push('Integrity must be between 0 and 100');
  }

  if (metrics.quality < 0 || metrics.quality > 100) {
    errors.push('Quality must be between 0 and 100');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate trust receipt structure
 */
export function validateTrustReceipt(receipt: Partial<TrustReceipt>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!receipt.id) {
    errors.push('Trust receipt must have an id');
  }

  if (!receipt.timestamp) {
    errors.push('Trust receipt must have a timestamp');
  }

  if (!receipt.agentId) {
    errors.push('Trust receipt must have an agentId');
  }

  if (!receipt.modelId) {
    errors.push('Trust receipt must have a modelId');
  }

  if (receipt.constitutionalScore !== undefined) {
    if (receipt.constitutionalScore < 0 || receipt.constitutionalScore > 1) {
      errors.push('Constitutional score must be between 0 and 1');
    }
  }

  if (receipt.ciqMetrics) {
    const ciqValidation = validateCIQMetrics(receipt.ciqMetrics);
    if (!ciqValidation.valid) {
      errors.push(...ciqValidation.errors);
    }
  }

  if (!receipt.verificationHash) {
    errors.push('Trust receipt must have a verificationHash');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate agent configuration
 */
export function validateAgent(agent: Partial<Agent>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!agent.id) {
    errors.push('Agent must have an id');
  }

  if (!agent.type) {
    errors.push('Agent must have a type');
  } else if (!['CONDUCTOR', 'VARIANT', 'EVALUATOR', 'OVERSEER'].includes(agent.type)) {
    errors.push('Agent type must be CONDUCTOR, VARIANT, EVALUATOR, or OVERSEER');
  }

  if (!agent.name) {
    errors.push('Agent must have a name');
  }

  if (agent.trustLevel !== undefined) {
    if (agent.trustLevel < 0 || agent.trustLevel > 1) {
      errors.push('Trust level must be between 0 and 1');
    }
  }

  if (agent.constitutionalCompliance !== undefined) {
    if (agent.constitutionalCompliance < 0 || agent.constitutionalCompliance > 1) {
      errors.push('Constitutional compliance must be between 0 and 1');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}

/**
 * Validate and sanitize object keys
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeString(key);
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[sanitizedKey] = sanitizeObject(value);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Check if value is empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}

/**
 * Validate required fields
 */
export function validateRequiredFields<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[]
): {
  valid: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (isEmpty(obj[field])) {
      missingFields.push(String(field));
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}