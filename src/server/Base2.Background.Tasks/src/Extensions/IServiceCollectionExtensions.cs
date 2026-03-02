#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class IServiceCollectionExtensions
{
    /// <summary>
    /// Services used by both foreground and background, these services are
    /// provided by the background task runner, but required by lower level
    /// services, so they're injected by interface.
    /// </summary>
    public static IServiceCollection AddTaskServices(this IServiceCollection serviceCollection)
    {
        // Integrations
        //serviceCollection.AddTransient<IGoogleAnalyticsIntegration, GoogleAnalyticsIntegration>();

        // Background jobs
        // serviceCollection.AddTransient<Base2.Prospecting.Importing.ProcessContactImportJob>();

        // Job enqueuers (interfaces for triggering jobs)
        // serviceCollection.AddSingleton<Base2.Infrastructure.IEmailAccountHealthCheckJobEnqueuer, 
        //    Base2.Infrastructure.EmailAccountHealthCheckJobEnqueuer>();

        return serviceCollection;
    }
}
