# Background Job Enqueueing Pattern

## Overview

This document describes the pattern for enqueueing background jobs in the Product Name application. The pattern ensures that:
- Services remain infrastructure-agnostic (no direct Hangfire dependencies)
- Job enqueueing is type-safe and testable
- The enqueueing interface is simple and explicit (no expression trees in calling code)
- Dependencies flow cleanly through the project structure

**Core Principle**: Each job has a corresponding enqueuer interface with explicit method signatures that match the job's `ExecuteAsync` parameters.

## Architecture

### Project Dependency Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Base2.Contracts (Interfaces)                   │
│                                                             │
│  • IContactImportJobEnqueuer                                │
│  • IEmailAccountHealthCheckJobEnqueuer                      │
│  • ... other job enqueuer interfaces                        │
│                                                             │
│  (No dependencies, just interface definitions)              │
└─────────────────────────────────────────────────────────────┘
                            ▲                ▲
                            │                │
                  implements│                │injects
                            │                │
┌────────────────────────────────────┐   ┌──┴───────────────────┐
│  Base2.Background.Tasks            │   │  Base2.Services      │
│                                    │   │                      │
│  • ContactImportJobEnqueuer ───────┤   │  • Injects           │
│    (implements interface)          │   │    enqueuers         │
│  • Uses IBackgroundJobClient       │   │  • Calls Enqueue()   │
│  • Registers in DI                 │   │                      │
└────────────────────────────────────┘   └──────────────────────┘
                            ▲                      ▲
                            │                      │
                            │injects               │injects
                            │                      │
                ┌───────────┴──────────────┐   ┌──┴────────────┐
                │  Base2.Web               │   │  Base2.       │
                │                          │   │  Background   │
                │  • Controllers inject    │   │               │
                │    enqueuers             │   │  • Worker     │
                │                          │   │    injects    │
                └──────────────────────────┘   └───────────────┘
```

### Three-Layer Approach

1. **Interface Definition** (`Base2.Contracts/src/BackgroundJobs/`)
   - Simple, explicit interfaces with no dependencies
   - Method signatures match job `ExecuteAsync` parameters
   - Can be injected anywhere (services, controllers, background worker)

2. **Implementation** (`Base2.Background.Tasks/src/BackgroundJobs/`)
   - Thin wrappers around `IBackgroundJobClient`
   - Contains Hangfire-specific code
   - Registered in DI

3. **Usage** (Services, Controllers, Background Jobs)
   - Inject the interface
   - Call simple methods (no expression trees)
   - Fully testable with mock implementations

---

## Pattern 1: Single-Operation Job (1:1 Pattern)

**Use this pattern when**: A job performs one specific operation.

### Job Definition

**File**: `Base2.Background.Tasks/src/Prospecting/Importing/ProcessContactImportJob.cs`

```csharp
namespace Base2.Prospecting.Importing;

/// <summary>
/// Background job for processing contact imports.
/// </summary>
public class ProcessContactImportJob(
    IServiceProvider serviceProvider,
    ILogger<ProcessContactImportJob> logger)
{
    /// <summary>
    /// Executes the contact import processing.
    /// </summary>
    /// <param name="importId">The import ID to process.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    public async Task ExecuteAsync(long importId, CancellationToken cancellationToken)
    {
        logger.LogInformation("Processing contact import {ImportId}", importId);
        
        using var scope = serviceProvider.CreateScope();
        var importService = scope.ServiceProvider.GetRequiredService<IContactImportService>();
        
        await importService.ProcessImportAsync(importId, cancellationToken);
    }
}
```

### Enqueuer Interface (1:1 Match)

**File**: `Base2.Contracts/src/BackgroundJobs/IContactImportJobEnqueuer.cs`

```csharp
namespace Base2.BackgroundJobs;

