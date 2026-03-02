# Metrics Instrumentation Pattern

## Overview

This document provides practical patterns and best practices for adding metrics to the Product Name application using .NET's `System.Diagnostics.Metrics` API. Metrics provide observability into application performance, business operations, and system health.

**Time estimate**: 15-30 minutes to add metrics to a feature

### What are Metrics?

Metrics are numerical measurements recorded over time that help you understand:
- **Performance**: How fast is my application? (request duration, query time)
- **Business operations**: What's happening? (emails sent, sequences completed)
- **System health**: Is everything working? (error rates, connection pool size)

### Metrics vs. Logs vs. Traces

| Use Case | Tool | Example |
|----------|------|---------|
| "How many emails were sent?" | **Metrics** | Counter: `product_name.sequences.emails_sent` |
| "Why did this email fail?" | **Logs** | Error log with exception details |
| "What happened during this request?" | **Traces** | Distributed trace showing all operations |
| "How long do API requests take?" | **Metrics** | Histogram: `product_name.api.request_duration` |
| "What was the request payload?" | **Logs** | Debug log with request body |

**Rule of thumb**: Use metrics for **aggregatable numbers**, logs for **specific events with context**, traces for **request flows**.

---

## Quick Start

### 1. Inject IObservabilityMetrics

```csharp
using Base2.Services.Observability;

public class SequenceExecutionService(
    IObservabilityMetrics metrics,
    // ... other dependencies
)
{
    private readonly IObservabilityMetrics _metrics = metrics;
}
```

### 2. Record Metrics

```csharp
public async Task ExecuteSequenceAsync(long sequenceId, CancellationToken ct)
{
    try
    {
        // ... execution logic ...
        
        // Record successful email send
        _metrics.RecordEmailSent(
            sequenceId: sequenceId.ToString(),
            emailProvider: "smtp");
    }
    catch (Exception ex)
    {
        // Record failure
        _metrics.RecordEmailFailed(
            errorType: ex.GetType().Name,
            sequenceId: sequenceId.ToString());
        throw;
    }
}
```

### 3. View Metrics Locally

```bash
# Install dotnet-counters (one-time)
dotnet tool install -g dotnet-counters

# View all metrics (by provider name)
dotnet-counters monitor -n Base2.Web --counters Base2.ProductName

# Output:
# [Base2.ProductName]
#     product_name.sequences.emails_sent ({emails})                    42
#     product_name.sequences.emails_failed ({emails})                   3
```

---

## Instrument Types Guide

### Decision Tree

```
What do you want to track?

├─ A count that only increases?
│  ├─ You call Add() each time? ────────────────► Counter<T>
│  └─ You maintain the total yourself? ─────────► ObservableCounter<T>
│
├─ A value that goes up and down?
│  ├─ You call Add() for changes? ──────────────► UpDownCounter<T>
│  └─ You maintain the value yourself? ─────────► ObservableGauge<T>
│
├─ A distribution of values?
│  └─ (e.g., latency, duration, size) ──────────► Histogram<T>
│
└─ A current value you set directly? ───────────► Gauge<T>
```

### Counter<T> - Counting Events

**Use when**: Tracking events that only increase (emails sent, API calls, errors)

**Example**:
```csharp
// In ObservabilityMetrics.cs
private readonly Counter<long> _emailsSent;

_emailsSent = _meter.CreateCounter<long>(
    name: "product_name.sequences.emails_sent",
    unit: "{emails}",
    description: "Total number of emails sent through sequences");

// In your service
_metrics.RecordEmailSent(sequenceId: "123", emailProvider: "smtp");

// Implementation
public void RecordEmailSent(string? sequenceId = null, string? emailProvider = null)
{
    var tags = CreateTagList(
        (MetricsConstants.Tags.SequenceId, sequenceId),
        (MetricsConstants.Tags.EmailProvider, emailProvider));
    
    _emailsSent.Add(1, tags);
}
```

**Collection tools show**: Total count and rate of change (emails/sec)

### UpDownCounter<T> - Values That Change

**Use when**: Tracking values that increase and decrease (queue depth, active connections)

**Example**:
```csharp
// In ObservabilityMetrics.cs
private readonly UpDownCounter<int> _activeConnections;

_activeConnections = _meter.CreateUpDownCounter<int>(
    name: "product_name.email_accounts.active_connections",
    unit: "{connections}",
    description: "Number of active email provider connections");

// In your service
public void ConnectionOpened()
{
    _activeConnections.Add(1);
}

public void ConnectionClosed()
{
    _activeConnections.Add(-1);
}
```

**Collection tools show**: Current total value

### Histogram<T> - Measuring Distributions

**Use when**: Tracking distributions of values (latency, duration, size)

**Example**:
```csharp
// In ObservabilityMetrics.cs
private readonly Histogram<double> _apiRequestDuration;

_apiRequestDuration = _meter.CreateHistogram<double>(
    name: "product_name.api.request_duration",
    unit: "s",
    description: "Duration of API request processing",
    advice: new InstrumentAdvice<double>
    {
        // Bucket boundaries: 10ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s
        HistogramBucketBoundaries = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
    });

// In your service
var startTime = Stopwatch.GetTimestamp();
// ... do work ...
var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
_apiRequestDuration.Record(duration, tags);
```

**Collection tools show**: Percentiles (p50, p95, p99) or histogram buckets

### ObservableGauge<T> - Current Value via Callback

**Use when**: Tracking a value you maintain elsewhere (connection pool size, cache size)

**Example**:
```csharp
// In ObservabilityMetrics constructor
_meter.CreateObservableGauge<int>(
    name: "product_name.background.queue_depth",
    observeValue: () => _backgroundJobQueue.Count,
    unit: "{jobs}",
    description: "Number of pending background jobs");

// Or with multiple measurements
_meter.CreateObservableGauge<int>(
    name: "product_name.email_accounts.connected",
    observeValues: GetConnectedAccountsByProvider,
    unit: "{connections}",
    description: "Number of connected email accounts by provider");

private IEnumerable<Measurement<int>> GetConnectedAccountsByProvider()
{
    return new[]
    {
        new Measurement<int>(6, new KeyValuePair<string, object?>("email.provider", "smtp")),
        new Measurement<int>(3, new KeyValuePair<string, object?>("email.provider", "office365")),
    };
}
```

**Collection tools show**: Current value at time of observation

### ObservableCounter<T> - Cumulative Total via Callback

**Use when**: Tracking a cumulative total you maintain elsewhere

