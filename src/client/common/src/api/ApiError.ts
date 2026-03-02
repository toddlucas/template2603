import type { ApiErrorCode } from '$/models';

/**
 * Standardized API error class for consistent error handling across all API clients.
 * Extends Error with RFC 7807 Problem Details fields and typed error codes.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly url?: string;
  public readonly response?: Response;

  // ProblemDetails properties (RFC 7807) - set when available in response
  public readonly problemType?: string;
  public readonly title?: string;
  public readonly detail?: string;
  public readonly instance?: string;

  // Base2 extensions
  public readonly errorCode?: ApiErrorCode;
  public readonly fieldErrors?: Record<string, string>;
  public readonly requestId?: string;

  constructor(
    message: string,
    status: number,
    statusText: string = '',
    url?: string,
    response?: Response,
    problemType?: string,
    title?: string,
    detail?: string,
    instance?: string,
    errorCode?: ApiErrorCode,
    fieldErrors?: Record<string, string>,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.response = response;
    this.problemType = problemType;
    this.title = title;
    this.detail = detail;
    this.instance = instance;
    this.errorCode = errorCode;
    this.fieldErrors = fieldErrors;
    this.requestId = requestId;
  }

  /**
   * Factory method to create ApiError from Response
   */
  static async fromResponse(response: Response, defaultMessage?: string): Promise<ApiError> {
    const url = response.url;
    const status = response.status;
    const statusText = response.statusText;

    let message = defaultMessage || `HTTP ${status}: ${statusText}`;
    let problemType: string | undefined;
    let title: string | undefined;
    let detail: string | undefined;
    let instance: string | undefined;
    let errorCode: ApiErrorCode | undefined;
    let fieldErrors: Record<string, string> | undefined;
    let requestId: string | undefined;

    // Try to extract error details from response body
    try {
      const body = await response.clone().text();
      if (body) {
        try {
          const json = JSON.parse(body);

          // Extract RFC 9110 Problem Details fields
          problemType = json.type;
          title = json.title;
          detail = json.detail;
          instance = json.instance;

          // Extract Base2 extensions
          errorCode = json.errorCode as ApiErrorCode;
          fieldErrors = json.errors;
          requestId = json.requestId;

          // Message priority: detail > defaultMessage > title > message > statusText
          message = detail || defaultMessage || title || json.message || `HTTP ${status}: ${statusText}`;
        } catch {
          // If not JSON, use the text body if it's short enough
          if (body.length < 200) {
            message = body;
          }
        }
      }
    } catch {
      // Ignore errors when trying to read response body
    }

    return new ApiError(
      message,
      status,
      statusText,
      url,
      response,
      problemType,
      title,
      detail,
      instance,
      errorCode,
      fieldErrors,
      requestId
    );
  }

  /**
   * Helper function to extract meaningful error message from various error types.
   * Automatically hides internal error details.
   */
  static extractErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
      // Hide internal error details
      if (error.isInternalError()) {
        return 'Something went wrong. Please try again later.';
      }

      // Use problem details if available
      if (error.isProblemDetails && error.detail) {
        return error.detail;
      } else if (error.isProblemDetails && error.title) {
        return error.title;
      } else {
        return error.message;
      }
    } else if (error instanceof Error) {
      return error.message;
    }
    return 'An unknown error occurred';
  }

  /**
   * Check if this is a specific HTTP status error
   */
  isStatus(status: number): boolean {
    return this.status === status;
  }

  /**
   * Check if this is a not found error
   */
  isNotFound(): boolean {
    return this.status === 404 || this.errorCode === 'not_found';
  }

  /**
   * Check if this is an unauthorized error
   */
  isUnauthorized(): boolean {
    return this.status === 401 || this.errorCode === 'authentication_error';
  }

  /**
   * Check if this is a forbidden error
   */
  isForbidden(): boolean {
    return this.status === 403 || this.errorCode === 'permission_denied';
  }

  /**
   * Check if this is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * Check if this error contains RFC 7807 Problem Details information
   */
  get isProblemDetails(): boolean {
    return this.problemType !== undefined || this.title !== undefined || this.detail !== undefined;
  }

  // ============================================
  // Typed Error Code Checks
  // ============================================

  /**
   * Check if this is an internal server error (should show generic message)
   */
  isInternalError(): boolean {
    return this.errorCode === 'internal_error';
  }

  /**
   * Check if this is a validation error
   */
  isValidationError(): boolean {
    return this.errorCode === 'validation_error';
  }

  /**
   * Check if this is a duplicate/conflict error
   */
  isDuplicateError(): boolean {
    return this.errorCode === 'duplicate_error';
  }

  /**
   * Check if this is a business rule violation
   */
  isBusinessRuleViolation(): boolean {
    return this.errorCode === 'business_rule_violation';
  }

  /**
   * Check if this is an external service/provider error
   */
  isProviderError(): boolean {
    return this.errorCode === 'provider_error';
  }

  /**
   * Check if this error has field-level validation errors
   */
  hasFieldErrors(): boolean {
    return !!this.fieldErrors && Object.keys(this.fieldErrors).length > 0;
  }

  /**
   * Get a user-safe error message (hides internal error details)
   */
  getUserMessage(): string {
    if (this.isInternalError()) {
      return 'Something went wrong. Please try again later.';
    }
    return this.detail || this.title || this.message;
  }
}
