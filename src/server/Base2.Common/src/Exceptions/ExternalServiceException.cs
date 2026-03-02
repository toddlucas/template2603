namespace Base2.Exceptions;

/// <summary>
/// Thrown when an external service (email provider, AI provider, enrichment provider, etc.) fails.
/// Maps to HTTP 422 Unprocessable Entity.
/// </summary>
/// <example>
/// <code>
/// try
/// {
///     await _emailProvider.SendAsync(message);
/// }
/// catch (Exception ex)
/// {
///     throw new ExternalServiceException(
///         _localizer["Failed to send email. Please check your email provider configuration."],
///         ex);
/// }
/// </code>
/// </example>
public class ExternalServiceException : UserFacingException
{
    /// <inheritdoc />
    public override int StatusCode => 422; // Unprocessable Entity

    /// <summary>
    /// Creates a new external service exception with a localized message.
    /// </summary>
    /// <param name="localizedMessage">The localized error message.</param>
    public ExternalServiceException(string localizedMessage) 
        : base(localizedMessage, ApiErrorCode.provider_error)
    {
    }

    /// <summary>
    /// Creates a new external service exception with a localized message and inner exception.
    /// </summary>
    /// <param name="localizedMessage">The localized error message.</param>
    /// <param name="innerException">The exception from the external service.</param>
    public ExternalServiceException(string localizedMessage, Exception innerException) 
        : base(localizedMessage, ApiErrorCode.provider_error, innerException)
    {
    }
}
