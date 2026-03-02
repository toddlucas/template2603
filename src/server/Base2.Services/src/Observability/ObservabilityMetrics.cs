using System.Diagnostics.Metrics;

namespace Base2.Observability;

/// <summary>
/// Implementation of application metrics using System.Diagnostics.Metrics.
/// Thread-safe and optimized for high-performance scenarios.
/// </summary>
public sealed class ObservabilityMetrics : IObservabilityMetrics
{
    private readonly Meter _meter;

    // Background Job Metrics
    private readonly Counter<long> _backgroundJobsCompleted;
    private readonly Counter<long> _backgroundJobsFailed;
    private readonly Histogram<double> _backgroundJobDuration;

    // API Metrics
    private readonly Histogram<double> _apiRequestDuration;
    private readonly Counter<long> _apiRequestsTotal;
    private readonly Counter<long> _apiErrors;

    // Database Metrics
    private readonly Histogram<double> _dbQueryDuration;
    private readonly Counter<long> _dbQueriesExecuted;

    public ObservabilityMetrics(IMeterFactory meterFactory)
    {
        _meter = meterFactory.Create(
            MetricsConstants.MeterName,
            MetricsConstants.MeterVersion);

        // Initialize background job metrics
        _backgroundJobsCompleted = _meter.CreateCounter<long>(
            MetricsConstants.BackgroundJobsCompleted,
            unit: MetricsConstants.Units.Jobs,
            description: MetricsConstants.Descriptions.BackgroundJobsCompleted);

        _backgroundJobsFailed = _meter.CreateCounter<long>(
            MetricsConstants.BackgroundJobsFailed,
            unit: MetricsConstants.Units.Jobs,
            description: MetricsConstants.Descriptions.BackgroundJobsFailed);

        _backgroundJobDuration = _meter.CreateHistogram<double>(
            MetricsConstants.BackgroundJobDuration,
            unit: MetricsConstants.Units.Seconds,
            description: MetricsConstants.Descriptions.BackgroundJobDuration,
            advice: new InstrumentAdvice<double>
            {
                // Bucket boundaries for jobs: 100ms, 500ms, 1s, 5s, 30s, 1m, 5m
                HistogramBucketBoundaries = [0.1, 0.5, 1, 5, 30, 60, 300]
            });

        // Initialize API metrics
        _apiRequestDuration = _meter.CreateHistogram<double>(
            MetricsConstants.ApiRequestDuration,
            unit: MetricsConstants.Units.Seconds,
            description: MetricsConstants.Descriptions.ApiRequestDuration,
            advice: new InstrumentAdvice<double>
            {
                // Bucket boundaries for API requests: 10ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s
                HistogramBucketBoundaries = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
            });

        _apiRequestsTotal = _meter.CreateCounter<long>(
            MetricsConstants.ApiRequestsTotal,
            unit: MetricsConstants.Units.Requests,
            description: MetricsConstants.Descriptions.ApiRequestsTotal);

        _apiErrors = _meter.CreateCounter<long>(
            MetricsConstants.ApiErrors,
            unit: MetricsConstants.Units.Errors,
            description: MetricsConstants.Descriptions.ApiErrors);

        // Initialize database metrics
        _dbQueryDuration = _meter.CreateHistogram<double>(
            MetricsConstants.DbQueryDuration,
            unit: MetricsConstants.Units.Seconds,
            description: MetricsConstants.Descriptions.DbQueryDuration,
            advice: new InstrumentAdvice<double>
            {
                // Bucket boundaries for DB queries: 1ms, 5ms, 10ms, 50ms, 100ms, 500ms, 1s, 5s
                HistogramBucketBoundaries = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
            });

        _dbQueriesExecuted = _meter.CreateCounter<long>(
            MetricsConstants.DbQueriesExecuted,
            unit: MetricsConstants.Units.Queries,
            description: MetricsConstants.Descriptions.DbQueriesExecuted);
    }

    public void RecordOperationFailed(string errorType, string operationType)
    {
        var tags = CreateTagList(
            (MetricsConstants.Tags.ErrorType, errorType),
            ("operation_type", operationType));

        _apiErrors.Add(1, tags);
    }

    // Background Job Metrics Implementation
    public void RecordBackgroundJobCompleted(string jobType, double durationSeconds)
    {
        var tags = CreateTagList(
            (MetricsConstants.Tags.JobType, jobType));

        _backgroundJobsCompleted.Add(1, tags);
        _backgroundJobDuration.Record(durationSeconds, tags);
    }

    public void RecordBackgroundJobFailed(string jobType, string errorType)
    {
        var tags = CreateTagList(
            (MetricsConstants.Tags.JobType, jobType),
            (MetricsConstants.Tags.ErrorType, errorType));

        _backgroundJobsFailed.Add(1, tags);
    }

    // API Metrics Implementation
    public void RecordApiRequest(string httpMethod, string route, int statusCode, double durationSeconds)
    {
        var tags = CreateTagList(
            (MetricsConstants.Tags.HttpMethod, httpMethod),
            (MetricsConstants.Tags.HttpRoute, route),
            (MetricsConstants.Tags.HttpStatusCode, statusCode.ToString()));

        _apiRequestsTotal.Add(1, tags);
        _apiRequestDuration.Record(durationSeconds, tags);
    }

    public void RecordApiError(string httpMethod, string route, string errorType)
    {
        var tags = CreateTagList(
            (MetricsConstants.Tags.HttpMethod, httpMethod),
            (MetricsConstants.Tags.HttpRoute, route),
            (MetricsConstants.Tags.ErrorType, errorType));

        _apiErrors.Add(1, tags);
    }

    // Database Metrics Implementation
    public void RecordDatabaseQuery(string operation, string entity, double durationSeconds)
    {
        var tags = CreateTagList(
            (MetricsConstants.Tags.DbOperation, operation),
            (MetricsConstants.Tags.DbEntity, entity));

        _dbQueriesExecuted.Add(1, tags);
        _dbQueryDuration.Record(durationSeconds, tags);
    }

    // Helper method to create TagList efficiently
    private static TagList CreateTagList(params (string Key, string? Value)[] tags)
    {
        var tagList = new TagList();
        foreach (var (key, value) in tags)
        {
            if (!string.IsNullOrEmpty(value))
            {
                tagList.Add(key, value);
            }
        }
        return tagList;
    }
}
