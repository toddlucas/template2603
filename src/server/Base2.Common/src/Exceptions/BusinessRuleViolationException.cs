namespace Base2.Exceptions;

/// <summary>
/// Thrown when a business rule is violated.
/// Maps to HTTP 422 Unprocessable Entity.
/// </summary>
/// <example>
/// <code>
/// if (sequence.Status != SequenceStatus.Draft)
/// {
///     throw new BusinessRuleViolationException(
///         _localizer["Cannot modify an active sequence. Pause it first."]);
/// }
/// </code>
/// </example>
public class BusinessRuleViolationException : UserFacingException
{
    /// <inheritdoc />
    public override int StatusCode => 422; // Unprocessable Entity

    /// <summary>
    /// Creates a new business rule violation exception with a localized message.
    /// </summary>
    /// <param name="localizedMessage">The localized error message.</param>
    public BusinessRuleViolationException(string localizedMessage) 
        : base(localizedMessage, ApiErrorCode.business_rule_violation)
    {
    }
}
