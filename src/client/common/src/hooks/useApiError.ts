import { useCallback } from 'react';
import { 
  handleApiError, 
  handleValidationError, 
  isErrorCode as isErrorCodeUtil,
  getErrorMessage as getErrorMessageUtil,
  logError,
} from '$/api/errorHandling';
import type { ApiErrorCode } from '$/models';

export interface UseApiErrorReturn {
  /**
   * Handle any API error with standard toast notification.
   * Automatically distinguishes between internal and user-facing errors.
   * 
   * @example
   * const { handleError } = useApiError();
   * 
   * try {
   *   const result = await contactsApi.create(contact);
   *   if (!result.ok) {
   *     const error = await ApiError.fromResponse(result.error);
   *     handleError(error, 'Failed to create contact');
   *   }
   * } catch (err) {
   *   handleError(err);
   * }
   */
  handleError: (error: unknown, context?: string) => void;

  /**
   * Handle validation error and return field errors for form integration.
   * Shows a toast for the general message, returns field errors for form display.
   * 
   * @example
   * const { handleValidation } = useApiError();
   * const [fieldErrors, setFieldErrors] = useState({});
   * 
   * const errors = handleValidation(error);
   * if (errors) {
   *   setFieldErrors(errors);
   * }
   */
  handleValidation: (error: unknown) => Record<string, string> | null;

  /**
   * Check if error matches a specific error code.
   * 
   * @example
   * if (isErrorCode(error, 'duplicate_error')) {
   *   setShowDuplicateModal(true);
   * } else {
   *   handleError(error);
   * }
   */
  isErrorCode: (error: unknown, code: ApiErrorCode) => boolean;

  /**
   * Get user-friendly error message (hides internal error details).
   * 
   * @example
   * const message = getMessage(error);
   * setErrorText(message);
   */
  getMessage: (error: unknown) => string;

  /**
   * Log error with context for debugging/analytics.
   * 
   * @example
   * logError(error, { operation: 'createContact', contactId: 123 });
   */
  log: (error: unknown, context?: Record<string, unknown>) => void;
}

/**
 * React hook for standardized API error handling.
 * Provides utilities for handling errors in React components.
 * 
 * @example
 * function ContactForm() {
 *   const { handleError, handleValidation } = useApiError();
 *   
 *   const onSubmit = async (data) => {
 *     try {
 *       const result = await contactsApi.create(data);
 *       if (result.ok) {
 *         toast.success('Contact created');
 *       } else {
 *         const error = await ApiError.fromResponse(result.error);
 *         const fieldErrors = handleValidation(error);
 *         if (fieldErrors) {
 *           setFieldErrors(fieldErrors);
 *         }
 *       }
 *     } catch (err) {
 *       handleError(err);
 *     }
 *   };
 * }
 */
export function useApiError(): UseApiErrorReturn {
  const handleError = useCallback((error: unknown, context?: string) => {
    handleApiError(error, context);
  }, []);

  const handleValidation = useCallback((error: unknown) => {
    return handleValidationError(error);
  }, []);

  const isErrorCode = useCallback((error: unknown, code: ApiErrorCode) => {
    return isErrorCodeUtil(error, code);
  }, []);

  const getMessage = useCallback((error: unknown) => {
    return getErrorMessageUtil(error);
  }, []);

  const log = useCallback((error: unknown, context?: Record<string, unknown>) => {
    logError(error, context);
  }, []);

  return {
    handleError,
    handleValidation,
    isErrorCode,
    getMessage,
    log,
  };
}