**Example**:
```csharp
// In ObservabilityMetrics constructor
_meter.CreateObservableCounter<long>(
    name: "product_name.cache.total_bytes",
    observeValue: () => _cache.TotalBytesUsed,
    unit: "By",
    description: "Total bytes stored in cache");
```

**Collection tools show**: Total and rate of change

### Gauge<T> - Set Current Value Directly

**Use when**: Tracking a value that changes and you want to set it explicitly

**Example**:
```csharp
// In ObservabilityMetrics.cs
private readonly Gauge<int> _cacheSize;

_cacheSize = _meter.CreateGauge<int>(
    name: "product_name.cache.size",
    unit: "{items}",
    description: "Number of items in cache");

// In your service
public void OnCacheChanged(int newSize)
{
    _cacheSize.Record(newSize);
}
```

**Collection tools show**: Most recently set value

---

## Recording Metrics in Services

### Basic Pattern

```csharp
using System.Diagnostics;
using Base2.Services.Observability;

public class ContactService(
    IObservabilityMetrics metrics,
    ContactQuery contactQuery)
{
    private readonly IObservabilityMetrics _metrics = metrics;
    private readonly ContactQuery _contactQuery = contactQuery;

    public async Task<ContactModel> CreateContactAsync(
        Guid userId,
        Guid tenantId,
        Guid groupId,
        CreateContactModel model,
        CancellationToken ct)
    {
        var contact = await _contactQuery.CreateAsync(userId, tenantId, groupId, model, ct);
        
        // Record metric after successful operation
        _metrics.RecordContactCreated();
        
        return contact;
    }
}
```

### Timing Operations

```csharp
public async Task<SequenceModel> ExecuteSequenceAsync(long sequenceId, CancellationToken ct)
{
    var startTime = Stopwatch.GetTimestamp();
    
    try
    {
        _metrics.RecordSequenceStarted();
        
        // ... execution logic ...
        
        _metrics.RecordSequenceCompleted();
        
        // Record duration
        var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
        _metrics.RecordSequenceExecutionDuration(duration, sequenceId.ToString());
        
        return result;
    }
    catch (Exception ex)
    {
        _metrics.RecordSequenceFailed(
            errorType: ex.GetType().Name,
            sequenceId: sequenceId.ToString());
        throw;
    }
}
```

### Recording with Context

```csharp
public async Task<SendResult> SendEmailAsync(EmailMessage message, CancellationToken ct)
{
    var startTime = Stopwatch.GetTimestamp();
    
    try
    {
        var result = await _emailProvider.SendAsync(message, ct);
        
        var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
        
        // Record with multiple tags for context
        _metrics.RecordEmailAccountApiLatency(
            durationSeconds: duration,
            emailProvider: "office365",
            operation: "send_email");
        
        if (result.Success)
        {
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

### Background Job Metrics

```csharp
public class EmailSendTaskHandler(IObservabilityMetrics metrics)
{
    private readonly IObservabilityMetrics _metrics = metrics;

    public async Task ExecuteAsync(CancellationToken ct)
    {
        var startTime = Stopwatch.GetTimestamp();
        
        try
        {
            // ... task execution ...
            
            var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
            _metrics.RecordBackgroundJobCompleted("email_send", duration);
        }
        catch (Exception ex)
        {
            _metrics.RecordBackgroundJobFailed("email_send", ex.GetType().Name);
            throw;
        }
    }
}
```

---

## Adding New Metrics

### Step-by-Step Guide

Let's add a new metric to track contact imports.

#### Step 1: Add Constants

**File**: `Base2.Services/src/Observability/MetricsConstants.cs`

```csharp
public static class MetricsConstants
{
    // ... existing constants ...
    
    // Add your new metric name
    public const string ContactsImported = "product_name.contacts.imported";
    
    public static class Units
    {
        // ... existing units ...
        // Add unit if needed (or reuse existing)
    }
    
    public static class Descriptions
    {
        // ... existing descriptions ...
        public const string ContactsImported = "Total number of contacts imported from external sources";
    }
}
```

#### Step 2: Add Method to Interface

**File**: `Base2.Services/src/Observability/IObservabilityMetrics.cs`

```csharp
public interface IObservabilityMetrics
{
    // ... existing methods ...
    
    /// <summary>
    /// Records a contact import operation.
    /// </summary>
    /// <param name="count">Number of contacts imported</param>
    /// <param name="source">Import source (e.g., "csv", "api", "manual")</param>
    void RecordContactsImported(int count, string source);
}
```

#### Step 3: Create Instrument in Constructor

**File**: `Base2.Services/src/Observability/ObservabilityMetrics.cs`

```csharp
public sealed class ObservabilityMetrics : IObservabilityMetrics
{
    // ... existing fields ...
    private readonly Counter<long> _contactsImported;

    public ObservabilityMetrics(IMeterFactory meterFactory)
    {
        _meter = meterFactory.Create(
            MetricsConstants.MeterName,
            MetricsConstants.MeterVersion);

        // ... existing instrument creation ...

        // Create your new instrument
        _contactsImported = _meter.CreateCounter<long>(
            MetricsConstants.ContactsImported,
            unit: MetricsConstants.Units.Contacts,
            description: MetricsConstants.Descriptions.ContactsImported);
    }
    
    // ... rest of class ...
}
```

#### Step 4: Implement Method

**File**: `Base2.Services/src/Observability/ObservabilityMetrics.cs`

```csharp
public void RecordContactsImported(int count, string source)
{
    var tags = CreateTagList(
        ("import.source", source));
    
    _contactsImported.Add(count, tags);
}
```

#### Step 5: Add Unit Test

**File**: `Base2.Services/test/Observability/ObservabilityMetricsTests.cs`

```csharp
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
```

#### Step 6: Use in Code

**File**: `Base2.Services/src/Contacts/ContactImportService.cs`

```csharp
public async Task<ImportResult> ImportContactsAsync(
    Stream csvStream,
    CancellationToken ct)
{
    var contacts = await ParseCsvAsync(csvStream, ct);
    await _contactQuery.BulkCreateAsync(contacts, ct);
    
    // Record the metric
    _metrics.RecordContactsImported(contacts.Count, source: "csv");
    
    return new ImportResult { ImportedCount = contacts.Count };
}
```

#### Step 7: Document the Metric

Add to the metrics catalog in this document (see [Metrics Catalog](#metrics-catalog) section).

---

## Tags (Multi-dimensional Metrics)

### What are Tags?

Tags (also called "attributes" in OpenTelemetry) allow you to categorize metrics by different dimensions.

**Example**: Instead of just knowing "100 emails were sent", tags let you know:
- 60 emails via SMTP
- 40 emails via Office365
- 75 emails from sequence #123
- 25 emails from sequence #456

### When to Use Tags

**✅ Good use cases**:
- Email provider (smtp, office365, gmail) - **3-10 values**
- HTTP method (GET, POST, PUT, DELETE) - **7 values**
- HTTP status code (200, 201, 400, 404, 500) - **~20 values**
- Error type (TimeoutException, SmtpException) - **~50 values**
- Sequence type (drip, nurture, onboarding) - **~10 values**

**❌ Bad use cases** (high cardinality):
- User ID - **millions of values** ⚠️
- Contact ID - **millions of values** ⚠️
- Email message ID - **millions of values** ⚠️
- Timestamp - **infinite values** ⚠️

### Tag Naming Conventions

Follow OpenTelemetry semantic conventions:
- **Lowercase** with **dots** separating hierarchical elements
- **Underscores** separating words within an element
- **Consistent** across all metrics

```csharp
// ✅ Good
"email.provider"
"http.method"
"http.status_code"
"sequence.type"
"error.type"
"db.operation"

