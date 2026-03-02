using Microsoft.AspNetCore.Identity;

namespace Base2.Identity;

/// <summary>
/// Provisions tenant context for a newly-created user.
/// Three cases:
///   1. New user, no pending invite → create a new tenant.
///   2. New user, pending invite for this email → assign to the invited tenant.
///   3. Existing user → no-op.
/// </summary>
public interface ITenantProvisioningService
{
    Task ProvisionAsync<TUser>(TUser user, CancellationToken cancellationToken = default)
        where TUser : class;
}
