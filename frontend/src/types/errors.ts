/**
 * Error handling types and utilities
 */

/** Application error with structured information */
export interface AppError extends Error {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

/** Error codes for different error types */
export enum ErrorCode {
  // Connection errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_CLOSED = 'CONNECTION_CLOSED',

  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // API errors
  API_ERROR = 'API_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',

  // Telemetry errors
  TELEMETRY_PARSE_ERROR = 'TELEMETRY_PARSE_ERROR',
  TELEMETRY_INVALID = 'TELEMETRY_INVALID',

  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/** Network error */
export interface NetworkError extends AppError {
  code: ErrorCode.CONNECTION_FAILED | ErrorCode.CONNECTION_TIMEOUT | ErrorCode.CONNECTION_CLOSED;
  endpoint?: string;
}

/** Validation error */
export interface ValidationError extends AppError {
  code: ErrorCode.INVALID_INPUT | ErrorCode.VALIDATION_ERROR;
  field?: string;
  value?: unknown;
}

/** API error response */
export interface APIErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Type guard for AppError */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error
  );
}

/** Type guard for NetworkError */
export function isNetworkError(error: unknown): error is NetworkError {
  return (
    isAppError(error) &&
    (error.code === ErrorCode.CONNECTION_FAILED ||
      error.code === ErrorCode.CONNECTION_TIMEOUT ||
      error.code === ErrorCode.CONNECTION_CLOSED)
  );
}

/** Type guard for ValidationError */
export function isValidationError(error: unknown): error is ValidationError {
  return (
    isAppError(error) &&
    (error.code === ErrorCode.INVALID_INPUT || error.code === ErrorCode.VALIDATION_ERROR)
  );
}

/**
 * Creates an app error with standardized format
 */
export function createAppError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): AppError {
  return {
    code,
    message,
    details,
    timestamp: Date.now(),
    name: 'AppError',
  };
}