// ❌ Bad
"EmailProvider"     // Not lowercase
"http_method"       // Use dots for hierarchy
"httpStatusCode"    // Not snake_case
"sequenceType"      // Not consistent with others
```

### Recording with Tags

```csharp
// Single tag
_metrics.RecordEmailSent(emailProvider: "smtp");

// Multiple tags
_metrics.RecordEmailSent(
    sequenceId: "123",
    emailProvider: "smtp");

// Implementation with TagList
public void RecordEmailSent(string? sequenceId = null, string? emailProvider = null)
{
    var tags = CreateTagList(
        (MetricsConstants.Tags.SequenceId, sequenceId),
        (MetricsConstants.Tags.EmailProvider, emailProvider));
    
    _emailsSent.Add(1, tags);
}

// Helper method (in ObservabilityMetrics.cs)
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
```

### Cardinality Management

**Cardinality** = Number of unique tag combinations

#### Safe Cardinality (< 1,000 combinations)

```csharp
// Example: Email sends
// Tags: email.provider (3 values) × sequence.type (5 values) = 15 combinations ✅
_metrics.RecordEmailSent(
    emailProvider: "smtp",      // smtp, office365, gmail
    sequenceType: "drip");      // drip, nurture, onboarding, promotional, transactional
```

#### Dangerous Cardinality (> 10,000 combinations)

```csharp
// ❌ BAD: High cardinality
// Tags: tenant.id (10,000) × user.id (100,000) × sequence.id (1,000)
// = 1 trillion combinations! 💥
_metrics.RecordEmailSent(
    tenantId: tenant.Id.ToString(),
    userId: user.Id.ToString(),
    sequenceId: sequence.Id.ToString());
```

#### Solutions for High Cardinality

1. **Remove the tag** - Do you really need it?
2. **Use logs instead** - Logs are better for high-cardinality data
3. **Aggregate** - Group into categories (e.g., "small_tenant", "medium_tenant", "large_tenant")
4. **Sample** - Only record metrics for a subset of values

```csharp
// ✅ Good: Aggregate high-cardinality data
var tenantSize = GetTenantSize(tenant.ContactCount);  // "small", "medium", "large"
_metrics.RecordEmailSent(tenantSize: tenantSize);

private string GetTenantSize(int contactCount)
{
    return contactCount switch
    {
        < 100 => "small",
        < 1000 => "medium",
        _ => "large"
    };
}
```

### Tag Performance

Tags have a small performance cost:
- **0-3 tags**: Optimized, allocation-free
- **4+ tags**: Use `TagList` to avoid allocations
- **Consistent ordering**: Collection tools optimize for same tag order

```csharp
// ✅ Optimized: 3 or fewer tags, no allocations
_emailsSent.Add(1,
    new KeyValuePair<string, object?>("email.provider", "smtp"),
    new KeyValuePair<string, object?>("sequence.type", "drip"));

// ✅ Optimized: 4+ tags, use TagList
var tags = new TagList
{
    { "email.provider", "smtp" },
    { "sequence.type", "drip" },
    { "tenant.size", "medium" },
    { "region", "us-east" }
};
_emailsSent.Add(1, tags);
```

---

## Histogram Bucket Boundaries

### Why Bucket Boundaries Matter

Histograms divide the range of possible values into "buckets" to show the distribution. Choosing the right boundaries is critical for useful metrics.

**Default OpenTelemetry boundaries**:
```
[0, 5, 10, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10000]
```

These are good for **general-purpose** metrics but not optimized for specific use cases.

### How to Choose Boundaries

1. **Understand your data** - What's the typical range? What are outliers?
2. **Focus on the interesting range** - More buckets where you care about precision
3. **Cover outliers** - Include boundaries for slow/large values
4. **Limit bucket count** - 8-15 buckets is usually sufficient

### Pre-defined Boundaries

#### API Requests (product_name.api.request_duration)

```csharp
advice: new InstrumentAdvice<double>
{
    // 10ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s
    HistogramBucketBoundaries = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
}
```

**Rationale**: Most API requests should complete in < 500ms (p95), with outliers up to 5s.

#### Database Queries (product_name.db.query_duration)

```csharp
advice: new InstrumentAdvice<double>
{
    // 1ms, 5ms, 10ms, 50ms, 100ms, 500ms, 1s, 5s
    HistogramBucketBoundaries = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
}
```

**Rationale**: Most queries should be < 100ms (p95), but some complex queries may take longer.

#### Email Provider API (product_name.email_accounts.api_latency)

```csharp
advice: new InstrumentAdvice<double>
{
    // 10ms, 50ms, 100ms, 500ms, 1s, 5s, 10s
    HistogramBucketBoundaries = [0.01, 0.05, 0.1, 0.5, 1, 5, 10]
}
```

**Rationale**: External API calls can be slower, need to track up to 10s for timeouts.

#### Sequence Execution (product_name.sequences.execution_duration)

```csharp
advice: new InstrumentAdvice<double>
{
    // 1s, 5s, 30s, 1m, 5m, 15m, 1h
    HistogramBucketBoundaries = [1, 5, 30, 60, 300, 900, 3600]
}
```

**Rationale**: Sequences can run from seconds to hours depending on steps and delays.

#### Background Jobs (product_name.background.job_duration)

```csharp
advice: new InstrumentAdvice<double>
{
    // 100ms, 500ms, 1s, 5s, 30s, 1m, 5m
    HistogramBucketBoundaries = [0.1, 0.5, 1, 5, 30, 60, 300]
}
```

**Rationale**: Jobs vary from quick tasks (< 1s) to longer processing (minutes).

### Example: Adding Histogram with Boundaries

```csharp
private readonly Histogram<double> _importDuration;

