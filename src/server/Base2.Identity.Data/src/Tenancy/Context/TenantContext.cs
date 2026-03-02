namespace Base2.Identity;

public class TenantContext<TKey> where TKey : IEquatable<TKey>
{
    public string? Hostname { get; set; }
    public string? Subdomain { get; set; }

#if RESELLER
    public TKey? CurrentGroupId { get; set; }
    public TKey GroupId => CurrentGroupId ?? throw new Exception("Required tenant context is not present.");
#endif
    public TKey? HostnameTenantId { get; set; }
    public TKey? SubdomainTenantId { get; set; }
    public TKey? UserTenantId { get; set; }
    public TKey? CurrentId { get; set; }

    public TKey TenantId => CurrentId ?? throw new Exception("Required tenant context is not present.");
}
