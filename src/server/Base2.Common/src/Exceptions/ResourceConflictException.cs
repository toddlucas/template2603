namespace Base2.Exceptions;

/// <summary>
/// Thrown when an operation conflicts with existing data (e.g., duplicate email).
/// Maps to HTTP 409 Conflict.
/// </summary>
/// <example>
/// <code>
/// var existingContact = await _dbSet
///     .FirstOrDefaultAsync(c => c.Email == model.Email);
/// if (existingContact != null)
/// {
///     throw new ResourceConflictException(
///         _localizer["A contact with email '{0}' already exists.", model.Email]);
/// }
/// </code>
/// </example>
public class ResourceConflictException : UserFacingException
{
    /// <inheritdoc />
    public override int StatusCode => 409; // Conflict

    /// <summary>
    /// Creates a new resource conflict exception with a localized message.
    /// </summary>
    /// <param name="localizedMessage">The localized error message.</param>
    public ResourceConflictException(string localizedMessage) 
        : base(localizedMessage, ApiErrorCode.duplicate_error)
    {
    }
}
