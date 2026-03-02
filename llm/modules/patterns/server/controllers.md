# Server Controllers

> **Module**: Patterns / Server  
> **Domain**: API layer  
> **Token target**: 400-500

## Purpose

Defines controller patterns for exposing service operations via HTTP, including RLS attribute usage.

## Content to Include

### Controller Class Structure

> **Note:** Generate XML doc comments (`/// <summary>`) for all action methods. Use `[EndpointDescription]` for OpenAPI.

```csharp
// File: Web/src/Controllers/{Namespace}/{Entity}Controller.cs
[Route("api/[area]/[controller]")]
[Area(nameof({Namespace}))]
[Tags(nameof({Namespace}))]
[Authorize(Policy = AppPolicy.RequireUserRole)]
[ApiController]
public class {Entity}Controller(
    ILogger<{Entity}Controller> logger,
    {Entity}Service service) : ControllerBase
{
    private readonly ILogger _logger = logger;
    private readonly {Entity}Service _service = service;

    /// <summary>
    /// Get an entity by ID.
    /// </summary>
    [HttpGet("{id:long}")]
    [TenantRead]
    [Produces(typeof({Entity}Model))]
    [EndpointDescription("Returns an entity by ID.")]
    public async Task<ActionResult> Get(long id, CancellationToken ct)
    {
        if (id <= 0) return BadRequest();
        var result = await _service.ReadOrDefaultAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>
    /// Create a new entity.
    /// </summary>
    [HttpPost]
    [TenantWrite]
    [Produces(typeof({Entity}Model))]
    [EndpointDescription("Creates a new entity.")]
    public async Task<ActionResult> Post({Entity}Model model)
    {
        if (model is null) return BadRequest();
        var (userId, tenantId, groupId) = User.GetUserIdentifiers();
        var result = await _service.CreateAsync(userId, tenantId, groupId, model);
        return Ok(result);
    }

    // Update an entity
    [HttpPut]
    [TenantWrite]
    [Produces(typeof({Entity}Model))]
    [EndpointDescription("Updates an existing entity.")]
    public async Task<ActionResult> Put({Entity}Model model)
    {
        if (model is null) return BadRequest();
        var result = await _service.UpdateAsync(model);
        return result is null ? NotFound() : Ok(result);
    }

    // Delete an entity
    [HttpDelete("{id:long}")]
    [TenantWrite]
    [EndpointDescription("Deletes an entity.")]
    public async Task<ActionResult> Delete(long id)
    {
        if (id <= 0) return BadRequest();
        var succeeded = await _service.DeleteAsync(id);
        return succeeded ? NoContent() : NotFound();
    }
}
```

### RLS Attributes

| Attribute | Use For | Effect |
|-----------|---------|--------|
| `[TenantRead]` | GET operations | Sets read-only RLS context |
| `[TenantWrite]` | POST, PUT, DELETE | Sets read-write RLS context |

### Identity Extraction

```csharp
// Single values
Guid userId = User.GetNameIdentifier();
Guid tenantId = User.GetTenantId();
Guid groupId = User.GetGroupId();

// Tuple shorthand
var (userId, tenantId, groupId) = User.GetUserIdentifiers();
```

### Adding Endpoints

When adding new controller actions:

1. Choose appropriate HTTP verb and route
2. Add `[TenantRead]` or `[TenantWrite]` attribute
3. Add `[Produces(typeof(...))]` for documentation
4. Validate input parameters
5. Call service method
6. Return appropriate status code

### Manual Guard Pattern

For complex read-then-write operations:

```csharp
[HttpPut("complex")]
public async Task<ActionResult> ComplexUpdate(Model model, [FromServices] IRequestDbGuard guard)
{
    await guard.EnsureReadAsync();
    var exists = await _service.ReadOrDefaultAsync(model.Id);
    if (exists is null) return NotFound();
    
    await guard.EnsureWriteAsync();
    var result = await _service.UpdateAsync(model);
    return Ok(result);
}
```

## Backlink

- [Server Feature Template](../../../patterns/server/server-feature-template.md) - Complete examples
- [RLS Patterns](../../../patterns/server/rls-patterns.md) - Full RLS documentation
