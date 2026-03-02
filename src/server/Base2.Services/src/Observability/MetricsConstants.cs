namespace Base2.Observability;

/// <summary>
/// Constants for metrics instrumentation following OpenTelemetry naming conventions.
/// </summary>
public static class MetricsConstants
{
    // Meter
    public const string MeterName = "Base2.ProductName";
    public const string MeterVersion = "1.0.0";

    // Infrastructure Metrics - Background Jobs
    public const string BackgroundJobDuration = "product_name.background.job_duration";
    public const string BackgroundJobsCompleted = "product_name.background.jobs_completed";
    public const string BackgroundJobsFailed = "product_name.background.jobs_failed";
    public const string BackgroundQueueDepth = "product_name.background.queue_depth";

    // API Metrics
    public const string ApiRequestDuration = "product_name.api.request_duration";
    public const string ApiRequestsTotal = "product_name.api.requests_total";
    public const string ApiErrors = "product_name.api.errors";
    public const string ApiConcurrentRequests = "product_name.api.concurrent_requests";

    // Database Metrics
    public const string DbQueryDuration = "product_name.db.query_duration";
    public const string DbQueriesExecuted = "product_name.db.queries_executed";
    public const string DbConnectionPoolSize = "product_name.db.connection_pool_size";

    /// <summary>
    /// Tag names following OpenTelemetry semantic conventions.
    /// </summary>
    public static class Tags
    {
        public const string TenantId = "tenant.id";
        public const string ErrorType = "error.type";
        public const string JobType = "job.type";
        public const string HttpMethod = "http.method";
        public const string HttpRoute = "http.route";
        public const string HttpStatusCode = "http.status_code";
        public const string DbOperation = "db.operation";
        public const string DbEntity = "db.entity";
    }

    /// <summary>
    /// Units following UCUM standard.
    /// </summary>
    public static class Units
    {
        public const string Seconds = "s";
        public const string Milliseconds = "ms";
        public const string Jobs = "{jobs}";
        public const string Requests = "{requests}";
        public const string Connections = "{connections}";
        public const string Queries = "{queries}";
        public const string Failures = "{failures}";
        public const string Refreshes = "{refreshes}";
        public const string Errors = "{errors}";
    }

    /// <summary>
    /// Metric descriptions.
    /// </summary>
    public static class Descriptions
    {
        public const string BackgroundJobDuration = "Duration of background job execution";
        public const string BackgroundJobsCompleted = "Total number of background jobs completed";
        public const string BackgroundJobsFailed = "Total number of background jobs failed";
        public const string ApiRequestDuration = "Duration of API request processing";
        public const string ApiRequestsTotal = "Total number of API requests";
        public const string ApiErrors = "Total number of API errors";
        public const string DbQueryDuration = "Duration of database query execution";
        public const string DbQueriesExecuted = "Total number of database queries executed";
    }
}
