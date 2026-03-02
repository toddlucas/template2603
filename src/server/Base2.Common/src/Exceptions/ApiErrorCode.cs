namespace Base2.Exceptions;

/// <summary>
/// Error codes for API responses. These codes are exported to TypeScript for client-side error handling.
/// </summary>
/// <remarks>
/// - Use snake_case for enum values (e.g., validation_error)
/// - Each code maps to a specific HTTP status code via the exception that uses it
/// - Codes are surfaced to clients as strings for better debuggability
/// </remarks>
public enum ApiErrorCode
{
    /// <summary>
    /// Request validation failed (HTTP 400).
    /// </summary>
    validation_error,

    /// <summary>
    /// Resource not found (HTTP 404).
    /// </summary>
    not_found,

    /// <summary>
    /// Resource already exists, typically a duplicate (HTTP 409).
    /// </summary>
    duplicate_error,

    /// <summary>
    /// Business rule violation (HTTP 422).
    /// </summary>
    business_rule_violation,

    /// <summary>
    /// External provider or service error (HTTP 422).
    /// </summary>
    provider_error,

    /// <summary>
    /// AI service processing error (HTTP 422).
    /// </summary>
    ai_processing_error,

    /// <summary>
    /// Authentication error - invalid or missing credentials (HTTP 401).
    /// </summary>
    authentication_error,

    /// <summary>
    /// Permission denied - user lacks required permissions (HTTP 403).
    /// </summary>
    permission_denied,

    /// <summary>
    /// Rate limit exceeded (HTTP 429).
    /// </summary>
    rate_limit_exceeded,

    /// <summary>
    /// Internal server error (HTTP 500).
    /// </summary>
    internal_error,

    /// <summary>
    /// Service temporarily unavailable (HTTP 503).
    /// </summary>
    service_unavailable,
}
