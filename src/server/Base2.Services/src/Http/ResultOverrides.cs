using Microsoft.AspNetCore.Mvc;

namespace Microsoft.AspNetCore.Http;

/// <summary>
/// ProblemDetails overrides for specific scenarios.
/// </summary>
public partial class Result
{
    /// <summary>
    /// Produces a <see cref="ProblemDetails"/> response for 400 Bad Request.
    /// </summary>
    /// <param name="ex">The debug value for <see cref="ProblemDetails.Detail" />.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
    /// <remarks>Returns exception details in debug mode.</remarks>
    public static ActionResult BadRequest(
        Exception? ex = null)
    {
        return BadRequest(title: null!, ex);
    }

    /// <summary>
    /// Produces a <see cref="ProblemDetails"/> response for 400 Bad Request.
    /// </summary>
    /// <param name="title">The title for for <see cref="ProblemDetails.Detail" />.</param>
    /// <param name="ex">The debug value for <see cref="ProblemDetails.Detail" />.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
    /// <remarks>Returns exception details in debug mode.</remarks>
    public static ActionResult BadRequest(
        string title,
        Exception? ex = null)
    {
#if DEBUG
        return Problem(title: title, statusCode: 400, detail: ex?.Message, type: ProblemType.BadRequest);
#else
        return Problem(title: title, statusCode: 400, type: ProblemType.BadRequest);
#endif
    }

    /// <summary>
    /// Produces a <see cref="ProblemDetails"/> response for 404 Not Found.
    /// </summary>
    /// <param name="ex">The debug value for <see cref="ProblemDetails.Detail" />.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
    /// <remarks>Returns exception details in debug mode.</remarks>
    public static ActionResult NotFound(
        Exception? ex = null)
    {
        return NotFound(title: null!, ex);
    }

    /// <summary>
    /// Produces a <see cref="ProblemDetails"/> response for 404 Not Found.
    /// </summary>
    /// <param name="title">The title for for <see cref="ProblemDetails.Detail" />.</param>
    /// <param name="ex">The debug value for <see cref="ProblemDetails.Detail" />.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
    /// <remarks>Returns exception details in debug mode.</remarks>
    public static ActionResult NotFound(
        string title,
        Exception? ex = null)
    {
#if DEBUG
        return Problem(title: title, statusCode: 404, detail: ex?.Message, type: ProblemType.NotFound);
#else
        return Problem(title: title, statusCode: 404, type: ProblemType.NotFound);
#endif
    }

    /// <summary>
    /// Produces a <see cref="ProblemDetails"/> response for 409 Conflict.
    /// </summary>
    /// <param name="ex">The debug value for <see cref="ProblemDetails.Detail" />.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
    /// <remarks>Returns exception details in debug mode.</remarks>
    public static ActionResult Conflict(
        Exception? ex = null)
    {
        return Conflict(title: null!, ex);
    }

    /// <summary>
    /// Produces a <see cref="ProblemDetails"/> response for 409 Conflict.
    /// </summary>
    /// <param name="title">The title for for <see cref="ProblemDetails.Detail" />.</param>
    /// <param name="ex">The debug value for <see cref="ProblemDetails.Detail" />.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
    /// <remarks>Returns exception details in debug mode.</remarks>
    public static ActionResult Conflict(
        string title,
        Exception? ex = null)
    {
#if DEBUG
        return Problem(title: title, statusCode: 409, detail: ex?.Message, type: ProblemType.Conflict);
#else
        return Problem(title: title, statusCode: 409, type: ProblemType.Conflict);
#endif
    }

    /// <summary>
    /// Produces a <see cref="ProblemDetails"/> response that mimics the unhandled 500 format.
    /// </summary>
    /// <param name="ex">The debug value for <see cref="ProblemDetails.Detail" />.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
    /// <remarks>Returns exception details in debug mode.</remarks>
    public static ActionResult ServerError(
        Exception ex)
    {
        return ServerError(title: null!, ex);
    }

    /// <summary>
    /// Produces a <see cref="ProblemDetails"/> response that mimics the unhandled 500 format.
    /// </summary>
    /// <param name="title">The title for for <see cref="ProblemDetails.Detail" />.</param>
    /// <param name="ex">The debug value for <see cref="ProblemDetails.Detail" />.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
    /// <remarks>Returns exception details in debug mode.</remarks>
    public static ActionResult ServerError(
        string title,
        Exception ex)
    {
#if DEBUG
        return Problem(title: title, statusCode: 500, detail: ex.Message, type: ProblemType.ServerError);
#else
        return Problem(title: title, statusCode: 500, type: ProblemType.ServerError);
#endif
    }

    /// <summary>
    /// Produces a <see cref="ProblemDetails"/> response for 400 Bad Request.
    /// </summary>
    /// <param name="title">The title for for <see cref="ProblemDetails.Detail" />.</param>
    /// <returns>The created <see cref="ActionResult"/> for the response.</returns>
    public static ActionResult NotImplemented(string title) => BadRequest(title);
}
