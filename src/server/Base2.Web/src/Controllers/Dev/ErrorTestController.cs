using Microsoft.Extensions.Localization;

using Base2.Exceptions;

namespace Base2.Web.Controllers.Dev;

/// <summary>
/// Test controller for error handling system.
/// Simulates all error types for client development and testing.
/// DEVELOPMENT ONLY - Remove or disable in production.
/// </summary>
[ApiController]
[Route("api/dev/error-test")]
public class ErrorTestController(IStringLocalizer<ErrorTestController> localizer) : ControllerBase
{
    private readonly IStringLocalizer<ErrorTestController> _localizer = localizer;

    /// <summary>
    /// Returns a list of all available test scenarios.
    /// </summary>
    [HttpGet("scenarios")]
    [ProducesResponseType(typeof(List<ErrorScenario>), 200)]
    public ActionResult<List<ErrorScenario>> GetScenarios()
    {
        return Ok(new List<ErrorScenario>
        {
            new("validation-error", "Validation Error", "Simulates form validation failure with field errors", "POST"),
            new("not-found", "Not Found (404)", "Simulates resource not found", "GET"),
            new("duplicate-error", "Duplicate/Conflict (409)", "Simulates creating duplicate resource", "POST"),
            new("business-rule", "Business Rule Violation", "Simulates business logic constraint", "POST"),
            new("provider-error", "External Service Error", "Simulates third-party service failure", "POST"),
            new("internal-error", "Internal Server Error (500)", "Simulates unexpected server error", "GET"),
            new("auth-error", "Authentication Error (401)", "Simulates authentication failure", "GET"),
            new("permission-denied", "Permission Denied (403)", "Simulates authorization failure", "GET"),
            new("rate-limit", "Rate Limit Exceeded (429)", "Simulates rate limiting", "POST"),
        });
    }

    /// <summary>
    /// Test validation error with field-level errors.
    /// Includes server-side validation rules that differ from client-side Zod validation.
    /// </summary>
    [HttpPost("validation-error")]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    public ActionResult TestValidationError([FromBody] TestFormModel model)
    {
        var errors = new Dictionary<string, object>();

        // Basic required field validation
        if (string.IsNullOrWhiteSpace(model.Email))
        {
            errors["email"] = "Email is required";
        }
        else if (!model.Email.Contains('@'))
        {
            errors["email"] = "Email must be a valid email address";
        }
        else if (model.Email.EndsWith("@blocked.com", StringComparison.OrdinalIgnoreCase))
        {
            // Server-side rule: Blocked domain (Zod won't catch this!)
            errors["email"] = "This email domain is not allowed";
        }
        else if (model.Email.Length > 50)
        {
            // Server-side rule: Max length (if Zod allows longer)
            errors["email"] = "Email must not exceed 50 characters";
        }

        if (string.IsNullOrWhiteSpace(model.FirstName))
        {
            errors["firstName"] = "First name is required";
        }
        else if (model.FirstName.Length > 30)
        {
            // Server-side rule: Max length
            errors["firstName"] = "First name must not exceed 30 characters";
        }

        if (string.IsNullOrWhiteSpace(model.LastName))
        {
            errors["lastName"] = "Last name is required";
        }
        else if (model.LastName.Length > 30)
        {
            // Server-side rule: Max length
            errors["lastName"] = "Last name must not exceed 30 characters";
        }

        if (model.Age.HasValue)
        {
            if (model.Age < 0)
            {
                errors["age"] = "Age must be a positive number";
            }
            else if (model.Age > 120)
            {
                // Server-side rule: Max age (Zod allows any positive number!)
                errors["age"] = "Age must not exceed 120 years";
            }
        }

        if (errors.Count > 0)
        {
            throw new InputValidationException(
                _localizer["Validation failed for one or more fields"],
                errors);
        }

        return Ok(new { success = true, message = "Validation passed!" });
    }

    /// <summary>
    /// Test resource not found error.
    /// </summary>
    [HttpGet("not-found")]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    public ActionResult TestNotFound([FromQuery] int? id)
    {
        var resourceId = id ?? 12345;
        throw new ResourceNotFoundException(
            _localizer["Contact with ID {0} was not found", resourceId]);
    }

    /// <summary>
    /// Test duplicate/conflict error.
    /// </summary>
    [HttpPost("duplicate-error")]
    [ProducesResponseType(typeof(ProblemDetails), 409)]
    public ActionResult TestDuplicate([FromBody] TestFormModel? model = null)
    {
        var email = !string.IsNullOrWhiteSpace(model?.Email)
            ? model.Email
            : "john.doe@example.com";

        throw new ResourceConflictException(
            _localizer["A contact with email '{0}' already exists", email]);
    }

    /// <summary>
    /// Test business rule violation.
    /// </summary>
    [HttpPost("business-rule")]
    [ProducesResponseType(typeof(ProblemDetails), 422)]
    public ActionResult TestBusinessRule([FromBody] TestFormModel? model = null)
    {
        var contactName = !string.IsNullOrWhiteSpace(model?.FirstName)
            ? $"{model.FirstName} {model.LastName}".Trim()
            : "John Doe";

        throw new BusinessRuleViolationException(
            _localizer["Cannot delete contact '{0}' because they are enrolled in 3 active sequences", contactName]);
    }

