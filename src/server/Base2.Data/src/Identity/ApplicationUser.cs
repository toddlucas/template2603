namespace Microsoft.AspNetCore.Identity;

// https://learn.microsoft.com/en-us/aspnet/core/security/authentication/customize-identity-model
public class ApplicationUser : TenantIdentityUser<Guid> // IdentityUser
{
    public ApplicationUser()
    {
#if DEBUG
        TenantId = IdentitySeedData.TenantId;
        GroupId = IdentitySeedData.GroupId;
#else
        throw new NotImplementedException();
#endif
    }
}
