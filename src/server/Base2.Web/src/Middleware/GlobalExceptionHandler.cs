using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;

using Base2.Exceptions;
using Base2.Localization;

namespace Base2.Web.Middleware;

/// <summary>
/// Global exception handler that transforms exceptions into standardized Problem Details responses.
/// User-facing exceptions return localized messages. Internal exceptions are logged and return generic messages.
/// </summary>
/// <remarks>
/// This handler is registered via IExceptionHandler and integrates with ASP.NET Core's UseExceptionHandler middleware.
/// It provides:
/// - Localized error messages for UserFacingException types
/// - Generic error messages for unexpected exceptions (hiding implementation details)
/// - Structured Problem Details responses (RFC 9110)
/// - Request traceability via request IDs
/// - Development-mode exception details for debugging
/// </remarks>
public class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IStringLocalizer<WebServiceResource> localizer) : IExceptionHandler
{
    private readonly ILogger _logger = logger;
    private readonly IStringLocalizer _localizer = localizer;

    /// <summary>
    /// Attempts to handle the exception by converting it to a Problem Details response.
    /// </summary>
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        // For user-facing exceptions, return the localized message
        if (exception is UserFacingException userFacingException)
        {
            await HandleUserFacingExceptionAsync(httpContext, userFacingException, cancellationToken);
            return true;
        }

        // For any other exception, log the full details but return a generic message
        await HandleUnexpectedExceptionAsync(httpContext, exception, cancellationToken);
        return true;
    }

    private async Task HandleUserFacingExceptionAsync(
        HttpContext httpContext,
        UserFacingException exception,
        CancellationToken cancellationToken)
    {
        _logger.LogWarning(exception,
            "User-facing exception: {ErrorCode} - {Message}",
            exception.ErrorCode,
            exception.LocalizedMessage);

        var problemDetails = new ProblemDetails
        {
            Type = GetTypeUri(exception.StatusCode),
            Title = GetTitleForStatusCode(exception.StatusCode),
            Status = exception.StatusCode,
            Detail = exception.LocalizedMessage,
            Instance = httpContext.Request.Path
        };

        // Add error code (as string for TypeScript consumption)
        problemDetails.Extensions["errorCode"] = exception.ErrorCode.ToString();

        // Add field-level errors if present
        if (exception.Details != null && exception.Details.Count > 0)
        {
            problemDetails.Extensions["errors"] = exception.Details;
        }

        // Add request ID for traceability
        problemDetails.Extensions["requestId"] = httpContext.TraceIdentifier;
        problemDetails.Extensions["timestamp"] = DateTime.UtcNow;

        httpContext.Response.StatusCode = exception.StatusCode;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
    }

    private async Task HandleUnexpectedExceptionAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception,
            "Unhandled exception occurred while processing request {Method} {Path}",
            httpContext.Request.Method,
            httpContext.Request.Path);

        var problemDetails = new ProblemDetails
        {
            Type = GetTypeUri(500),
            Title = "Internal Server Error",
            Status = StatusCodes.Status500InternalServerError,
            Detail = _localizer["An unexpected error occurred. Please try again later."],
            Instance = httpContext.Request.Path,
            Extensions =
            {
                ["errorCode"] = ApiErrorCode.internal_error.ToString(),
                ["requestId"] = httpContext.TraceIdentifier,
                ["timestamp"] = DateTime.UtcNow
            }
        };

        // In development, include exception details for debugging
        var environment = httpContext.RequestServices.GetRequiredService<IHostEnvironment>();
        if (environment.IsDevelopment())
        {
            problemDetails.Extensions["exception"] = new
            {
                type = exception.GetType().FullName,
                message = exception.Message,
                stackTrace = exception.StackTrace
            };
        }

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
    }

    private static string GetTypeUri(int statusCode)
    {
        // RFC 9110 URIs for standard HTTP status codes
        int section = statusCode switch
        {
            >= 400 and < 500 => 4,
            >= 500 and < 600 => 5,
            _ => 15
        };
        
        int subsection = (statusCode / 100) == section ? (statusCode % 100) : 0;
        
        return $"https://tools.ietf.org/html/rfc9110#section-15.{section}.{subsection}";
    }

    private static string GetTitleForStatusCode(int statusCode)
    {
        return statusCode switch
        {
            400 => "Bad Request",
            401 => "Unauthorized",
            403 => "Forbidden",
            404 => "Not Found",
            409 => "Conflict",
            422 => "Unprocessable Entity",
            429 => "Too Many Requests",
            500 => "Internal Server Error",
            503 => "Service Unavailable",
            _ => "Error"
        };
    }
}

