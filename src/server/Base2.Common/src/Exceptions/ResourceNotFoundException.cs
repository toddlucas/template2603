namespace Base2.Exceptions;

/// <summary>
/// Thrown when a requested resource cannot be found.
/// Maps to HTTP 404 Not Found.
/// </summary>
/// <example>
/// <code>
/// var contact = await _dbSet.FindAsync(id);
/// if (contact == null)
/// {
///     throw new ResourceNotFoundException(_localizer["Contact not found."]);
/// }
/// </code>
/// </example>
public class ResourceNotFoundException : UserFacingException
{
    /// <inheritdoc />
    public override int StatusCode => 404; // Not Found

    /// <summary>
    /// Creates a new resource not found exception with a localized message.
    /// </summary>
    /// <param name="localizedMessage">The localized error message.</param>
    public ResourceNotFoundException(string localizedMessage) 
        : base(localizedMessage, ApiErrorCode.not_found)
    {
    }
}
