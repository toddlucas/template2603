using Microsoft.AspNetCore.Identity;

namespace Microsoft.AspNetCore.Identity;

/// <summary>
/// The default implementation of <see cref="IdentityTenant{TKey}"/> which uses a string as a primary key.
/// </summary>
public class IdentityTenant : IdentityTenant<string>
{
    /// <summary>
    /// Initializes a new instance of <see cref="IdentityTenant"/>.
    /// </summary>
    /// <remarks>
    /// The Id property is initialized to form a new GUID string value.
    /// </remarks>
    public IdentityTenant()
    {
        Id = Guid.NewGuid().ToString();
    }
}

/// <summary>
/// Represents a tenant in the identity system.
/// </summary>
/// <typeparam name="TKey">The type used for the primary key for the user.</typeparam>
public class IdentityTenant<TKey> where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Initializes a new instance of <see cref="IdentityTenant{TKey}"/>.
    /// </summary>
    public IdentityTenant() { }

    /// <summary>
    /// Gets or sets the primary key for this tenant.
    /// </summary>
    [PersonalData]
    public virtual TKey Id { get; set; } = default!;

    public string? Domain { get; set; }
    public string? Subdomain { get; set; }
}
