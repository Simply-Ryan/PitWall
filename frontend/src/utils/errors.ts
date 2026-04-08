/**
 * Error handling and recovery utilities
 */

import { AppError, ErrorCode, createAppError, isAppError } from '@types/errors';

/**
 * Safely extracts error message from unknown error types
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

/**
 * Safely converts unknown error to AppError
 */
export function normalizeError(error: unknown, code: ErrorCode = ErrorCode.UNKNOWN_ERROR): AppError {
  if (isAppError(error)) {
    return error;
  }

  const message = getErrorMessage(error);
  return createAppError(code, message, {
    originalError: error instanceof Error ? error.stack : String(error),
  });
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  throw lastError ?? new Error('Unknown error in retry');
}

/**
 * Type-safe error handler that logs and optionally reports errors
 */
export function handleError(
  error: unknown,
  context?: string,
  shouldThrow: boolean = false
): AppError {
  const appError = normalizeError(error);

  // Log error with context
  console.error(
    `[${appError.code}]${context ? ` ${context}` : ''}:`,
    appError.message,
    appError.details
  );

  if (shouldThrow) {
    throw appError;
  }

  return appError;
}
