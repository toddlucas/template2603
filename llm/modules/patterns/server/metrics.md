# Server Metrics Instrumentation

> **Module**: Patterns / Server  
> **Domain**: Observability  
> **Token target**: 500-700

## Purpose

Defines patterns for adding metrics to services using .NET's `System.Diagnostics.Metrics` API for observability.

## Content to Include

### 1. Injecting IObservabilityMetrics

```csharp
// File: Services/src/{Namespace}/{Entity}Service.cs
using Base2.Services.Observability;

public class {Entity}Service(
    WarehouseDbContext dbContext,
    IObservabilityMetrics metrics,
    ILogger<{Entity}Service> logger)
{
    private readonly WarehouseDbContext _dbContext = dbContext;
    private readonly IObservabilityMetrics _metrics = metrics;
    private readonly ILogger _logger = logger;
}
```

**Key points:**
- Inject `IObservabilityMetrics` in service constructors
- Available for all services via DI
- No additional registration needed

### 2. Recording Metrics

> **Note:** Record metrics after successful operations and in catch blocks for failures.

```csharp
public async Task<Model> CreateAsync(Guid userId, Guid tenantId, Guid groupId, Model model)
{
    Record record = model.ToRecord();
    record.TenantId = tenantId;
    record.CreatedAt = record.UpdatedAt = DateTime.UtcNow;

    _dbSet.Add(record);
    await _dbContext.SaveChangesAsync();

    // Record metric after successful operation
    _metrics.RecordContactCreated();
    
    _logger.LogInformation("Created {Entity} {Id}.", record.Id);
    return record.ToModel();
}
```

### 3. Timing Operations

```csharp
using System.Diagnostics;

public async Task<Result> ProcessAsync(long id, CancellationToken ct)
{
    var startTime = Stopwatch.GetTimestamp();
    
    try
    {
        _metrics.RecordSequenceStarted();
        
        // ... processing logic ...
        
        _metrics.RecordSequenceCompleted();
        
        // Record duration in seconds
        var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
        _metrics.RecordSequenceExecutionDuration(duration, sequenceId: id.ToString());
        
        return result;
    }
    catch (Exception ex)
    {
        _metrics.RecordSequenceFailed(
            errorType: ex.GetType().Name,
            sequenceId: id.ToString());
        throw;
    }
}
```

**Key points:**
- Use `Stopwatch.GetTimestamp()` for timing
- Calculate duration with `Stopwatch.GetElapsedTime(startTime).TotalSeconds`
- Record duration in **seconds** as floating-point
- Always record failures in catch blocks

### 4. Recording with Context Tags

```csharp
public async Task<SendResult> SendEmailAsync(EmailMessage message, CancellationToken ct)
{
    try
    {
        var result = await _emailProvider.SendAsync(message, ct);
        
        if (result.Success)
        {
            // Record with context tags (provider, sequence, etc.)
            _metrics.RecordEmailSent(
                sequenceId: message.SequenceId?.ToString(),
                emailProvider: "office365");
        }
        else
        {
            _metrics.RecordEmailFailed(
                errorType: result.ErrorType ?? "unknown",
                sequenceId: message.SequenceId?.ToString(),
                emailProvider: "office365");
        }
        
        return result;
    }
    catch (Exception ex)
    {
        _metrics.RecordEmailAccountConnectionFailure(
            emailProvider: "office365",
            errorType: ex.GetType().Name);
        throw;
    }
}
```

**Key points:**
- Tags provide context for filtering and grouping metrics
- Use low-cardinality tags (< 1,000 unique combinations)
- ❌ **Never** use user IDs, contact IDs, or other high-cardinality data as tags
- ✅ **Do** use provider names, operation types, error types

### 5. Adding New Metrics

When adding a new metric to track operations:

#### Step 1: Add Constants

```csharp
// File: Services/src/Observability/MetricsConstants.cs
public static class MetricsConstants
{
    public const string ContactsImported = "product_name.contacts.imported";
    
    public static class Descriptions
    {
        public const string ContactsImported = "Total number of contacts imported from external sources";
    }
}
```

#### Step 2: Add Interface Method

```csharp
// File: Services/src/Observability/IObservabilityMetrics.cs
public interface IObservabilityMetrics
{
    /// <summary>
    /// Records a contact import operation.
    /// </summary>
    /// <param name="count">Number of contacts imported</param>
    /// <param name="source">Import source (e.g., "csv", "api", "manual")</param>
    void RecordContactsImported(int count, string source);
}
```

#### Step 3: Create Instrument & Implement

```csharp
// File: Services/src/Observability/ObservabilityMetrics.cs
public sealed class ObservabilityMetrics : IObservabilityMetrics
{
    private readonly Counter<long> _contactsImported;

    public ObservabilityMetrics(IMeterFactory meterFactory)
    {
        _meter = meterFactory.Create(
            MetricsConstants.MeterName,
            MetricsConstants.MeterVersion);

        // Create instrument in constructor
        _contactsImported = _meter.CreateCounter<long>(
            MetricsConstants.ContactsImported,
            unit: MetricsConstants.Units.Contacts,
            description: MetricsConstants.Descriptions.ContactsImported);
    }

    // Implement method
    public void RecordContactsImported(int count, string source)
    {
        var tags = CreateTagList(("import.source", source));
        _contactsImported.Add(count, tags);
    }
}
```

