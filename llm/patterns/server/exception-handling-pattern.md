# Server Exception Handling Pattern

## Overview

This document describes the exception handling strategy for the Product Name API. The pattern ensures that:
- User-facing errors are localized and safe to display
- Internal errors are logged but hidden from users
- All errors follow RFC 9110 Problem Details format
- Error codes are type-safe and exported to TypeScript

## Architecture

### Three-Tier Approach

1. **Custom Exception Types** (`Base2.Common/src/Exceptions/`)
   - Domain-specific exceptions that inherit from `UserFacingException`
   - Always contain localized messages via `IStringLocalizer`
   - Include typed `ApiErrorCode` enum values

2. **Global Exception Handler** (`Base2.Web/src/Middleware/GlobalExceptionHandler.cs`)
   - Catches all unhandled exceptions
   - Transforms user-facing exceptions into Problem Details responses
   - Logs internal exceptions and returns generic messages

3. **TypeScript Error Codes** (auto-generated via TypeGen)
   - `ApiErrorCode` enum exported as string union type
   - Enables type-safe error handling in client code

---

## Exception Types

### Base Class: `UserFacingException`

All user-facing exceptions inherit from this abstract base class:

```csharp
public abstract class UserFacingException : Exception
{
    public string LocalizedMessage { get; }
    public ApiErrorCode ErrorCode { get; }
    public Dictionary<string, object>? Details { get; init; }
    public abstract int StatusCode { get; }
}
```

**Key Properties:**
- `LocalizedMessage`: Safe for display to end users (from `IStringLocalizer`)
- `ErrorCode`: Typed enum value for client-side handling
- `Details`: Optional field-level errors (e.g., validation errors)
- `StatusCode`: HTTP status code to return

### Available Exception Types

| Exception | HTTP Status | Error Code | Use Case |
|-----------|-------------|------------|----------|
| `InputValidationException` | 400 | `validation_error` | User input validation failures |
| `ResourceNotFoundException` | 404 | `not_found` | Requested resource doesn't exist |
| `ResourceConflictException` | 409 | `duplicate_error` | Duplicate data (e.g., email exists) |
| `BusinessRuleViolationException` | 422 | `business_rule_violation` | Business logic violations |
| `ExternalServiceException` | 422 | `provider_error` | External service failures |

### ApiErrorCode Enum

```csharp
public enum ApiErrorCode
{
    validation_error,
    not_found,
    duplicate_error,
    business_rule_violation,
    provider_error,
    ai_processing_error,
    authentication_error,
    permission_denied,
    rate_limit_exceeded,
    internal_error,
    service_unavailable,
}
```

**Naming Convention:** Use `snake_case` for enum values (matches REST API conventions).

---

## Usage Patterns

### 1. Simple Validation Error

```csharp
public class ContactService(
    WarehouseDbContext dbContext,
    IStringLocalizer<ProspectingServiceResource> localizer,
    ILogger<ContactService> logger)
{
    public async Task<ContactModel> CreateAsync(ContactModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Email))
        {
            throw new InputValidationException(_localizer["Email is required."]);
        }
        
        // ... create contact
    }
}
```

### 2. Field-Level Validation Errors

```csharp
var errors = new Dictionary<string, object>();

if (string.IsNullOrWhiteSpace(model.Email))
{
    errors["email"] = _localizer["Email is required."];
}

if (string.IsNullOrWhiteSpace(model.FirstName))
{
    errors["firstName"] = _localizer["First name is required."];
}

if (errors.Count > 0)
{
    throw new InputValidationException(_localizer["Validation failed."], errors);
}
```

### 3. Resource Not Found

```csharp
var contact = await _dbSet.FindAsync(id);
if (contact == null)
{
    throw new ResourceNotFoundException(_localizer["Contact not found."]);
}
```

### 4. Duplicate Resource

```csharp
var existingContact = await _dbSet
    .FirstOrDefaultAsync(c => c.Email == model.Email);

if (existingContact != null)
{
    throw new ResourceConflictException(
        _localizer["A contact with email '{0}' already exists.", model.Email]);
}
```

