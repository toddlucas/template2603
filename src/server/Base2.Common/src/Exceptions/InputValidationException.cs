namespace Base2.Exceptions;

/// <summary>
/// Thrown when user input fails validation.
/// Maps to HTTP 400 Bad Request.
/// </summary>
/// <example>
/// <code>
/// if (string.IsNullOrWhiteSpace(model.Email))
/// {
///     throw new InputValidationException(_localizer["Email is required."]);
/// }
///
/// // With field-level errors
/// var errors = new Dictionary&lt;string, object&gt;
/// {
///     ["email"] = _localizer["Email is required."],
///     ["firstName"] = _localizer["First name is required."]
/// };
/// throw new InputValidationException(_localizer["Validation failed."], errors);
/// </code>
/// </example>
public class InputValidationException : UserFacingException
{
    /// <inheritdoc />
    public override int StatusCode => 400; // Bad Request

    /// <summary>
    /// Creates a new validation exception with a localized message.
    /// </summary>
    /// <param name="localizedMessage">The localized error message.</param>
    public InputValidationException(string localizedMessage)
        : base(localizedMessage, ApiErrorCode.validation_error)
    {
    }

    /// <summary>
    /// Creates a new validation exception with a localized message and field-level errors.
    /// </summary>
    /// <param name="localizedMessage">The localized error message.</param>
    /// <param name="fieldErrors">Dictionary of field names to error messages.</param>
    public InputValidationException(string localizedMessage, Dictionary<string, object> fieldErrors)
        : base(localizedMessage, ApiErrorCode.validation_error)
    {
        Details = fieldErrors;
    }
}