/// <summary>
/// Enqueues contact import background jobs.
/// </summary>
public interface IContactImportJobEnqueuer
{
    /// <summary>
    /// Enqueue a job to process a contact import.
    /// Parameters match ProcessContactImportJob.ExecuteAsync signature.
    /// </summary>
    /// <param name="importId">The import ID to process.</param>
    /// <returns>Job ID for tracking.</returns>
    string Enqueue(long importId);
}
```

**Key Point**: The `Enqueue` parameters match `ExecuteAsync` parameters (minus `CancellationToken`).

### Enqueuer Implementation

**File**: `Base2.Background.Tasks/src/BackgroundJobs/ContactImportJobEnqueuer.cs`

```csharp
using Hangfire;
using Base2.Prospecting.Importing;

namespace Base2.BackgroundJobs;

/// <summary>
/// Hangfire implementation of contact import job enqueuer.
/// </summary>
public class ContactImportJobEnqueuer(IBackgroundJobClient client) 
    : IContactImportJobEnqueuer
{
    private readonly IBackgroundJobClient _client = client;

    public string Enqueue(long importId)
    {
        return _client.Enqueue<ProcessContactImportJob>(
            job => job.ExecuteAsync(importId, CancellationToken.None));
    }
}
```

### Registration

**File**: `Base2.Background.Tasks/src/Extensions/IServiceCollectionExtensions.cs`

```csharp
public static IServiceCollection AddBackgroundJobEnqueuers(this IServiceCollection services)
{
    services.AddSingleton<IContactImportJobEnqueuer, ContactImportJobEnqueuer>();
    // ... other enqueuers
    return services;
}
```

### Usage from Service

```csharp
namespace Base2.Prospecting.Importing;

public class ContactImportService(
    WarehouseDbContext dbContext,
    IContactImportJobEnqueuer jobEnqueuer,  // ← Inject interface
    ILogger<ContactImportService> logger) : IContactImportService
{
    public async Task<ContactImportDetailModel> StartProcessingAsync(
        long importId,
        CancellationToken cancellationToken = default)
    {
        var import = await GetImportAsync(importId, cancellationToken);
        if (import is null)
            throw new ResourceNotFoundException("Import not found");

        if (import.StatusId != nameof(ContactImportStatus.pending))
            throw new BusinessRuleViolationException("Import is not in pending status");

        // Simple, explicit method call - no expression trees
        var jobId = _jobEnqueuer.Enqueue(importId);
        
        logger.LogInformation("Enqueued job {JobId} for import {ImportId}", jobId, importId);

        return import;
    }
}
```

---

## Pattern 2: Multi-Operation Job (Related Operations)

**Use this pattern when**: A job has multiple closely related entry points or variations.

### Job Definition with Multiple Entry Points

**File**: `Base2.Background.Tasks/src/Infrastructure/EmailAccountHealthCheckJob.cs`

```csharp
namespace Base2.BackgroundJobs;

/// <summary>
/// Background job for checking email account domain authentication health.
/// </summary>
public class EmailAccountHealthCheckJob(
    IEmailAccountService emailAccountService,
    IDomainAuthenticationService domainAuthService,
    ILogger<EmailAccountHealthCheckJob> logger)
{
    public const string JobId = "email-account-health-check";

    /// <summary>
    /// Check all active email accounts.
    /// </summary>
    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        logger.LogInformation("Starting health check for all accounts");
        var accounts = await emailAccountService.GetAllActiveAccountsAsync(ct);
        
        foreach (var account in accounts)
        {
            await CheckAccountAsync(account.Id, ct);
        }
    }

    /// <summary>
    /// Check a specific email account.
    /// </summary>
    public async Task ExecuteForAccountAsync(int accountId, CancellationToken ct = default)
    {
        logger.LogInformation("Starting health check for account {AccountId}", accountId);
        await CheckAccountAsync(accountId, ct);
    }

    /// <summary>
    /// Check all accounts for a specific domain.
    /// </summary>
    public async Task ExecuteForDomainAsync(string domain, CancellationToken ct = default)
    {
        logger.LogInformation("Starting health check for domain {Domain}", domain);
        var accounts = await emailAccountService.GetAccountsByDomainAsync(domain, ct);
        
        foreach (var account in accounts)
        {
            await CheckAccountAsync(account.Id, ct);
        }
    }

    private async Task CheckAccountAsync(int accountId, CancellationToken ct)
    {
        // Shared checking logic
        var result = await domainAuthService.RecheckEmailAccountAsync(accountId, ct);
        // ... handle result
    }
}
```

### Enqueuer Interface (Multiple Methods)

**File**: `Base2.Contracts/src/BackgroundJobs/IEmailAccountHealthCheckJobEnqueuer.cs`

```csharp
namespace Base2.BackgroundJobs;