_importDuration = _meter.CreateHistogram<double>(
    name: "product_name.contacts.import_duration",
    unit: "s",
    description: "Duration of contact import operations",
    advice: new InstrumentAdvice<double>
    {
        // Import operations: 1s, 5s, 15s, 30s, 1m, 2m, 5m
        HistogramBucketBoundaries = [1, 5, 15, 30, 60, 120, 300]
    });
```

---

## Testing Metrics

### Unit Testing with MetricCollector

The `MetricCollector<T>` class allows you to capture and verify metrics in tests.

#### Basic Test Pattern

```csharp
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Base2.Services.Observability;
using System.Diagnostics.Metrics;
using Xunit;

namespace Base2.Services.Test.Observability;

public class ObservabilityMetricsTests
{
    [Fact]
    public void RecordEmailSent_IncrementsCounter()
    {
        // Arrange
        var services = MetricsTestHelpers.CreateServiceProvider();
        var metrics = services.GetRequiredService<IObservabilityMetrics>();
        var collector = MetricsTestHelpers.CreateCollector<long>(
            services,
            MetricsConstants.SequencesEmailsSent);

        // Act
        metrics.RecordEmailSent(sequenceId: "123", emailProvider: "smtp");

        // Assert
        var measurements = collector.GetMeasurementSnapshot();
        measurements.Should().HaveCount(1);
        measurements[0].Value.Should().Be(1);
        measurements[0].Tags.Should().Contain(
            new KeyValuePair<string, object?>("sequence.id", "123"));
        measurements[0].Tags.Should().Contain(
            new KeyValuePair<string, object?>("email.provider", "smtp"));
    }
}
```

#### Testing Histograms

```csharp
[Fact]
public void RecordSequenceExecutionDuration_RecordsHistogram()
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
    measurements[0].Tags.Should().Contain(
        new KeyValuePair<string, object?>("sequence.id", "789"));
}
```

#### Testing Multiple Measurements

```csharp
[Fact]
public void MultipleMetricCalls_AccumulateCorrectly()
{
    // Arrange
    var services = MetricsTestHelpers.CreateServiceProvider();
    var metrics = services.GetRequiredService<IObservabilityMetrics>();
    var collector = MetricsTestHelpers.CreateCollector<long>(
        services,
        MetricsConstants.ContactsCreated);

    // Act
    metrics.RecordContactCreated();
    metrics.RecordContactCreated();
    metrics.RecordContactCreated();

    // Assert
    var measurements = collector.GetMeasurementSnapshot();
    measurements.Should().HaveCount(3);
    measurements.Sum(m => m.Value).Should().Be(3);
}
```

#### Test Helpers

**File**: `Base2.Services/test/Observability/MetricsTestHelpers.cs`

```csharp
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics.Metrics;

namespace Base2.Services.Test.Observability;

public static class MetricsTestHelpers
{
    public static IServiceProvider CreateServiceProvider()
    {
        var services = new ServiceCollection();
        services.AddMetrics();
        services.AddObservabilityMetrics();
        return services.BuildServiceProvider();
    }

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
```

### Integration Testing

Test that metrics are recorded during actual service operations.

```csharp
[Fact]
public async Task CreateContact_RecordsMetric()
{
    // Arrange
    var services = CreateServiceProvider();
    var meterFactory = services.GetRequiredService<IMeterFactory>();
    var collector = new MetricCollector<long>(
        meterFactory,
        MetricsConstants.MeterName,
        MetricsConstants.ContactsCreated);
    
    var contactService = services.GetRequiredService<IContactService>();
    var model = new CreateContactModel
    {
        Email = "test@example.com",
        FirstName = "Test"
    };
    
    // Act
    await contactService.CreateContactAsync(
        userId: Guid.NewGuid(),
        tenantId: Guid.NewGuid(),
        groupId: Guid.NewGuid(),
        model,
        CancellationToken.None);
    
    // Assert
    var measurements = collector.GetMeasurementSnapshot();
    measurements.Should().HaveCountGreaterThan(0);
}
```

### Testing Observable Gauges

Observable gauges are invoked by the collection tool, so you need to trigger collection:

```csharp
[Fact]
public void ObservableGauge_ReturnsCurrentValue()
{
    // Arrange
    var services = MetricsTestHelpers.CreateServiceProvider();
    var collector = MetricsTestHelpers.CreateCollector<int>(
        services,
        MetricsConstants.BackgroundQueueDepth);

    // Act - Collection happens automatically when you call GetMeasurementSnapshot
    var measurements = collector.GetMeasurementSnapshot();

    // Assert
    measurements.Should().HaveCount(1);
    measurements[0].Value.Should().BeGreaterOrEqualTo(0);
}
```

---

## Viewing Metrics

### Local Development with dotnet-counters

#### Installation

```bash
# Install dotnet-counters globally (one-time)
dotnet tool install -g dotnet-counters

# Update to latest version
dotnet tool update -g dotnet-counters
```

#### Basic Usage

```bash
# View all metrics by provider name
dotnet-counters monitor -n Base2.Web --counters Base2.ProductName

# Output:
# Press p to pause, r to resume, q to quit.
#     Status: Running
#
# [Base2.ProductName]
#     product_name.sequences.emails_sent ({emails})                    42
#     product_name.sequences.emails_failed ({emails})                   3
#     product_name.api.request_duration (s)
#         Percentile
#         50                                                    0.125
#         95                                                    0.450
#         99                                                    0.890
```

#### View Specific Metrics

```bash
# View only email-related metrics
dotnet-counters monitor -n Base2.ProductName \
  --counters Base2.ProductName[product_name.sequences.emails_sent,product_name.sequences.emails_failed]
```

#### Refresh Rate

```bash
# Update every 5 seconds (default is 1 second)
dotnet-counters monitor -n Base2.ProductName \
  --counters Base2.ProductName \
  --refresh-interval 5
```

#### Export to File

```bash
# Export metrics to JSON
dotnet-counters collect -n Base2.ProductName \
  --counters Base2.ProductName \
  --format json \
  -o metrics.json
```

### Production Monitoring

For production environments, use OpenTelemetry exporters to send metrics to observability platforms:

- **Prometheus + Grafana**: Open-source metrics and dashboards
- **Azure Monitor**: Microsoft's cloud monitoring service
- **Datadog**: Commercial APM platform
- **New Relic**: Commercial observability platform

See `doc/guides/observability-setup.md` for detailed setup instructions.

---

## Performance Considerations

### Memory Usage

#### Counters and Gauges
- **Minimal memory**: ~100 bytes per instrument
- **Per tag combination**: ~50 bytes
- **Safe**: Thousands of counters

#### Histograms
- **Higher memory**: ~1-10 KB per instrument (depends on bucket count)
- **Per tag combination**: ~500 bytes - 5 KB
- **Limit**: ~100 concurrent histograms recommended
- **More buckets = more memory**: Each bucket stores aggregated data

#### Example Memory Calculation

```
Histogram with 10 buckets and 100 tag combinations:
10 buckets × 100 combinations × 500 bytes = 500 KB
```

### CPU Overhead

#### When Not Collecting
- **< 10 nanoseconds** per measurement
- Essentially free - safe to use liberally

#### When Collecting
- **Tens to hundreds of nanoseconds** per measurement
- Still very fast - safe for most use cases
- **Hot paths**: Consider impact if > 1 million calls/sec/thread

### Cardinality Impact

| Cardinality | Memory Impact | Performance Impact | Recommendation |
|-------------|---------------|-------------------|----------------|
| < 100 | Negligible | None | ✅ Safe |
| 100 - 1,000 | Low | Minimal | ✅ Safe |
| 1,000 - 10,000 | Moderate | Noticeable | ⚠️ Monitor |
| > 10,000 | High | Significant | ❌ Avoid |

### Optimization Tips

1. **Use smaller types** for high-cardinality metrics
   ```csharp
   // ✅ Better: 2 bytes per tag combination
   Counter<short> _smallCounter = _meter.CreateCounter<short>(...);
   
