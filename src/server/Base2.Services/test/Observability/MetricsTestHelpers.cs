using System.Diagnostics.Metrics;

using Microsoft.Extensions.Diagnostics.Metrics.Testing;

using Base2.Observability;

namespace Base2.Services.Test.Observability;

/// <summary>
/// Null implementation of IObservabilityMetrics for testing.
/// </summary>
public class NullObservabilityMetrics : IObservabilityMetrics
{
    public void RecordBackgroundJobCompleted(string jobType, double durationSeconds) { }
    public void RecordBackgroundJobFailed(string jobType, string errorType) { }
    public void RecordApiRequest(string httpMethod, string route, int statusCode, double durationSeconds) { }
    public void RecordApiError(string httpMethod, string route, string errorType) { }
    public void RecordDatabaseQuery(string operation, string entity, double durationSeconds) { }
}

/// <summary>
/// Helper methods for testing metrics.
/// </summary>
public static class MetricsTestHelpers
{
    /// <summary>
    /// Creates a service provider with metrics services registered.
    /// </summary>
    public static IServiceProvider CreateServiceProvider()
    {
        var services = new ServiceCollection();
        services.AddMetrics();
        services.AddObservabilityMetrics();
        return services.BuildServiceProvider();
    }

    /// <summary>
    /// Creates a metric collector for the specified instrument.
    /// </summary>
    /// <typeparam name="T">The measurement type</typeparam>
    /// <param name="serviceProvider">The service provider</param>
    /// <param name="instrumentName">The instrument name</param>
    /// <returns>A metric collector</returns>
    public static MetricCollector<T> CreateCollector<T>(
        IServiceProvider serviceProvider,
        string instrumentName) where T : struct
    {
        var meterFactory = serviceProvider.GetRequiredService<IMeterFactory>();
        return new MetricCollector<T>(
            meterFactory,
            MetricsConstants.MeterName,
            instrumentName);
    }
}