    /// <summary>
    /// Test external service error.
    /// </summary>
    [HttpPost("provider-error")]
    [ProducesResponseType(typeof(ProblemDetails), 422)]
    public ActionResult TestProviderError([FromQuery] string provider = "Office365")
    {
        throw new ExternalServiceException(
            _localizer["Failed to send email via {0}. The service returned: 'Invalid access token'", provider]);
    }

    /// <summary>
    /// Test internal server error (simulates unhandled exception).
    /// </summary>
    [HttpGet("internal-error")]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public ActionResult TestInternalError([FromQuery] string? trigger)
    {
        // Simulate different types of internal errors
        return trigger?.ToLower() switch
        {
            "nullref" => throw new NullReferenceException("Simulated null reference at line 42 in UserService.ProcessData()"),
            "argument" => throw new ArgumentException("Invalid argument: expected positive integer, got -1"),
            "invalidop" => throw new InvalidOperationException("Cannot perform operation: database connection is closed"),
            _ => throw new Exception("Simulated unexpected server error in ErrorTestController.TestInternalError()")
        };
    }

    /// <summary>
    /// Test authentication error.
    /// </summary>
    [HttpGet("auth-error")]
    [ProducesResponseType(typeof(ProblemDetails), 401)]
    public ActionResult TestAuthError()
    {
        // In production, this would come from authentication middleware
        // For testing, we'll return 401 with a Problem Details response
        return Unauthorized(new ProblemDetails
        {
            Status = 401,
            Title = "Unauthorized",
            Detail = _localizer["Your session has expired. Please log in again."],
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.2",
            Instance = HttpContext.Request.Path,
            Extensions =
            {
                ["errorCode"] = ApiErrorCode.authentication_error.ToString(),
                ["requestId"] = HttpContext.TraceIdentifier,
                ["timestamp"] = DateTime.UtcNow
            }
        });
    }

    /// <summary>
    /// Test authorization/permission error.
    /// </summary>
    [HttpGet("permission-denied")]
    [ProducesResponseType(typeof(ProblemDetails), 403)]
    public ActionResult TestPermissionDenied([FromQuery] string resource = "contacts")
    {
        return StatusCode(403, new ProblemDetails
        {
            Status = 403,
            Title = "Forbidden",
            Detail = _localizer["You do not have permission to access {0}", resource],
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.4",
            Instance = HttpContext.Request.Path,
            Extensions =
            {
                ["errorCode"] = ApiErrorCode.permission_denied.ToString(),
                ["requestId"] = HttpContext.TraceIdentifier,
                ["timestamp"] = DateTime.UtcNow
            }
        });
    }

    /// <summary>
    /// Test rate limit error.
    /// </summary>
    [HttpPost("rate-limit")]
    [ProducesResponseType(typeof(ProblemDetails), 429)]
    public ActionResult TestRateLimit()
    {
        Response.Headers["Retry-After"] = "60";

        return StatusCode(429, new ProblemDetails
        {
            Status = 429,
            Title = "Too Many Requests",
            Detail = _localizer["Rate limit exceeded. Please try again in 60 seconds."],
            Type = "https://tools.ietf.org/html/rfc9110#section-15.5.30",
            Instance = HttpContext.Request.Path,
            Extensions =
            {
                ["errorCode"] = ApiErrorCode.rate_limit_exceeded.ToString(),
                ["requestId"] = HttpContext.TraceIdentifier,
                ["timestamp"] = DateTime.UtcNow,
                ["retryAfter"] = 60
            }
        });
    }

    /// <summary>
    /// Test multiple scenarios with query parameter.
    /// Useful for quick testing without switching endpoints.
    /// </summary>
    [HttpPost("trigger")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    [ProducesResponseType(typeof(ProblemDetails), 409)]
    [ProducesResponseType(typeof(ProblemDetails), 422)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public ActionResult TriggerScenario(
        [FromQuery] string scenario,
        [FromBody] TestFormModel? model = null)
    {
        return scenario.ToLower() switch
        {
            "validation" => TestValidationError(model ?? new TestFormModel()),
            "not-found" => TestNotFound(null),
            "duplicate" => TestDuplicate(model ?? new TestFormModel()),
            "business-rule" => TestBusinessRule(model ?? new TestFormModel()),
            "provider" => TestProviderError("Office365"),
            "internal" => TestInternalError(null),
            "auth" => TestAuthError(),
            "permission" => TestPermissionDenied("contacts"),
            "rate-limit" => TestRateLimit(),
            _ => throw new ArgumentException($"Unknown scenario: {scenario}")
        };
    }

    /// <summary>
    /// Test successful response (control/baseline).
    /// </summary>
    [HttpPost("success")]
    [ProducesResponseType(typeof(SuccessResponse), 200)]
    public ActionResult<SuccessResponse> TestSuccess([FromBody] TestFormModel model)
    {
        return Ok(new SuccessResponse
        {
            Success = true,
            Message = $"Successfully processed form for {model.FirstName} {model.LastName}",
            Data = model
        });
    }

    /// <summary>
    /// Test delayed response (for loading states).
    /// </summary>
    [HttpGet("delay")]
    [ProducesResponseType(typeof(object), 200)]
    public async Task<ActionResult> TestDelay([FromQuery] int milliseconds = 3000)
    {
        await Task.Delay(Math.Min(milliseconds, 10000)); // Max 10 seconds
        return Ok(new { success = true, delayed = milliseconds });
    }
}

public record ErrorScenario(string Id, string Name, string Description, string Method);

public class TestFormModel
{
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Company { get; set; }
    public int? Age { get; set; }
}

public class SuccessResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public object? Data { get; set; }
}
