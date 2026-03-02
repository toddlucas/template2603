#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class IServiceCollectionExtensions
{
    /// <summary>
    /// Services used by the background only, or implementations that are
    /// required by services, but which have an implementation specific to the
    /// background task runner.
    /// </summary>
    public static IServiceCollection AddBackgroundServices(this IServiceCollection serviceCollection)
    {
        // Storage
        //serviceCollection.AddTransient<IFileStorageProvider, BackgroundDevFileStorageProvider>();

        return serviceCollection;
    }
}
