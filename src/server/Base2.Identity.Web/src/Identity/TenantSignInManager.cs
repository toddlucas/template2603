using System.Security.Claims;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Microsoft.AspNetCore.Identity;

/// <summary>
/// Provides the APIs for user sign in.
/// </summary>
/// <typeparam name="TUser">The type encapsulating a user.</typeparam>
public class TenantSignInManager<TUser, TKey> : SignInManager<TUser>
    where TUser : TenantIdentityUser<TKey>
    where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Creates a new instance of <see cref="SignInManager{TUser}"/>.
    /// </summary>
    /// <param name="userManager">An instance of <see cref="UserManager"/> used to retrieve users from and persist users.</param>
    /// <param name="contextAccessor">The accessor used to access the <see cref="HttpContext"/>.</param>
    /// <param name="claimsFactory">The factory to use to create claims principals for a user.</param>
    /// <param name="optionsAccessor">The accessor used to access the <see cref="IdentityOptions"/>.</param>
    /// <param name="logger">The logger used to log messages, warnings and errors.</param>
    /// <param name="schemes">The scheme provider that is used enumerate the authentication schemes.</param>
    /// <param name="confirmation">The <see cref="IUserConfirmation{TUser}"/> used check whether a user account is confirmed.</param>
    public TenantSignInManager(
        UserManager<TUser> userManager,
        IHttpContextAccessor contextAccessor,
        IUserClaimsPrincipalFactory<TUser> claimsFactory,
        IOptions<IdentityOptions> optionsAccessor,
        ILogger<SignInManager<TUser>> logger,
        IAuthenticationSchemeProvider schemes,
        IUserConfirmation<TUser> confirmation)
        : base(
            userManager,
            contextAccessor,
            claimsFactory,
            optionsAccessor,
            logger,
            schemes,
            confirmation)
    {
    }

    /// <summary>
    /// Creates a <see cref="ClaimsPrincipal"/> for the specified <paramref name="user"/>, as an asynchronous operation.
    /// </summary>
    /// <param name="user">The user to create a <see cref="ClaimsPrincipal"/> for.</param>
    /// <returns>The task object representing the asynchronous operation, containing the ClaimsPrincipal for the specified user.</returns>
    public override async Task<ClaimsPrincipal> CreateUserPrincipalAsync(TUser user)
    {
        var userPrincipal = await base.CreateUserPrincipalAsync(user);
        var identity = userPrincipal.Identities.First();
#if RESELLER
        // REVIEW: What's the best empty value here?
        var groupClaim = new Claim(CustomClaims.GroupId, user.GroupId.ToString() ?? "");
        identity.AddClaim(groupClaim);
#endif
        var tenantClaim = new Claim(CustomClaims.TenantId, user.TenantId.ToString() ?? "");
        identity.AddClaim(tenantClaim);
        return userPrincipal;
    }
}