   // ❌ Worse: 8 bytes per tag combination
   Counter<double> _largeCounter = _meter.CreateCounter<double>(...);
   ```

2. **Consistent tag ordering** for better performance
   ```csharp
   // ✅ Good: Same order every time
   _emailsSent.Add(1,
       new KeyValuePair<string, object?>("email.provider", provider),
       new KeyValuePair<string, object?>("sequence.type", type));
   
   // ❌ Bad: Inconsistent ordering
   if (condition)
       _emailsSent.Add(1,
           new KeyValuePair<string, object?>("sequence.type", type),
           new KeyValuePair<string, object?>("email.provider", provider));
   ```

3. **Limit histogram count** in hot paths
   ```csharp
   // ⚠️ Caution: Many histograms with high cardinality
   for (int i = 0; i < 1000; i++)
   {
       var histogram = _meter.CreateHistogram<double>($"metric_{i}");
       // This creates 1000 histograms!
   }
   ```

---

## Best Practices

### DO ✅

- **Use descriptive metric names** following OpenTelemetry conventions
  ```csharp
  "product_name.sequences.emails_sent"  // ✅ Clear and hierarchical
  ```

- **Add units to all metrics**
  ```csharp
  unit: "s"           // Seconds
  unit: "{emails}"    // Count of emails
  unit: "By"          // Bytes
  ```

- **Add descriptions** to help users understand metrics
  ```csharp
  description: "Total number of emails sent through sequences"
  ```

- **Test all custom metrics** with `MetricCollector<T>`

- **Use low-cardinality tags** (< 1,000 combinations)

- **Choose appropriate instrument types**
  - Counter for events that only increase
  - Histogram for distributions
  - Gauge for current values

- **Record timing in seconds** as floating-point
  ```csharp
  var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
  _histogram.Record(duration);  // In seconds
  ```

- **Handle exceptions** and record failure metrics
  ```csharp
  try
  {
      await DoWorkAsync();
      _metrics.RecordSuccess();
  }
  catch (Exception ex)
  {
      _metrics.RecordFailure(ex.GetType().Name);
      throw;
  }
  ```

### DON'T ❌

- **Don't use high-cardinality tags**
  ```csharp
  // ❌ Bad: Millions of unique user IDs
  _metrics.RecordEvent(userId: user.Id.ToString());
  ```

- **Don't create metrics in hot loops** without measurements
  ```csharp
  // ❌ Bad: Creates instrument on every iteration
  for (int i = 0; i < 1000000; i++)
  {
      var counter = _meter.CreateCounter<int>("my_counter");
      counter.Add(1);
  }
  
  // ✅ Good: Create once, use many times
  var counter = _meter.CreateCounter<int>("my_counter");
  for (int i = 0; i < 1000000; i++)
  {
      counter.Add(1);
  }
  ```

- **Don't ignore histogram bucket boundaries**
  ```csharp
  // ❌ Bad: Using defaults for specific use case
  var histogram = _meter.CreateHistogram<double>("duration");
  
  // ✅ Good: Optimized boundaries
  var histogram = _meter.CreateHistogram<double>(
      "duration",
      advice: new InstrumentAdvice<double>
      {
          HistogramBucketBoundaries = [0.01, 0.05, 0.1, 0.5, 1, 5]
      });
  ```

- **Don't mix metric types**
  ```csharp
  // ❌ Bad: Using Counter for gauge data
  _activeConnections.Add(1);  // Connection opened
  // But how do you record connection closed?
  
  // ✅ Good: Use UpDownCounter
  _activeConnections.Add(1);   // Connection opened
  _activeConnections.Add(-1);  // Connection closed
  ```

- **Don't skip unit tests** for metrics

- **Don't use inconsistent naming**
  ```csharp
  // ❌ Bad: Inconsistent naming
  "product_name.sequences.EmailsSent"    // PascalCase
  "reach_sequences_emails_sent"          // Underscores
  "product_name.sequences.sent-emails"   // Hyphens
  
