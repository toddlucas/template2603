using System.Security.Claims;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.AspNetCore.Mvc;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class WebClaimsPrincipalExtensions
{
    public static (Guid userId, Guid tenantId, Guid groupId) GetUserIdentifiers(this ClaimsPrincipal principal)
    {
        Guid userId = principal.GetNameIdentifier();
        Guid tenantId = principal.GetTenantId();
        Guid groupId = principal.GetGroupId();
        return (userId, tenantId, groupId);
    }
}
