#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class IServiceCollectionExtensions
{
    /// <summary>
    /// Services used by the foreground only, or implementations that are
    /// required by services, but which have an implementation specific to the
    /// web app.
    /// </summary>
    public static IServiceCollection AddForegroundServices(this IServiceCollection serviceCollection)
    {
        // Storage
        //serviceCollection.AddTransient<IFileStorageProvider, BackgroundDevFileStorageProvider>();

        return serviceCollection;
    }
}
