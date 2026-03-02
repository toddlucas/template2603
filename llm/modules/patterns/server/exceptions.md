# Server Exceptions Quick Reference

> **Module**: Patterns / Server  
> **Domain**: Error Handling  
> **Token target**: 300-400

## Purpose

Quick reference for using the exception handling system. For detailed documentation, see `llm/patterns/server/exception-handling-pattern.md`.

## Exception Types

| Exception | HTTP | Error Code | Use Case |
|-----------|------|------------|----------|
| `InputValidationException` | 400 | `validation_error` | User input validation |
| `ResourceNotFoundException` | 404 | `not_found` | Resource doesn't exist |
| `ResourceConflictException` | 409 | `duplicate_error` | Duplicate data |
| `BusinessRuleViolationException` | 422 | `business_rule_violation` | Business logic violation |
| `ExternalServiceException` | 422 | `provider_error` | External service failure |

## Usage Patterns

### Simple Validation

```csharp
if (string.IsNullOrWhiteSpace(model.Email))
{
    throw new InputValidationException(_localizer["Email is required."]);
}
```

### Field-Level Validation

```csharp
var errors = new Dictionary<string, object>
{
    ["email"] = _localizer["Email is required."],
    ["firstName"] = _localizer["First name is required."]
};
throw new InputValidationException(_localizer["Validation failed."], errors);
```

### Not Found

```csharp
var contact = await _dbSet.FindAsync(id);
if (contact == null)
{
    throw new ResourceNotFoundException(_localizer["Contact not found."]);
}
```

### Duplicate

```csharp
var existing = await _dbSet.FirstOrDefaultAsync(c => c.Email == model.Email);
if (existing != null)
{
    throw new ResourceConflictException(
        _localizer["A contact with email '{0}' already exists.", model.Email]);
}
```

### Business Rule

```csharp
if (sequence.StatusId != nameof(SequenceStatus.draft))
{
    throw new BusinessRuleViolationException(
        _localizer["Cannot modify an active sequence. Pause it first."]);
}
```

### External Service

```csharp
try
{
    await _emailProvider.SendAsync(message);
}
catch (Exception ex)
{
    throw new ExternalServiceException(
        _localizer["Failed to send email. Please check your configuration."], ex);
}
```

## Key Points

- ✅ **Always use `_localizer`** for user-facing messages
- ✅ **Use specific exception types** (not generic `Exception`)
- ✅ **Let exceptions bubble** up to global handler (don't catch in controllers)
- ❌ **Never expose internal details** in user-facing messages
- ❌ **Never hardcode messages** - always localize

## Service Constructor Pattern

```csharp
public class {Entity}Service(
    WarehouseDbContext dbContext,
    IStringLocalizer<{Namespace}ServiceResource> localizer,
    ILogger<{Entity}Service> logger)
{
    private readonly IStringLocalizer _localizer = localizer;
    // ...
}
```

## Response Format

```json
{
  "status": 409,
  "title": "Conflict",
  "detail": "A contact with email 'john@example.com' already exists.",
  "errorCode": "duplicate_error",
  "requestId": "0HN7GKQJ9K8F2",
  "timestamp": "2025-12-27T10:30:00Z"
}
```

## TypeScript Integration

```typescript
import { ApiErrorCode } from '@/models/errors/api-error-code';

const { errorCode, detail, requestId } = error.response?.data || {};

// Internal error - show generic UI
if (errorCode === 'internal_error') {
  toast.error('Something went wrong. Please try again.');
  console.error('Request ID:', requestId);
  return;
}

// Specific business error - safe to display detail
if (errorCode === 'duplicate_error') {
  toast.error(detail);
}
```

**Pattern:** Check `errorCode` to differentiate:
- `internal_error` → Generic error, show generic UI
- Others → Specific error, safe to display `detail` message

