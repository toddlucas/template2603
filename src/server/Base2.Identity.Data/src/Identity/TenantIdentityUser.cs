namespace Microsoft.AspNetCore.Identity;

/// <summary>
/// The default implementation of <see cref="TenantIdentityUser{TKey}"/> which uses a string as a primary key.
/// </summary>
public class TenantIdentityUser : TenantIdentityUser<string>
{
    /// <summary>
    /// Initializes a new instance of <see cref="IdentityUser"/>.
    /// </summary>
    /// <remarks>
    /// The Id property is initialized to form a new GUID string value.
    /// </remarks>
    public TenantIdentityUser() : base()
    {
        Id = Guid.NewGuid().ToString();
        SecurityStamp = Guid.NewGuid().ToString();
    }

    /// <summary>
    /// Initializes a new instance of <see cref="IdentityUser"/>.
    /// </summary>
    /// <param name="userName">The user name.</param>
    /// <remarks>
    /// The Id property is initialized to form a new GUID string value.
    /// </remarks>
    public TenantIdentityUser(string userName) : this()
    {
        UserName = userName;
    }
}

/// <summary>
/// Represents a tenant-based user in the identity system.
/// </summary>
/// <typeparam name="TKey">The type used for the primary key for the user.</typeparam>
public class TenantIdentityUser<TKey> : IdentityUser<TKey> where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Initializes a new instance of <see cref="IdentityUser"/>.
    /// </summary>
    /// <remarks>
    /// The Id property is initialized to form a new GUID string value.
    /// </remarks>
    public TenantIdentityUser() { }

    /// <summary>
    /// Initializes a new instance of <see cref="IdentityUser"/>.
    /// </summary>
    /// <param name="userName">The user name.</param>
    /// <remarks>
    /// The Id property is initialized to form a new GUID string value.
    /// </remarks>
    public TenantIdentityUser(string userName) : this()
    {
        UserName = userName;
    }

#if RESELLER
    /// <summary>
    /// Gets or sets the group key for this user.
    /// </summary>
    [PersonalData]
    public virtual TKey GroupId { get; set; } = default!;
#endif

    /// <summary>
    /// Gets or sets the tenant key for this user.
    /// </summary>
    [PersonalData]
    public virtual TKey TenantId { get; set; } = default!;

    /// <summary>
    /// Only one account with a given email and username is routable outside of a tenant.
    /// </summary>
    /// <value>True if the email address and username are routable outside of a
    /// tenant.</value>
    //public virtual bool IsDefaultUser { get; set; }
}
