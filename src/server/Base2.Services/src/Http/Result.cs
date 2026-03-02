using Microsoft.AspNetCore.Mvc;

namespace Microsoft.AspNetCore.Http;

/// <summary>
/// Patterned after Results.
/// </summary>
public partial class Result
{
    /// <summary>
    /// Produces a <see cref="ProblemDetails"/> response.
    /// </summary>
    /// <param name="statusCode">The value for <see cref="ProblemDetails.Status" />.</param>
    /// <param name="detail">The value for <see cref="ProblemDetails.Detail" />.</param>
    /// <param name="instance">The value for <see cref="ProblemDetails.Instance" />.</param>
    /// <param name="title">The value for <see cref="ProblemDetails.Title" />.</param>
    /// <param name="type">The value for <see cref="ProblemDetails.Type" />.</param>
    /// <param name="extensions">The value for <see cref="ProblemDetails.Extensions" />.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
    public static ActionResult Problem(
        string? detail,
        string? instance,
        int? statusCode,
        string? title,
        string? type,
        IDictionary<string, object?>? extensions)
        => CreateProblem(detail, instance, statusCode, title, type, extensions);

    /// <summary>
    /// Produces a <see cref="ProblemDetails"/> response.
    /// </summary>
    /// <param name="statusCode">The value for <see cref="ProblemDetails.Status" />.</param>
    /// <param name="detail">The value for <see cref="ProblemDetails.Detail" />.</param>
    /// <param name="instance">The value for <see cref="ProblemDetails.Instance" />.</param>
    /// <param name="title">The value for <see cref="ProblemDetails.Title" />.</param>
    /// <param name="type">The value for <see cref="ProblemDetails.Type" />.</param>
    /// <param name="extensions">The value for <see cref="ProblemDetails.Extensions" />.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
#pragma warning disable RS0027 // Public API with optional parameter(s) should have the most parameters amongst its public overloads
    public static ActionResult Problem(
#pragma warning restore RS0027 // Public API with optional parameter(s) should have the most parameters amongst its public overloads
        string? detail = null,
        string? instance = null,
        int? statusCode = null,
        string? title = null,
        string? type = null,
        IEnumerable<KeyValuePair<string, object?>>? extensions = null)
        => CreateProblem(detail, instance, statusCode, title, type, extensions);

    /// <summary>
    /// Produces a <see cref="ProblemDetails"/> response.
    /// </summary>
    /// <param name="problemDetails">The <see cref="ProblemDetails"/>  object to produce a response from.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
    public static ActionResult Problem(ProblemDetails problemDetails)
        => CreateProblemResult(problemDetails);

    /// <summary>
    /// Produces a <see cref="StatusCodes.Status400BadRequest"/> response
    /// with a <see cref="HttpValidationProblemDetails"/> value.
    /// </summary>
    /// <param name="errors">One or more validation errors.</param>
    /// <param name="detail">The value for <see cref="ProblemDetails.Detail" />.</param>
    /// <param name="instance">The value for <see cref="ProblemDetails.Instance" />.</param>
    /// <param name="statusCode">The status code.</param>
    /// <param name="title">The value for <see cref="ProblemDetails.Title" />. Defaults to "One or more validation errors occurred."</param>
    /// <param name="type">The value for <see cref="ProblemDetails.Type" />.</param>
    /// <param name="extensions">The value for <see cref="ProblemDetails.Extensions" />.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
    public static ActionResult ValidationProblem(
        IDictionary<string, string[]> errors,
        string? detail,
        string? instance,
        int? statusCode,
        string? title,
        string? type,
        IDictionary<string, object?>? extensions)
        => CreateValidationProblem(errors, detail, instance, statusCode, title, type, extensions);

    /// <summary>
    /// Produces a <see cref="StatusCodes.Status400BadRequest"/> response
    /// with a <see cref="HttpValidationProblemDetails"/> value.
    /// </summary>
    /// <param name="errors">One or more validation errors.</param>
    /// <param name="detail">The value for <see cref="ProblemDetails.Detail" />.</param>
    /// <param name="instance">The value for <see cref="ProblemDetails.Instance" />.</param>
    /// <param name="statusCode">The status code.</param>
    /// <param name="title">The value for <see cref="ProblemDetails.Title" />. Defaults to "One or more validation errors occurred."</param>
    /// <param name="type">The value for <see cref="ProblemDetails.Type" />.</param>
    /// <param name="extensions">The value for <see cref="ProblemDetails.Extensions" />.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
#pragma warning disable RS0027 // Public API with optional parameter(s) should have the most parameters amongst its public overloads
    public static ActionResult ValidationProblem(
#pragma warning restore RS0027 // Public API with optional parameter(s) should have the most parameters amongst its public overloads
        IEnumerable<KeyValuePair<string, string[]>> errors,
        string? detail = null,
        string? instance = null,
        int? statusCode = null,
        string? title = null,
        string? type = null,
        IEnumerable<KeyValuePair<string, object?>>? extensions = null)
        => CreateValidationProblem(errors, detail, instance, statusCode, title, type, extensions);

    public static ActionResult CreateProblemResult(ProblemDetails problemDetails)
    {
        ArgumentNullException.ThrowIfNull(problemDetails);
        return new ObjectResult(problemDetails) { StatusCode = problemDetails.Status };
    }

    public static ActionResult CreateProblem(
        string? detail,
        string? instance,
        int? statusCode,
        string? title,
        string? type,
        IEnumerable<KeyValuePair<string, object?>>? extensions = null)
    {
        // TypedResults.ValidationProblem() does not allow setting the statusCode so we do this manually here
        var problemDetails = new ProblemDetails
        {
            Detail = detail,
            Instance = instance,
            Type = type,
            Status = statusCode,
        };

        problemDetails.Title = title ?? problemDetails.Title;

        CopyExtensions(extensions, problemDetails);

        ApplyProblemDetailsDefaultsIfNeeded(problemDetails, statusCode);

        return CreateProblemResult(problemDetails);
    }

    public static ActionResult CreateValidationProblemResult(ValidationProblemDetails problemDetails)
    {
        ArgumentNullException.ThrowIfNull(problemDetails);
        return new ObjectResult(problemDetails) { StatusCode = problemDetails.Status };
    }

    public static ActionResult CreateValidationProblem(
        IEnumerable<KeyValuePair<string, string[]>> errors,
        string? detail,
        string? instance,
        int? statusCode,
        string? title,
        string? type,
        IEnumerable<KeyValuePair<string, object?>>? extensions = null)
    {
        ArgumentNullException.ThrowIfNull(errors);

        var problemDetails = new ValidationProblemDetails
        {
            Detail = detail,
            Instance = instance,
            Type = type,
            Status = statusCode,
            Errors = new Dictionary<string, string[]>(),
        };

        problemDetails.Title = title ?? problemDetails.Title;

        CopyExtensions(extensions, problemDetails);

        foreach (var error in errors)
        {
            problemDetails.Errors.Add(error);
        }

        ApplyProblemDetailsDefaultsIfNeeded(problemDetails, statusCode);

        return CreateValidationProblemResult(problemDetails);
    }

    private static void ApplyProblemDetailsDefaultsIfNeeded(object? value, int? statusCode)
    {
        if (value is ProblemDetails problemDetails)
        {
            ProblemDetailsDefaults.Apply(problemDetails, statusCode);
        }
    }

    private static void CopyExtensions(IEnumerable<KeyValuePair<string, object?>>? extensions, ProblemDetails problemDetails)
    {
        if (extensions is not null)
        {
            foreach (var extension in extensions)
            {
                problemDetails.Extensions.Add(extension);
            }
        }
    }
}