### 5. Business Rule Violation

```csharp
if (sequence.StatusId != nameof(SequenceStatus.draft))
{
    throw new BusinessRuleViolationException(
        _localizer["Cannot modify an active sequence. Pause it first."]);
}
```

### 6. External Service Error

```csharp
try
{
    await _emailProvider.SendAsync(message);
}
catch (Exception ex)
{
    throw new ExternalServiceException(
        _localizer["Failed to send email. Please check your email provider configuration."],
        ex);
}
```

---

## Response Format

All errors return RFC 9110 Problem Details format:

### User-Facing Exception Response

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.4.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Email is required.",
  "instance": "/api/prospecting/contact",
  "errorCode": "validation_error",
  "requestId": "0HN7GKQJ9K8F2",
  "timestamp": "2025-12-27T10:30:00Z"
}
```

### Validation Error with Field Details

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.4.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed.",
  "instance": "/api/prospecting/contact",
  "errorCode": "validation_error",
  "errors": {
    "email": "Email is required.",
    "firstName": "First name is required."
  },
  "requestId": "0HN7GKQJ9K8F2",
  "timestamp": "2025-12-27T10:30:00Z"
}
```

### Internal Error Response (Production)

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred. Please try again later.",
  "instance": "/api/prospecting/contact",
  "errorCode": "internal_error",
  "requestId": "0HN7GKQJ9K8F2",
  "timestamp": "2025-12-27T10:30:00Z"
}
```

### Internal Error Response (Development)

In development mode, additional exception details are included:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred. Please try again later.",
  "instance": "/api/prospecting/contact",
  "errorCode": "internal_error",
  "requestId": "0HN7GKQJ9K8F2",
  "timestamp": "2025-12-27T10:30:00Z",
  "exception": {
    "type": "System.NullReferenceException",
    "message": "Object reference not set to an instance of an object.",
    "stackTrace": "   at Base2.Prospecting.ContactService..."
  }
}
```

---

## TypeScript Integration

The `ApiErrorCode` enum is automatically exported to TypeScript as a string union:

```typescript
// Generated: client/common/src/models/errors/api-error-code.ts
export type ApiErrorCode = 
  | "validation_error"
  | "not_found"
  | "duplicate_error"
  | "business_rule_violation"
  | "provider_error"
  | "ai_processing_error"
  | "authentication_error"
  | "permission_denied"
  | "rate_limit_exceeded"
  | "internal_error"
  | "service_unavailable";
```

### Client-Side Error Handling

```typescript
import { ApiErrorCode } from '@/models/errors/api-error-code';

try {
  await contactApi.create(contact);
} catch (error) {
  const { errorCode, detail, errors, requestId } = error.response?.data || {};
  
  // Check if this is an internal error (generic fallback)
  if (errorCode === 'internal_error') {
    // Generic error - show generic UI, don't display detail verbatim
    toast.error('Something went wrong. Please try again.');
    console.error('Request ID:', requestId); // Log for support
    return;
  }
  
  // Specific business error - safe to display detail message
  if (errorCode === 'validation_error') {
    // Handle validation errors
    if (errors) {
      // Display field-level errors
      Object.entries(errors).forEach(([field, message]) => {
        setFieldError(field, message);
      });
    } else {
      toast.error(detail);
    }
  } else if (errorCode === 'duplicate_error') {
    // Handle duplicate - detail is safe to display
    toast.error(detail);
  } else {
    // Other specific errors - detail is safe to display
    toast.error(detail);
  }
}
```

**Key Pattern:** 
- `errorCode === 'internal_error'` → Generic error, show generic UI
- `errorCode !== 'internal_error'` → Specific error, safe to display `detail` message

All messages are localized (both specific and generic), but internal errors should be displayed generically to avoid exposing implementation details.

---

## Localization

### Resource Files

User-facing messages are stored in `.resx` files:

**File:** `Base2.Services/src/Resources/Base2.Prospecting.ProspectingServiceResource.resx`

```xml
<data name="Email is required.">
  <value>Email is required.</value>
</data>
<data name="A contact with email '{0}' already exists.">
  <value>A contact with email '{0}' already exists.</value>
</data>
```

