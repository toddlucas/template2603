#pragma warning disable IDE0130 // Namespace does not match folder structure
using Microsoft.Extensions.Configuration;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class WriteGuardConfigurationExtensions
{
    public static bool IsWriteGuardInterceptorEnabled(
        this IConfiguration configuration)
        => configuration.GetValue("IsWriteGuardInterceptorEnabled", false);
}
