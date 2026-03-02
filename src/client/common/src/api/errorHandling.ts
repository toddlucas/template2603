import { ApiError } from './ApiError';
import type { ApiErrorCode } from '$/models';
import { toast } from 'sonner';

/**
 * Standard error handler that displays appropriate UI based on error code.
 * Use this for simple error display with toast notifications.
 * 
 * @param error - The error to handle (ApiError or unknown)
 * @param context - Optional context string (e.g., "Failed to load contacts")
 * 
 * @example
 * try {
 *   const result = await api.create(data);
 *   if (!result.ok) {
 *     const error = await ApiError.fromResponse(result.error);
 *     handleApiError(error, 'Failed to create contact');
 *   }
 * } catch (err) {
 *   handleApiError(err);
 * }
 */
export function handleApiError(error: unknown, context?: string): void {
  // Handle non-ApiError cases
  if (!(error instanceof ApiError)) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    const displayMessage = context ? `${context}: ${message}` : message;
    toast.error(displayMessage);
    console.error('Non-API error:', error);
    return;
  }

  // Internal errors - show generic message, log details for support
  if (error.isInternalError()) {
    toast.error('Something went wrong. Please try again later.');
    console.error('Internal error:', {
      requestId: error.requestId,
      status: error.status,
      url: error.url,
      detail: error.detail, // Preserved for developer debugging
    });
    return;
  }

  // Specific errors - safe to display detail to user
  const message = error.getUserMessage();
  const displayMessage = context ? `${context}: ${message}` : message;
  toast.error(displayMessage);
}

/**
 * Handle validation errors with field-level details.
 * Returns field errors for form integration, and shows a toast for the general message.
 * 
 * @param error - The error to handle
 * @returns Record of field names to error messages, or null if not a validation error
 * 
 * @example
 * const fieldErrors = handleValidationError(error);
 * if (fieldErrors) {
 *   setFormErrors(fieldErrors);
 * }
 */
export function handleValidationError(
  error: unknown
): Record<string, string> | null {
  if (!(error instanceof ApiError)) {
    handleApiError(error);
    return null;
  }

  if (!error.isValidationError()) {
    handleApiError(error);
    return null;
  }

  // Show general validation message
  if (error.detail) {
    toast.error(error.detail);
  }

  // Return field errors for form display
  return error.fieldErrors || null;
}

/**
 * Type guard to check if error is a specific error code.
 * 
 * @example
 * if (isErrorCode(error, 'duplicate_error')) {
 *   // Handle duplicate specifically
 *   showDuplicateModal();
 * }
 */
export function isErrorCode(
  error: unknown,
  code: ApiErrorCode
): error is ApiError {
  return error instanceof ApiError && error.errorCode === code;
}

/**
 * Extract user-friendly error message from any error type.
 * Automatically hides internal error details.
 * 
 * @example
 * const message = getErrorMessage(error);
 * setErrorState(message);
 */
export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : 'An error occurred';
  }

  return error.getUserMessage();
}

/**
 * Check if error should trigger a retry (transient errors).
 * 
 * @example
 * if (isRetryableError(error)) {
 *   setTimeout(() => retry(), 1000);
 * }
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  // Retry on network issues, rate limits, and service unavailable
  return (
    error.errorCode === 'rate_limit_exceeded' ||
    error.errorCode === 'service_unavailable' ||
    error.status === 503 ||
    error.status === 429
  );
}

/**
 * Log error for analytics/monitoring (extensible for Sentry, LogRocket, etc.)
 * 
 * @example
 * try {
 *   await api.create(data);
 * } catch (err) {
 *   logError(err, { operation: 'createContact', userId: user.id });
 * }
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (error instanceof ApiError) {
    console.error('API Error:', {
      errorCode: error.errorCode,
      status: error.status,
      url: error.url,
      requestId: error.requestId,
      detail: error.detail,
      ...context,
    });
    
    // TODO: Integrate with error tracking service
    // Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error:', error, context);
  }
}
