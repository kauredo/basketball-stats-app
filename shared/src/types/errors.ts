/**
 * Error handling utilities
 * Provides type-safe error handling across web and mobile apps
 */

/**
 * Type guard to check if an error has a message property
 */
export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

/**
 * Extract a user-friendly error message from any error type
 *
 * @param error - Any error type (unknown)
 * @param fallback - Optional fallback message (default: "An unexpected error occurred")
 * @returns A string error message
 *
 * @example
 * try {
 *   await riskyOperation();
 * } catch (err) {
 *   setError(getErrorMessage(err));
 * }
 */
export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return fallback;
}

/**
 * Standard error interface for application errors
 */
export interface AppError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    isErrorWithMessage(error) &&
    (typeof (error as AppError).code === "string" ||
      typeof (error as AppError).code === "undefined")
  );
}
