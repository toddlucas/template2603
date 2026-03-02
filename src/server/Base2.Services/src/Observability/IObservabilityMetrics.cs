namespace Base2.Observability;

/// <summary>
/// Interface for application metrics instrumentation.
/// </summary>
public interface IObservabilityMetrics
{
    // Background Job Metrics

    /// <summary>
    /// Records a completed background job.
    /// </summary>
    /// <param name="jobType">Type of job</param>
    /// <param name="durationSeconds">Duration in seconds</param>
    void RecordBackgroundJobCompleted(string jobType, double durationSeconds);

    /// <summary>
    /// Records a failed background job.
    /// </summary>
    /// <param name="jobType">Type of job</param>
    /// <param name="errorType">Type of error that occurred</param>
    void RecordBackgroundJobFailed(string jobType, string errorType);

    // API Metrics

    /// <summary>
    /// Records an API request.
    /// </summary>
    /// <param name="httpMethod">HTTP method (e.g., "GET", "POST")</param>
    /// <param name="route">Route pattern</param>
    /// <param name="statusCode">HTTP status code</param>
    /// <param name="durationSeconds">Duration in seconds</param>
    void RecordApiRequest(string httpMethod, string route, int statusCode, double durationSeconds);

    /// <summary>
    /// Records an API error.
    /// </summary>
    /// <param name="httpMethod">HTTP method</param>
    /// <param name="route">Route pattern</param>
    /// <param name="errorType">Type of error that occurred</param>
    void RecordApiError(string httpMethod, string route, string errorType);

    // Database Metrics

    /// <summary>
    /// Records a database query execution.
    /// </summary>
    /// <param name="operation">Operation type (e.g., "SELECT", "INSERT", "UPDATE", "DELETE")</param>
    /// <param name="entity">Entity name</param>
    /// <param name="durationSeconds">Duration in seconds</param>
    void RecordDatabaseQuery(string operation, string entity, double durationSeconds);
}
