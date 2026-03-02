namespace Microsoft.AspNetCore.Identity;

/// <summary>
/// Represents the authentication status information for a user.
/// </summary>
public class AuthStatusModel
{
    /// <summary>
    /// Gets or sets the token expiration time as a Unix timestamp (seconds since epoch) in UTC.
    /// </summary>
    public long? ExpiresAt { get; set; }

    /// <summary>
    /// Gets or sets the token expiration time as a DateTime in UTC.
    /// </summary>
    public DateTime? ExpiresAtUtc { get; set; }

    /// <summary>
    /// Gets whether the token is expired.
    /// </summary>
    public bool IsExpired => ExpiresAtUtc.HasValue && ExpiresAtUtc.Value < DateTime.UtcNow;
}

