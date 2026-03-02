# Overriding Services in Integration Tests

## Overview

When writing `WebApplicationFactory` integration tests, you sometimes need to swap out a
real service implementation for a test double — for example, replacing
`ICloudDocumentProvider` with an NSubstitute mock that returns controlled responses.

The correct tool is `services.Replace()` from
`Microsoft.Extensions.DependencyInjection.Extensions`. It removes the existing
registration for a type and inserts your replacement, leaving no ambiguity in the
container.

## Why Not `AddScoped`?

`services.AddScoped(_ => myMock)` **appends** a second registration rather than removing
the first. MEDI resolves `GetRequiredService<T>` as the last registration, so this
technically works today — but only by accident. It is fragile: ordering guarantees can
shift, and a reader of the code cannot tell that this is an intentional override rather
than a second provider. `Replace()` makes intent explicit.

## The Pattern

### Factory helper (one per test class)

```csharp
using Microsoft.Extensions.DependencyInjection.Extensions;

private WebApplicationFactory<Program> WithCloudProvider(ICloudDocumentProvider provider) =>
    _baseFactory.WithWebHostBuilder(builder =>
        builder.ConfigureServices(services =>
            services.Replace(ServiceDescriptor.Scoped<ICloudDocumentProvider>(_ => provider))));
```

### Using it in a test

```csharp
[Fact]
public async Task Approve_MatchingETag_Returns200()
{
    var cloudProvider = Substitute.For<ICloudDocumentProvider>();
    cloudProvider.FetchDocumentAsync(Arg.Any<string>(), Arg.Any<CancellationToken>())
        .Returns(Array.Empty<byte>());
    cloudProvider.PushDocumentAsync(
            Arg.Any<string>(), Arg.Any<byte[]>(),
            Arg.Any<string?>(), Arg.Any<CancellationToken>())
        .Returns(new CloudDocumentInfo { /* ... */ });

    // Seed and exercise against the same factory that has the override.
    var factory = WithCloudProvider(cloudProvider);
    var (_, changesetId) = await SeedChangesetAsync(factory, "etag-v1", "etag-v1");

    var client = new ApiClient(factory.CreateClient());
    await client.LoginAsync();

    var response = await client.ApproveChangesetAsync(changesetId);
    response.StatusCode.Should().Be(HttpStatusCode.OK);
}
```

### `ServiceDescriptor` forms

| Scenario | Descriptor |
|---|---|
| Factory returning an existing instance | `ServiceDescriptor.Scoped<IFoo>(_ => myInstance)` |
| Concrete substitute type | `ServiceDescriptor.Scoped<IFoo, MyStubFoo>()` |
| Singleton stub | `ServiceDescriptor.Singleton<IFoo>(_ => myInstance)` |

Match the lifetime to the original registration. Mismatched lifetimes cause subtle
scope-capture bugs.

## When `ConfigureServices` Runs

`WithWebHostBuilder.ConfigureServices` callbacks run **after** the application's
`Program.cs` service setup, so `Replace()` always sees the original registration and
can remove it cleanly.

## When to Use This vs. Other Approaches

| Situation | Approach |
|---|---|
| Swap one service for a specific test | `services.Replace()` in `WithWebHostBuilder` |
| Change which DB provider or connection is used | Environment variable + conditional registration in `Program.cs` (see [In-Memory Database Mode](./in-memory-database-mode.md)) |
| Remove a registration with no replacement | `services.RemoveAll<IFoo>()` |
| Override many services across many test classes | Consider a custom `WebApplicationFactory<Program>` subclass with typed override methods |

## Related Documentation

- [In-Memory Database Mode](./in-memory-database-mode.md) — environment-variable-based
  service configuration at startup
- [Testing Patterns](../../patterns/server/testing-patterns.md) — general xUnit and
  `WebApplicationFactory` patterns

---

**Last Updated**: 2026-02-17
