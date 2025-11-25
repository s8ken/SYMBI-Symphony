/**
 * SYMBI Shared API Types
 * Common types used across all SYMBI components
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  version: string;
  duration?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ResponseMeta & {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface ApiRequest {
  id?: string;
  timestamp?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  services: {
    [key: string]: {
      status: 'up' | 'down';
      latency?: number;
      message?: string;
    };
  };
}