#### Step 4: Use in Service

```csharp
public async Task<ImportResult> ImportContactsAsync(Stream csvStream, CancellationToken ct)
{
    var contacts = await ParseCsvAsync(csvStream, ct);
    await _contactQuery.BulkCreateAsync(contacts, ct);
    
    // Record the metric
    _metrics.RecordContactsImported(contacts.Count, source: "csv");
    
    return new ImportResult { ImportedCount = contacts.Count };
}
```

### 6. Instrument Types Quick Reference

| Type | Use For | Example |
|------|---------|---------|
| **Counter<T>** | Events that only increase | Emails sent, API calls, errors |
| **Histogram<T>** | Distributions of values | Latency, duration, sizes |
| **Gauge<T>** | Current value that changes | Cache size, active connections |
| **ObservableGauge<T>** | Value from callback | Queue depth, connection pool size |

**Counter Example:**
```csharp
_emailsSent = _meter.CreateCounter<long>(
    "product_name.sequences.emails_sent",
    unit: "{emails}",
    description: "Total number of emails sent");

// Usage
_emailsSent.Add(1, tags);
```

**Histogram Example:**
```csharp
_apiDuration = _meter.CreateHistogram<double>(
    "product_name.api.request_duration",
    unit: "s",
    description: "Duration of API requests",
    advice: new InstrumentAdvice<double>
    {
        // Buckets: 10ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s
        HistogramBucketBoundaries = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
    });

// Usage
_apiDuration.Record(durationSeconds, tags);
```

**ObservableGauge Example:**
```csharp
_meter.CreateObservableGauge<int>(
    "product_name.background.queue_depth",
    observeValue: () => _backgroundJobQueue.Count,
    unit: "{jobs}",
    description: "Number of pending background jobs");

// No manual recording needed - callback is invoked automatically
```

### 7. Testing Metrics

> **Note:** Create metric tests in `Base2.Services/test/Observability/ObservabilityMetricsTests.cs`.

```csharp
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

public class ObservabilityMetricsTests
{
    [Fact]
    public void RecordContactsImported_IncrementsCounter()
    {
        // Arrange
        var services = MetricsTestHelpers.CreateServiceProvider();
        var metrics = services.GetRequiredService<IObservabilityMetrics>();
        var collector = MetricsTestHelpers.CreateCollector<long>(
            services,
            MetricsConstants.ContactsImported);

        // Act
        metrics.RecordContactsImported(count: 50, source: "csv");

        // Assert
        var measurements = collector.GetMeasurementSnapshot();
        measurements.Should().HaveCount(1);
        measurements[0].Value.Should().Be(50);
        measurements[0].Tags.Should().Contain(
            new KeyValuePair<string, object?>("import.source", "csv"));
    }
    
    [Fact]
    public void RecordDuration_RecordsHistogram()
    {
        // Arrange
        var services = MetricsTestHelpers.CreateServiceProvider();
        var metrics = services.GetRequiredService<IObservabilityMetrics>();
        var collector = MetricsTestHelpers.CreateCollector<double>(
            services,
            MetricsConstants.SequencesExecutionDuration);

        // Act
        metrics.RecordSequenceExecutionDuration(45.5, sequenceId: "789");

        // Assert
        var measurements = collector.GetMeasurementSnapshot();
        measurements.Should().HaveCount(1);
        measurements[0].Value.Should().Be(45.5);
    }
}
```

**Test Pattern:**
1. Create service provider with `MetricsTestHelpers.CreateServiceProvider()`
2. Get `IObservabilityMetrics` from DI
3. Create `MetricCollector<T>` for the specific metric
4. Record metric via interface method
5. Assert measurements captured correctly

### 8. Viewing Metrics Locally

```bash
# Install dotnet-counters (one-time)
dotnet tool install -g dotnet-counters

# View all metrics
dotnet-counters monitor -n Base2.Web --counters Base2.ProductName

# Output:
# [Base2.ProductName]
#     product_name.sequences.emails_sent ({emails})                    42
#     product_name.sequences.emails_failed ({emails})                   3
#     product_name.api.request_duration (s)
#         Percentile
#         50                                                    0.125
#         95                                                    0.450
```

### Common Patterns Summary

| Pattern | When to Use |
|---------|-------------|
| **Success/Failure** | After operations that can succeed or fail |
| **Timing** | For operations where duration matters |
| **Counting** | For discrete events (emails sent, entities created) |
| **Batch** | Record total count for bulk operations |
| **Conditional** | Different metrics based on result type |

**Best Practices:**
- ✅ Record metrics **after** successful operations
- ✅ Record failure metrics in **catch blocks**
- ✅ Use **seconds** for duration (floating-point)
- ✅ Add **unit tests** for all custom metrics
- ✅ Use **low-cardinality tags** (provider, type, status)
- ❌ Never use high-cardinality data (IDs) as tags
- ❌ Don't record metrics before operations complete

## Backlink

- [Metrics Instrumentation Pattern](../../../patterns/server/metrics-instrumentation-pattern.md) - Comprehensive reference
- [Testing Patterns](./testing.md) - Testing approach for services with metrics
- [Server Feature Template](../../../patterns/server/server-feature-template.md) - Adding metrics to features
