namespace Base2.Identity;

/// <summary>
/// Stub implementation. Tenant assignment is currently handled by the ApplicationUser
/// constructor in debug mode. This service exists as the injection point for the
/// production implementation (invite lookup, tenant creation, etc.).
/// </summary>
public class TenantProvisioningService : ITenantProvisioningService
{
    public Task ProvisionAsync<TUser>(TUser user, CancellationToken cancellationToken = default)
        where TUser : class
    {
        // Stub: ApplicationUser() constructor sets TenantId in DEBUG.
        // Full implementation will create or assign a tenant here.
        return Task.CompletedTask;
    }
}
