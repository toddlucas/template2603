using Hangfire;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class ConfigurationManagerExtensions
{
    public static string GetHangfireDbProvider(
        this ConfigurationManager configurationManager,
        string defaultProvider)
    {
        var provider = configurationManager.GetValue("HangfireDbProvider", defaultProvider);
        if (provider == null)
            throw new Exception("Provider entry not found");

        return provider;
    }
}
