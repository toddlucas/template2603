using Base2.Observability;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

/// <summary>
/// Extension methods for registering observability services.
/// </summary>
public static class ObservabilityServiceCollectionExtensions
{
    /// <summary>
    /// Adds metrics instrumentation to the service collection.
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddObservabilityMetrics(this IServiceCollection services)
    {
        services.AddSingleton<IObservabilityMetrics, ObservabilityMetrics>();
        return services;
    }
}