  // ✅ Good: Consistent naming
  "product_name.sequences.emails_sent"   // Lowercase with dots and underscores
  ```

---

## Common Patterns

### Pattern 1: Timing Operations

```csharp
public async Task<TResult> TimedOperationAsync<TResult>(
    Func<Task<TResult>> operation,
    string operationName)
{
    var startTime = Stopwatch.GetTimestamp();
    
    try
    {
        var result = await operation();
        
        var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
        _metrics.RecordOperationDuration(operationName, duration);
        _metrics.RecordOperationSuccess(operationName);
        
        return result;
    }
    catch (Exception ex)
    {
        _metrics.RecordOperationFailure(operationName, ex.GetType().Name);
        throw;
    }
}

// Usage
var result = await TimedOperationAsync(
    () => _emailProvider.SendAsync(message, ct),
    "send_email");
```

### Pattern 2: Success/Failure Tracking

```csharp
public async Task<SendResult> SendEmailAsync(EmailMessage message, CancellationToken ct)
{
    try
    {
        var result = await _emailProvider.SendAsync(message, ct);
        
        if (result.Success)
        {
            _metrics.RecordEmailSent(emailProvider: "smtp");
        }
        else
        {
            _metrics.RecordEmailFailed(
                errorType: result.ErrorType ?? "unknown",
                emailProvider: "smtp");
        }
        
        return result;
    }
    catch (Exception ex)
    {
        _metrics.RecordEmailFailed(
            errorType: ex.GetType().Name,
            emailProvider: "smtp");
        throw;
    }
}
```

### Pattern 3: Batch Operations

```csharp
public async Task<ImportResult> ImportContactsAsync(
    IEnumerable<ContactModel> contacts,
    CancellationToken ct)
{
    var startTime = Stopwatch.GetTimestamp();
    var successCount = 0;
    var failureCount = 0;
    
    foreach (var contact in contacts)
    {
        try
        {
            await _contactQuery.CreateAsync(contact, ct);
            successCount++;
        }
        catch
        {
            failureCount++;
        }
    }
    
    // Record batch metrics
    _metrics.RecordContactsImported(successCount, source: "csv");
    if (failureCount > 0)
    {
        _metrics.RecordContactImportFailures(failureCount);
    }
    
    var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
    _metrics.RecordImportDuration(duration);
    
    return new ImportResult
    {
        SuccessCount = successCount,
        FailureCount = failureCount
    };
}
```

### Pattern 4: Observable Gauge for State

```csharp
public class EmailAccountService
{
    private int _connectedAccountsCount;

    public EmailAccountService(IMeterFactory meterFactory)
    {
        var meter = meterFactory.Create(MetricsConstants.MeterName);
        
        // Observable gauge automatically reports current value
        meter.CreateObservableGauge<int>(
            "product_name.email_accounts.connected",
            () => _connectedAccountsCount,
            unit: "{connections}",
            description: "Number of connected email accounts");
    }

    public async Task ConnectAccountAsync(EmailAccountModel account, CancellationToken ct)
    {
        await _emailProvider.ConnectAsync(account, ct);
        
        // Update the state - gauge will report new value automatically
        Interlocked.Increment(ref _connectedAccountsCount);
    }

    public async Task DisconnectAccountAsync(long accountId, CancellationToken ct)
    {
        await _emailProvider.DisconnectAsync(accountId, ct);
        
        // Update the state
        Interlocked.Decrement(ref _connectedAccountsCount);
    }
}
```

### Pattern 5: Conditional Metrics

```csharp
public async Task<ProcessResult> ProcessSequenceAsync(
    Sequence sequence,
    CancellationToken ct)
{
    var startTime = Stopwatch.GetTimestamp();
    
    try
    {
        var result = await _processor.ProcessAsync(sequence, ct);
        
        // Record different metrics based on result
        if (result.IsCompleted)
        {
            _metrics.RecordSequenceCompleted(sequence.Type);
            
            var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
            _metrics.RecordSequenceExecutionDuration(duration, sequence.Id.ToString());
        }
        else if (result.IsPaused)
        {
            _metrics.RecordSequencePaused(sequence.Type);
        }
        else if (result.IsFailed)
        {
            _metrics.RecordSequenceFailed(
                errorType: result.ErrorType ?? "unknown",
                sequenceType: sequence.Type);
        }
        
        return result;
    }
    catch (Exception ex)
    {
        _metrics.RecordSequenceFailed(
            errorType: ex.GetType().Name,
            sequenceType: sequence.Type);
        throw;
    }
}
```

---

## Metrics Catalog

Quick reference of all available metrics in Base2.ProductName.

### Business Metrics - Sequences

| Metric | Type | Unit | Tags | Method |
|--------|------|------|------|--------|
| `product_name.sequences.emails_sent` | Counter | {emails} | sequence.id, email.provider | `RecordEmailSent()` |
| `product_name.sequences.emails_failed` | Counter | {emails} | sequence.id, email.provider, error.type | `RecordEmailFailed()` |
| `product_name.sequences.steps_completed` | Counter | {steps} | sequence.id, step.type | `RecordStepCompleted()` |
| `product_name.sequences.execution_duration` | Histogram | s | sequence.id | `RecordSequenceExecutionDuration()` |
| `product_name.sequences.started` | Counter | {sequences} | sequence.type | `RecordSequenceStarted()` |
| `product_name.sequences.completed` | Counter | {sequences} | sequence.type | `RecordSequenceCompleted()` |

### Business Metrics - Contacts

| Metric | Type | Unit | Tags | Method |
|--------|------|------|------|--------|
| `product_name.contacts.created` | Counter | {contacts} | - | `RecordContactCreated()` |
| `product_name.contacts.updated` | Counter | {contacts} | - | `RecordContactUpdated()` |

### Infrastructure Metrics - Email Accounts

| Metric | Type | Unit | Tags | Method |
|--------|------|------|------|--------|
| `product_name.email_accounts.connected` | ObservableGauge | {connections} | - | (automatic) |
| `product_name.email_accounts.connection_failures` | Counter | {failures} | email.provider, error.type | `RecordEmailAccountConnectionFailure()` |
| `product_name.email_accounts.auth_refreshes` | Counter | {refreshes} | email.provider, success | `RecordEmailAccountAuthRefresh()` |
| `product_name.email_accounts.api_latency` | Histogram | s | email.provider, operation | `RecordEmailAccountApiLatency()` |

### Infrastructure Metrics - Background Jobs

| Metric | Type | Unit | Tags | Method |
|--------|------|------|------|--------|
| `product_name.background.job_duration` | Histogram | s | job.type | `RecordBackgroundJobCompleted()` |
| `product_name.background.jobs_completed` | Counter | {jobs} | job.type | `RecordBackgroundJobCompleted()` |
| `product_name.background.jobs_failed` | Counter | {jobs} | job.type, error.type | `RecordBackgroundJobFailed()` |
| `product_name.background.queue_depth` | ObservableGauge | {jobs} | - | (automatic) |

### API Metrics

| Metric | Type | Unit | Tags | Method |
|--------|------|------|------|--------|
| `product_name.api.request_duration` | Histogram | s | http.method, http.route, http.status_code | `RecordApiRequest()` |
| `product_name.api.requests_total` | Counter | {requests} | http.method, http.route, http.status_code | `RecordApiRequest()` |
| `product_name.api.errors` | Counter | {errors} | http.method, http.route, error.type | `RecordApiError()` |

### Database Metrics

| Metric | Type | Unit | Tags | Method |
|--------|------|------|------|--------|
| `product_name.db.query_duration` | Histogram | s | db.operation, db.entity | `RecordDatabaseQuery()` |
| `product_name.db.queries_executed` | Counter | {queries} | db.operation, db.entity | `RecordDatabaseQuery()` |

---

## Troubleshooting

### Metrics Not Appearing

**Problem**: Metrics don't show up in `dotnet-counters`

**Solutions**:

1. **Check meter name matches**
   ```csharp
   // In ObservabilityMetrics.cs
   _meter = meterFactory.Create("Base2.ProductName", "1.0.0");
   
