/**
 * SYMBI Error Handling Utilities
 * Standardized error classes and handling
 */

export class SymbiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'SymbiError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
    };
  }
}

export class ValidationError extends SymbiError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends SymbiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends SymbiError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends SymbiError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends SymbiError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends SymbiError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends SymbiError {
  constructor(service: string, message?: string) {
    super(
      message || `Service ${service} is currently unavailable`,
      'SERVICE_UNAVAILABLE',
      503,
      { service }
    );
    this.name = 'ServiceUnavailableError';
  }
}

export class ConstitutionalComplianceError extends SymbiError {
  constructor(violations: string[], details?: Record<string, any>) {
    super(
      'Request does not meet constitutional compliance requirements',
      'CONSTITUTIONAL_COMPLIANCE_ERROR',
      400,
      { violations, ...details }
    );
    this.name = 'ConstitutionalComplianceError';
  }
}

export class TrustReceiptValidationError extends SymbiError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'TRUST_RECEIPT_VALIDATION_ERROR', 400, details);
    this.name = 'TrustReceiptValidationError';
  }
}

export class AgentCoordinationError extends SymbiError {
  constructor(message: string, agentId?: string, details?: Record<string, any>) {
    super(message, 'AGENT_COORDINATION_ERROR', 500, { agentId, ...details });
    this.name = 'AgentCoordinationError';
  }
}

/**
 * Error handler utility for consistent error responses
 */
export function handleError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, any>;
} {
  if (error instanceof SymbiError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      details: { stack: error.stack },
    };
  }

  return {
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    details: { error: String(error) },
  };
}

/**
 * Async error wrapper for consistent error handling
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error instanceof SymbiError ? error : new SymbiError(
        error instanceof Error ? error.message : 'Unknown error',
        'INTERNAL_ERROR',
        500
      );
    }
  };
}