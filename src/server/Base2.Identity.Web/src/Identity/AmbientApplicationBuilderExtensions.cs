using Base2.Web.Identity;

namespace Microsoft.AspNetCore.Builder;

/// <summary>
/// Extension methods for IApplicationBuilder to configure tenant context middleware.
/// </summary>
public static class AmbientApplicationBuilderExtensions
{
    /// <summary>
    /// Adds the ambient guard middleware to the application pipeline.
    /// This middleware sets up the ambient database guard for each request, enabling Metalama aspects.
    /// </summary>
    public static IApplicationBuilder UseAmbientGuard(this IApplicationBuilder app)
    {
        return app.UseMiddleware<AmbientGuardMiddleware>();
    }
}