/// <summary>
/// Enqueues email account health check background jobs.
/// Multiple methods for related operations on the same job.
/// </summary>
public interface IEmailAccountHealthCheckJobEnqueuer
{
    /// <summary>
    /// Enqueue a health check for all active accounts.
    /// Matches EmailAccountHealthCheckJob.ExecuteAsync().
    /// </summary>
    string EnqueueAllAccountsCheck();

    /// <summary>
    /// Enqueue a health check for a specific account.
    /// Matches EmailAccountHealthCheckJob.ExecuteForAccountAsync(int).
    /// </summary>
    string EnqueueSingleAccountCheck(int accountId);

    /// <summary>
    /// Enqueue a health check for all accounts in a domain.
    /// Matches EmailAccountHealthCheckJob.ExecuteForDomainAsync(string).
    /// </summary>
    string EnqueueDomainCheck(string domain);
}
```

### Enqueuer Implementation

**File**: `Base2.Background.Tasks/src/BackgroundJobs/EmailAccountHealthCheckJobEnqueuer.cs`

```csharp
using Hangfire;

namespace Base2.BackgroundJobs;

/// <summary>
/// Hangfire implementation of email account health check job enqueuer.
/// </summary>
public class EmailAccountHealthCheckJobEnqueuer(IBackgroundJobClient client) 
    : IEmailAccountHealthCheckJobEnqueuer
{
    private readonly IBackgroundJobClient _client = client;

    public string EnqueueAllAccountsCheck()
    {
        return _client.Enqueue<EmailAccountHealthCheckJob>(
            job => job.ExecuteAsync(CancellationToken.None));
    }

    public string EnqueueSingleAccountCheck(int accountId)
    {
        return _client.Enqueue<EmailAccountHealthCheckJob>(
            job => job.ExecuteForAccountAsync(accountId, CancellationToken.None));
    }

    public string EnqueueDomainCheck(string domain)
    {
        return _client.Enqueue<EmailAccountHealthCheckJob>(
            job => job.ExecuteForDomainAsync(domain, CancellationToken.None));
    }
}
```

### Usage from Service

```csharp
namespace Base2.Infrastructure;

public class EmailAccountService(
    WarehouseDbContext dbContext,
    IEmailAccountHealthCheckJobEnqueuer healthCheckJobs,  // ← Inject interface
    ILogger<EmailAccountService> logger) : IEmailAccountService
{
    public async Task<EmailAccountModel> CreateAsync(CreateEmailAccountModel model)
    {
        // Create account...
        await dbContext.SaveChangesAsync();
        
        // Enqueue initial health check for the new account
        var jobId = _healthCheckJobs.EnqueueSingleAccountCheck((int)account.Id);
        logger.LogInformation("Enqueued health check job {JobId} for new account", jobId);
        
        return account.ToModel();
    }

    public async Task RequestDomainRecheckAsync(string domain)
    {
        // Enqueue check for all accounts in domain
        var jobId = _healthCheckJobs.EnqueueDomainCheck(domain);
        logger.LogInformation("Enqueued domain check job {JobId} for {Domain}", jobId, domain);
    }
}
```

---

## Guidelines: Single vs. Multiple Methods

### Use Single Method When:
- Job has one clear purpose
- No variations in execution logic
- Parameters fully define the operation

**Example**: `ProcessContactImportJob` - always processes one import

```csharp
public interface IContactImportJobEnqueuer
{
    string Enqueue(long importId);
}
```

### Use Multiple Methods When:
- Job has closely related operations
- Different entry points share core logic
- Variations are on the same entity/domain concept

**Example**: `EmailAccountHealthCheckJob` - checks accounts in different scopes

```csharp
public interface IEmailAccountHealthCheckJobEnqueuer
{
    string EnqueueAllAccountsCheck();
    string EnqueueSingleAccountCheck(int accountId);
    string EnqueueDomainCheck(string domain);
}
```

### DON'T Mix Unrelated Operations

❌ **Bad** - Unrelated operations in one interface:

```csharp
public interface IJobEnqueuer
{
    string EnqueueContactImport(long importId);
    string EnqueueSequenceProcessing(long sequenceId);
    string EnqueueEmailHealthCheck(int accountId);
}
```

✅ **Good** - Separate interfaces for separate concerns:

```csharp
public interface IContactImportJobEnqueuer { ... }
public interface ISequenceJobEnqueuer { ... }
public interface IEmailAccountHealthCheckJobEnqueuer { ... }
```

---

## Testing

### Mock Implementation

Simple to create mocks for testing:

```csharp
public class FakeContactImportJobEnqueuer : IContactImportJobEnqueuer
{
    public List<long> EnqueuedImportIds { get; } = new();

