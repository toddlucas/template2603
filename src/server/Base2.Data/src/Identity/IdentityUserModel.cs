namespace Microsoft.AspNetCore.Identity;

/// <summary>
/// The default implementation of <see cref="IdentityUser{TKey}"/> which uses a string as a primary key.
/// </summary>
public class IdentityUserModel : IdentityUserModel<string>
{
}

/// <summary>
/// Represents a user in the identity system
/// </summary>
/// <typeparam name="TKey">The type used for the primary key for the user.</typeparam>
public class IdentityUserModel<TKey> // BUGBUG: TypeGen - where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Gets or sets the primary key for this user.
    /// </summary>
    [PersonalData]
    public virtual TKey Id { get; set; } = default!;

    /// <summary>
    /// Gets or sets the user name for this user.
    /// </summary>
    [ProtectedPersonalData]
    public virtual string? UserName { get; set; }


    /// <summary>
    /// Gets or sets the email address for this user.
    /// </summary>
    [ProtectedPersonalData]
    public virtual string? Email { get; set; }


    /// <summary>
    /// Gets or sets a telephone number for the user.
    /// </summary>
    [ProtectedPersonalData]
    public virtual string? PhoneNumber { get; set; }


    /// <summary>
    /// Returns the username for this user.
    /// </summary>
    public override string ToString()
        => UserName ?? string.Empty;
}
