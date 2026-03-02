using Base2.Observability;

namespace Base2.Services.Test.Observability;

public class ObservabilityMetricsTests
{
    [Fact]
    public void RecordApiRequest_RecordsBothCounterAndHistogram()
    {
        // Arrange
        var services = MetricsTestHelpers.CreateServiceProvider();
        var metrics = services.GetRequiredService<IObservabilityMetrics>();
        var counterCollector = MetricsTestHelpers.CreateCollector<long>(
            services,
            MetricsConstants.ApiRequestsTotal);
        var histogramCollector = MetricsTestHelpers.CreateCollector<double>(
            services,
            MetricsConstants.ApiRequestDuration);

        // Act
        metrics.RecordApiRequest("GET", "/api/sequences", 200, 0.125);

        // Assert
        var counterMeasurements = counterCollector.GetMeasurementSnapshot();
        Assert.Single(counterMeasurements);
        Assert.Equal(1, counterMeasurements[0].Value);
        Assert.Contains(counterMeasurements[0].Tags, t => t.Key == "http.method" && t.Value?.ToString() == "GET");
        Assert.Contains(counterMeasurements[0].Tags, t => t.Key == "http.route" && t.Value?.ToString() == "/api/sequences");
        Assert.Contains(counterMeasurements[0].Tags, t => t.Key == "http.status_code" && t.Value?.ToString() == "200");

        var histogramMeasurements = histogramCollector.GetMeasurementSnapshot();
        Assert.Single(histogramMeasurements);
        Assert.Equal(0.125, histogramMeasurements[0].Value);
    }
}