    public string Enqueue(long importId)
    {
        var jobId = Guid.NewGuid().ToString();
        EnqueuedImportIds.Add(importId);
        return jobId;
    }
}
```

### Test Example

```csharp
[Fact]
public async Task StartProcessing_EnqueuesJob()
{
    // Arrange
    var fakeEnqueuer = new FakeContactImportJobEnqueuer();
    var service = new ContactImportService(
        dbContext,
        fakeEnqueuer,  // Inject fake
        logger);

    // Act
    await service.StartProcessingAsync(importId: 123);

    // Assert
    Assert.Single(fakeEnqueuer.EnqueuedImportIds);
    Assert.Equal(123, fakeEnqueuer.EnqueuedImportIds[0]);
}
```

---

## Recurring Jobs

For recurring jobs (scheduled via cron), you don't need an enqueuer interface. Register them directly in the background worker startup.

**File**: `Base2.Background.Tasks/src/Extensions/IHostApplicationBuilderExtensions.cs`

```csharp
public static class IHostApplicationBuilderExtensions
{
    public static IHost UseRecurringJobs(this IHost host)
    {
        using var scope = host.Services.CreateScope();

        // Daily health check (runs at 2 AM UTC)
        RecurringJob.AddOrUpdate<EmailAccountHealthCheckJob>(
            recurringJobId: EmailAccountHealthCheckJob.JobId,
            methodCall: job => job.ExecuteAsync(CancellationToken.None),
            cronExpression: Cron.Daily(2),
            options: new RecurringJobOptions { TimeZone = TimeZoneInfo.Utc });

        // Sequence processor (runs every minute)
        RecurringJob.AddOrUpdate<ISequenceExecutionService>(
            recurringJobId: "sequence-execution",
            methodCall: service => service.ProcessDueStepsAsync(CancellationToken.None),
            cronExpression: Cron.Minutely);

        return host;
    }
}
```

**When you need on-demand execution**: If a recurring job also needs to be triggered on-demand (e.g., user clicks "Check Now"), then create an enqueuer interface for the on-demand case.

---

## File Structure

For a job in the `Infrastructure` namespace:

```
Base2.Contracts/src/BackgroundJobs/
├── IEmailAccountHealthCheckJobEnqueuer.cs    # Interface definition

Base2.Background.Tasks/src/
├── Infrastructure/
│   └── EmailAccountHealthCheckJob.cs         # Job implementation
├── BackgroundJobs/
│   └── EmailAccountHealthCheckJobEnqueuer.cs # Enqueuer implementation
└── Extensions/
    └── IServiceCollectionExtensions.cs       # DI registration
