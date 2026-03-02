#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

/// <summary>
/// Extension methods for IConfiguration to support database provider detection.
/// </summary>
public static class ConfigurationExtensions
{
    /// <summary>
    /// Gets the database provider from configuration.
    /// </summary>
    /// <param name="configuration">The configuration instance.</param>
    /// <param name="configurationPrefix">The configuration prefix (e.g., "AppDb").</param>
    /// <param name="defaultProvider">The default provider if not specified.</param>
    /// <returns>The database provider name.</returns>
    public static string GetDatabaseProvider(
        this IConfiguration configuration,
        string configurationPrefix,
        string defaultProvider)
    {
        var provider = configuration.GetValue(configurationPrefix + "Provider", defaultProvider);
        if (provider == null)
            throw new Exception("Provider entry not found");

        return provider;
    }

    /// <summary>
    /// Determines if in-memory database mode is enabled.
    /// </summary>
    /// <param name="configuration">The configuration instance.</param>
    /// <returns>True if in-memory mode is enabled, false otherwise.</returns>
    public static bool IsInMemoryDatabaseEnabled(this IConfiguration configuration)
        => configuration.GetValue("UseInMemoryDatabase", false);
}
