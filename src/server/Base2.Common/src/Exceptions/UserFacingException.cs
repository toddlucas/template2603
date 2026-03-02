namespace Base2.Exceptions;

/// <summary>
/// Base class for exceptions that contain user-facing, localized messages.
/// These exceptions are safe to display directly to end users.
/// </summary>
/// <remarks>
/// User-facing exceptions should:
/// - Always use localized messages via IStringLocalizer
/// - Never expose internal implementation details or sensitive information
/// - Include an ApiErrorCode for client-side error handling
/// - Map to appropriate HTTP status codes
/// </remarks>
public abstract class UserFacingException : Exception
{
    /// <summary>
    /// The localized message safe for display to end users.
    /// </summary>
    public string LocalizedMessage { get; }
    
    /// <summary>
    /// Error code for client-side handling. Exported to TypeScript as a string union.
    /// </summary>
    public ApiErrorCode ErrorCode { get; }
    
    /// <summary>
    /// Optional additional details (e.g., field-level validation errors).
    /// </summary>
    public Dictionary<string, object>? Details { get; init; }
    
    /// <summary>
    /// HTTP status code to return for this exception type.
    /// </summary>
    public abstract int StatusCode { get; }

    /// <summary>
    /// Creates a new user-facing exception with a localized message and error code.
    /// </summary>
    /// <param name="localizedMessage">The localized, user-safe error message.</param>
    /// <param name="errorCode">The error code for client-side handling.</param>
    protected UserFacingException(string localizedMessage, ApiErrorCode errorCode) 
        : base(localizedMessage)
    {
        LocalizedMessage = localizedMessage;
        ErrorCode = errorCode;
    }

    /// <summary>
    /// Creates a new user-facing exception with a localized message, error code, and inner exception.
    /// </summary>
    /// <param name="localizedMessage">The localized, user-safe error message.</param>
    /// <param name="errorCode">The error code for client-side handling.</param>
    /// <param name="innerException">The exception that caused this exception.</param>
    protected UserFacingException(string localizedMessage, ApiErrorCode errorCode, Exception innerException) 
        : base(localizedMessage, innerException)
    {
        LocalizedMessage = localizedMessage;
        ErrorCode = errorCode;
    }
}