```

---

## Naming Conventions

### Interface Names
- Pattern: `I{Feature}{Operation}JobEnqueuer`
- Examples:
  - `IContactImportJobEnqueuer`
  - `IEmailAccountHealthCheckJobEnqueuer`
  - `ISequenceJobEnqueuer`

### Implementation Names
- Pattern: `{Feature}{Operation}JobEnqueuer`
- Examples:
  - `ContactImportJobEnqueuer`
  - `EmailAccountHealthCheckJobEnqueuer`
  - `SequenceJobEnqueuer`

### Method Names
- Pattern: `Enqueue{Operation}` or `Enqueue{Scope}{Operation}`
- Single operation: `Enqueue()`
- Multiple operations: `EnqueueAllAccountsCheck()`, `EnqueueSingleAccountCheck()`

### Job Class Names
- Pattern: `{Feature}{Operation}Job`
- Examples:
  - `ProcessContactImportJob`
  - `EmailAccountHealthCheckJob`
  - `SequenceStepExecutionJob`

---

## Benefits

1. **Clean Architecture**: Services don't depend on Hangfire
2. **Type Safety**: Compile-time checking of job parameters
3. **Testability**: Easy to mock enqueuers for unit tests
4. **Simplicity**: No expression trees in calling code
5. **Flexibility**: Can swap Hangfire for another queue system
6. **Discoverability**: Explicit interfaces make jobs easy to find
7. **Consistency**: Same pattern across all background jobs

---

## Anti-Patterns

### ❌ Don't: Inject IBackgroundJobClient Directly

```csharp
// Bad - Service coupled to Hangfire
public class ContactImportService(IBackgroundJobClient backgroundJobClient)
{
    public async Task StartProcessing(long importId)
    {
        _backgroundJobClient.Enqueue<ProcessContactImportJob>(
            job => job.ExecuteAsync(importId, CancellationToken.None));
    }
}
```

### ❌ Don't: Generic Expression-Tree Interface

```csharp
// Bad - Complex, couples calling code to expression trees
public interface IBackgroundJobQueue
{
    string Enqueue<TJob>(Expression<Func<TJob, Task>> methodCall);
}

// Usage is complex
_jobQueue.Enqueue<ProcessContactImportJob>(job => job.ExecuteAsync(123, ct));
```

### ❌ Don't: Enqueue from Controllers

```csharp
// Bad - Business logic in controller
[HttpPost("{id}/start")]
public async Task<ActionResult> Start(long id)
{
    _jobEnqueuer.Enqueue(id);  // Should be in service
    return Ok();
}
```

### ✅ Do: Enqueue from Services

```csharp
// Good - Business logic in service
public class ContactImportService
{
    public async Task StartProcessingAsync(long importId)
    {
        // Validate, update status, etc.
        var jobId = _jobEnqueuer.Enqueue(importId);
        // Log, return result
    }
}

// Controller just delegates
[HttpPost("{id}/start")]
public async Task<ActionResult> Start(long id)
{
    await _importService.StartProcessingAsync(id);
    return Ok();
}
```

---

## Migration from Direct IBackgroundJobClient

If you have existing code using `IBackgroundJobClient` directly:

1. **Create enqueuer interface** in `Contracts/src/BackgroundJobs/`
2. **Create enqueuer implementation** in `Background.Tasks/src/BackgroundJobs/`
3. **Register in DI** in `Background.Tasks/src/Extensions/IServiceCollectionExtensions.cs`
4. **Update service** to inject enqueuer interface instead of `IBackgroundJobClient`
5. **Replace** expression tree calls with simple method calls

**Example**:

```csharp
// Before
public class ContactImportService(IBackgroundJobClient client)
{
    public async Task Start(long id)
    {
        _client.Enqueue<ProcessContactImportJob>(
            job => job.ExecuteAsync(id, CancellationToken.None));
    }
}

// After
public class ContactImportService(IContactImportJobEnqueuer jobEnqueuer)
{
    public async Task Start(long id)
    {
        _jobEnqueuer.Enqueue(id);
    }
}
```

---

## Related Patterns

- [Server Feature Template](./server-feature-template.md) - Overall feature structure
- [Exception Handling Pattern](./exception-handling-pattern.md) - Error handling in jobs
- [Testing Patterns](./testing-patterns.md) - Testing background jobs

---

**Document Owner**: Engineering  
**Last Updated**: 2025-12-28  
**Status**: Active Pattern