   // In dotnet-counters
   dotnet-counters monitor -n Base2.Web --counters Base2.ProductName
   ```

2. **Verify instrument is created**
   ```csharp
   // Make sure instrument is created in constructor
   _emailsSent = _meter.CreateCounter<long>("product_name.sequences.emails_sent", ...);
   ```

3. **Ensure measurements are recorded**
   ```csharp
   // Make sure you're calling the method
   _metrics.RecordEmailSent();
   ```

4. **Check DI registration**
   ```csharp
   // In Program.cs
   builder.Services.AddObservabilityMetrics();
   ```

### High Memory Usage

**Problem**: Application using too much memory

**Solutions**:

1. **Check histogram count**
   ```bash
   # Count histograms in your code
   grep -r "CreateHistogram" --include="*.cs"
   ```

2. **Analyze tag cardinality**
   ```csharp
   // Log unique tag combinations
   var uniqueCombinations = measurements
       .Select(m => string.Join(",", m.Tags.Select(t => $"{t.Key}={t.Value}")))
       .Distinct()
       .Count();
   
   Console.WriteLine($"Unique tag combinations: {uniqueCombinations}");
   ```

3. **Reduce bucket count**
   ```csharp
   // Before: 15 buckets
   HistogramBucketBoundaries = [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100]
   
   // After: 8 buckets
   HistogramBucketBoundaries = [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50]
   ```

4. **Remove high-cardinality tags**
   ```csharp
   // ❌ Bad: High cardinality
   _metrics.RecordEmailSent(userId: user.Id.ToString());
   
   // ✅ Good: Low cardinality
   _metrics.RecordEmailSent(emailProvider: "smtp");
   ```

### Performance Impact

**Problem**: Metrics causing performance issues

**Solutions**:

1. **Profile hot paths**
   ```bash
   # Use dotnet-trace to find hot paths
   dotnet trace collect -n Base2.Web --profile cpu-sampling
   ```

2. **Consider sampling** for high-frequency metrics
   ```csharp
   // Only record 1% of measurements
   if (Random.Shared.Next(100) == 0)
   {
       _metrics.RecordEmailSent();
   }
   ```

3. **Use appropriate types**
   ```csharp
   // ✅ Better: Use smaller type for high-frequency metrics
   Counter<short> _counter = _meter.CreateCounter<short>(...);
   
   // ❌ Worse: Larger type uses more memory
   Counter<double> _counter = _meter.CreateCounter<double>(...);
   ```

4. **Batch measurements** when possible
   ```csharp
   // ✅ Good: Record batch count
   _metrics.RecordContactsImported(count: 1000);
   
   // ❌ Bad: Record 1000 individual measurements
   for (int i = 0; i < 1000; i++)
   {
       _metrics.RecordContactCreated();
   }
   ```

### Observable Gauge Issues

**Problem**: Observable gauge not updating or causing errors

**Solutions**:

1. **Avoid long-running callbacks**
   ```csharp
   // ❌ Bad: Async operation in callback
   _meter.CreateObservableGauge<int>(
       "gauge",
       () => GetValueAsync().Result);  // Blocks!
   
   // ✅ Good: Return cached value
   _meter.CreateObservableGauge<int>(
       "gauge",
       () => _cachedValue);
   ```

2. **Handle exceptions in callbacks**
   ```csharp
   _meter.CreateObservableGauge<int>(
       "gauge",
       () =>
       {
           try
           {
               return GetValue();
           }
           catch (Exception ex)
           {
               _logger.LogError(ex, "Error getting gauge value");
               return 0;
           }
       });
   ```

3. **Synchronize access to shared state**
   ```csharp
   private int _value;
   
   _meter.CreateObservableGauge<int>(
       "gauge",
       () => Volatile.Read(ref _value));  // Thread-safe read
   
