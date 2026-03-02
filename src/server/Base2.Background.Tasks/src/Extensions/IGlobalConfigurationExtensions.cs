using Hangfire;
using Hangfire.Storage.SQLite;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class IGlobalConfigurationExtensions
{
    /// <summary>
    /// Use the default Hangfire storage.
    /// </summary>
    public static IGlobalConfiguration UseDefaultHangfireStorage(this IGlobalConfiguration globalConfiguration, ConfigurationManager configuration)
        => globalConfiguration.UseHangfireStorage(configuration, "Default", "Npgsql");

    public static IGlobalConfiguration UseHangfireStorage(
        this IGlobalConfiguration globalConfiguration,
        ConfigurationManager configurationManager,
        string configurationPrefix,
        string defaultProvider)
    {
        string provider = configurationManager.GetHangfireDbProvider(defaultProvider: "Npgsql");
        string connectionString = GetConnectionString(configurationManager, configurationPrefix, provider);

        if (provider == "Sqlite")
        {
            globalConfiguration.UseSQLiteStorage(connectionString, new SQLiteStorageOptions
            {
                QueuePollInterval = TimeSpan.FromSeconds(5.0),
            });
        }
        else if (provider == "Npgsql")
        {
        }
        else
        {
            throw new Exception($"Hangfire configuration not found for {provider} provider.");
        }

        return globalConfiguration;
    }

    private static string GetConnectionString(ConfigurationManager configurationManager, string configurationPrefix, string provider)
    {
        var connectionString = configurationManager.GetConnectionString(
            provider + configurationPrefix + "HangfireConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new Exception($"Hangfire connection string not found for {provider}.");
        }

        return connectionString;
    }
}