**French:** `ProspectingServiceResource.fr.resx`

```xml
<data name="Email is required.">
  <value>L'email est requis.</value>
</data>
<data name="A contact with email '{0}' already exists.">
  <value>Un contact avec l'email '{0}' existe déjà.</value>
</data>
```

### Injecting IStringLocalizer

```csharp
public class ContactService(
    WarehouseDbContext dbContext,
    IStringLocalizer<ProspectingServiceResource> localizer,
    ILogger<ContactService> logger)
{
    private readonly IStringLocalizer _localizer = localizer;
    
    // Use _localizer["Key"] or _localizer["Key with {0} param", value]
}
```

---

## Best Practices

### ✅ DO

- **Always localize user-facing messages** using `IStringLocalizer`
- **Use specific exception types** (not generic `Exception` or `InvalidOperationException`)
- **Include context in messages** (e.g., "Contact with email 'john@example.com' already exists")
- **Log exceptions** before throwing user-facing exceptions (if needed for debugging)
- **Add field-level errors** for validation failures
- **Use snake_case** for `ApiErrorCode` enum values

### ❌ DON'T

- **Don't expose internal details** in user-facing messages (no stack traces, SQL errors, etc.)
- **Don't use generic exceptions** for expected error cases
- **Don't hardcode error messages** - always use `IStringLocalizer`
- **Don't throw exceptions for control flow** in controllers (use Result<T> pattern if needed)
- **Don't localize log messages** - logs should always be in English

---

## Controller Pattern

Controllers should **not** catch user-facing exceptions - let the global handler process them:

```csharp
// ✅ GOOD: Let exceptions bubble up to global handler
[HttpPost]
public async Task<ActionResult> Create([FromBody] ContactModel model)
{
    if (model is null) return BadRequest();
    
    var (userId, tenantId, groupId) = User.GetUserIdentifiers();
    var result = await _service.CreateAsync(userId, tenantId, groupId, model);
    return Ok(result);
}

// ❌ BAD: Don't catch user-facing exceptions in controllers
[HttpPost]
public async Task<ActionResult> Create([FromBody] ContactModel model)
{
    try
    {
        var result = await _service.CreateAsync(...);
        return Ok(result);
    }
    catch (InputValidationException ex)
    {
        return BadRequest(ex.Message); // Don't do this!
    }
}
```

**Exception:** Only catch exceptions in controllers if you need to perform specific cleanup or logging that the global handler can't provide.

---

## Testing

### Unit Test Example

```csharp
[Fact]
public async Task CreateAsync_DuplicateEmail_ThrowsResourceConflictException()
{
    // Arrange
    var existingContact = await CreateTestContactAsync("test@example.com");
    var newContact = new ContactModel { Email = "test@example.com" };
    
    // Act & Assert
    var exception = await Assert.ThrowsAsync<ResourceConflictException>(
        () => _service.CreateAsync(_userId, _tenantId, _groupId, newContact));
    
    Assert.Contains("already exists", exception.LocalizedMessage);
    Assert.Equal(ApiErrorCode.duplicate_error, exception.ErrorCode);
}
```

---

## Migration Guide

### Converting Existing Code

**Before:**
```csharp
throw new InvalidOperationException($"A contact with email '{model.Email}' already exists.");
```

**After:**
```csharp
throw new ResourceConflictException(
    _localizer["A contact with email '{0}' already exists.", model.Email]);
```

**Before:**
```csharp
throw new ArgumentException("Only CSV files are accepted.", nameof(file));
```

**After:**
```csharp
throw new InputValidationException(_localizer["Only CSV files are accepted."]);
```

---

## Summary

This exception handling pattern provides:
- ✅ **Type-safe error codes** exported to TypeScript
- ✅ **Localized error messages** for international users
- ✅ **Security** by hiding internal errors from users
- ✅ **Consistency** via RFC 9110 Problem Details format
- ✅ **Traceability** with request IDs for log correlation
- ✅ **Developer experience** with detailed errors in development mode

All new code should follow this pattern. Existing code will be migrated incrementally.