   public void UpdateValue(int newValue)
   {
       Volatile.Write(ref _value, newValue);  // Thread-safe write
   }
   ```

---

## Examples from Codebase

### Example 1: Sequence Execution Service

```csharp
using System.Diagnostics;
using Base2.Services.Observability;

namespace Base2.Services.Orchestration;

public class SequenceExecutionService(
    IObservabilityMetrics metrics,
    IEmailProvider emailProvider,
    ILogger<SequenceExecutionService> logger)
{
    private readonly IObservabilityMetrics _metrics = metrics;
    private readonly IEmailProvider _emailProvider = emailProvider;
    private readonly ILogger _logger = logger;

    public async Task ExecuteSequenceAsync(
        Sequence sequence,
        CancellationToken ct)
    {
        var startTime = Stopwatch.GetTimestamp();
        
        try
        {
            _metrics.RecordSequenceStarted(sequence.Type);
            
            foreach (var step in sequence.Steps)
            {
                await ExecuteStepAsync(sequence, step, ct);
                
                _metrics.RecordStepCompleted(
                    stepType: step.Type,
                    sequenceId: sequence.Id.ToString());
            }
            
            _metrics.RecordSequenceCompleted(sequence.Type);
            
            var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
            _metrics.RecordSequenceExecutionDuration(
                duration,
                sequenceId: sequence.Id.ToString());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sequence execution failed");
            _metrics.RecordSequenceFailed(
                errorType: ex.GetType().Name,
                sequenceId: sequence.Id.ToString());
            throw;
        }
    }

    private async Task ExecuteStepAsync(
        Sequence sequence,
        SequenceStep step,
        CancellationToken ct)
    {
        if (step.Type == "send_email")
        {
            try
            {
                await _emailProvider.SendAsync(step.EmailMessage, ct);
                
                _metrics.RecordEmailSent(
                    sequenceId: sequence.Id.ToString(),
                    emailProvider: _emailProvider.ProviderId);
            }
            catch (Exception ex)
            {
                _metrics.RecordEmailFailed(
                    errorType: ex.GetType().Name,
                    sequenceId: sequence.Id.ToString(),
                    emailProvider: _emailProvider.ProviderId);
                throw;
            }
        }
    }
}
```

### Example 2: Email Provider with API Latency

```csharp
using System.Diagnostics;
using Base2.Services.Observability;

namespace Base2.Services.Infrastructure.Providers;

public class Office365EmailProvider(
    IObservabilityMetrics metrics,
    IGraphServiceClient graphClient,
    ILogger<Office365EmailProvider> logger) : IEmailProvider
{
    private readonly IObservabilityMetrics _metrics = metrics;
    private readonly IGraphServiceClient _graphClient = graphClient;
    private readonly ILogger _logger = logger;

    public string ProviderId => "office365";

    public async Task<SendResult> SendEmailAsync(
        EmailMessage message,
        CancellationToken ct)
    {
        var startTime = Stopwatch.GetTimestamp();
        
        try
        {
            var result = await _graphClient.SendMailAsync(message, ct);
            
            var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
            _metrics.RecordEmailAccountApiLatency(
                durationSeconds: duration,
                emailProvider: ProviderId,
                operation: "send_email");
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email via Office365");
            
            _metrics.RecordEmailAccountConnectionFailure(
                emailProvider: ProviderId,
                errorType: ex.GetType().Name);
            
            throw;
        }
    }

    public async Task RefreshTokenAsync(CancellationToken ct)
    {
        try
        {
            await _tokenService.RefreshAsync(ct);
            
            _metrics.RecordEmailAccountAuthRefresh(
                emailProvider: ProviderId,
                success: true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to refresh Office365 token");
            
            _metrics.RecordEmailAccountAuthRefresh(
                emailProvider: ProviderId,
                success: false);
            
            throw;
        }
    }
}
```

### Example 3: API Metrics Middleware

```csharp
using System.Diagnostics;
using Base2.Services.Observability;

namespace Base2.Web.Middleware;

public class MetricsMiddleware(
    RequestDelegate next,
    IObservabilityMetrics metrics)
{
    private readonly RequestDelegate _next = next;
    private readonly IObservabilityMetrics _metrics = metrics;

    public async Task InvokeAsync(HttpContext context)
    {
        var startTime = Stopwatch.GetTimestamp();
        
        try
        {
            await _next(context);
            
            var duration = Stopwatch.GetElapsedTime(startTime).TotalSeconds;
            var route = context.GetEndpoint()?.DisplayName ?? "unknown";
            
            _metrics.RecordApiRequest(
                httpMethod: context.Request.Method,
                route: route,
                statusCode: context.Response.StatusCode,
                durationSeconds: duration);
        }
        catch (Exception ex)
        {
            var route = context.GetEndpoint()?.DisplayName ?? "unknown";
            
            _metrics.RecordApiError(
                httpMethod: context.Request.Method,
                route: route,
                errorType: ex.GetType().Name);
            
            throw;
        }
    }
}

public static class MetricsMiddlewareExtensions
{
    public static IApplicationBuilder UseObservabilityMetrics(this IApplicationBuilder app)
    {
        return app.UseMiddleware<MetricsMiddleware>();
    }
}
```

### Example 4: Database Metrics Interceptor

```csharp
using System.Data.Common;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Base2.Services.Observability;

namespace Base2.Data.Interceptors;

public class MetricsInterceptor(IObservabilityMetrics metrics) : DbCommandInterceptor
{
    private readonly IObservabilityMetrics _metrics = metrics;

    public override async ValueTask<DbDataReader> ReaderExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result,
        CancellationToken cancellationToken = default)
    {
        RecordQueryMetrics(command, eventData);
        return await base.ReaderExecutedAsync(command, eventData, result, cancellationToken);
    }

    public override async ValueTask<int> NonQueryExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        RecordQueryMetrics(command, eventData);
        return await base.NonQueryExecutedAsync(command, eventData, result, cancellationToken);
    }

    private void RecordQueryMetrics(DbCommand command, CommandExecutedEventData eventData)
    {
        var operation = GetOperationType(command.CommandText);
        var entity = ExtractEntityName(command.CommandText);
        var duration = eventData.Duration.TotalSeconds;

        _metrics.RecordDatabaseQuery(operation, entity, duration);
    }

    private static string GetOperationType(string commandText)
    {
        var normalized = commandText.TrimStart().ToUpperInvariant();
        
        if (normalized.StartsWith("SELECT")) return "SELECT";
        if (normalized.StartsWith("INSERT")) return "INSERT";
        if (normalized.StartsWith("UPDATE")) return "UPDATE";
        if (normalized.StartsWith("DELETE")) return "DELETE";
        
        return "OTHER";
    }

    private static string ExtractEntityName(string commandText)
    {
        // Simple extraction - looks for table name after FROM/INTO/UPDATE
        var patterns = new[] { "FROM ", "INTO ", "UPDATE " };
        
        foreach (var pattern in patterns)
        {
            var index = commandText.IndexOf(pattern, StringComparison.OrdinalIgnoreCase);
            if (index >= 0)
            {
                var start = index + pattern.Length;
                var remaining = commandText[start..].TrimStart();
                var end = remaining.IndexOfAny([' ', '\n', '\r', '(', ';']);
                
                if (end > 0)
                {
                    return remaining[..end].Trim('"', '[', ']');
                }
            }
        }
        
        return "unknown";
    }
}
```

---

## Reference

### Documentation
- [.NET Metrics Instrumentation](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/metrics-instrumentation)
- [OpenTelemetry .NET](https://opentelemetry.io/docs/languages/net/)
- [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)
- [UCUM Units](https://ucum.org/)

### Related Patterns
- [Server Testing Patterns](./testing-patterns.md) - Testing metrics with `MetricCollector<T>`
- [Server Feature Template](./server-feature-template.md) - Adding metrics to new features
- [Server Quick Reference](./server-quick-reference.md) - Quick metrics reference

### Tools
- **dotnet-counters**: View metrics locally during development
- **OpenTelemetry**: Export metrics to observability platforms
- **Prometheus**: Metrics collection and storage
- **Grafana**: Metrics visualization and dashboards

### Implementation Plan
See `doc/plans/features/2025-12-14_metrics-instrumentation-implementation-plan.md` for the complete implementation roadmap.

---

**Last Updated**: 2025-12-14  
**Version**: 1.0  
**Status**: Ready for Implementation
