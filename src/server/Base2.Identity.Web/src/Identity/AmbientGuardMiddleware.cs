using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

using Base2.Data.Identity;

namespace Base2.Web.Identity;

/// <summary>
/// ASP.NET Core middleware that sets up ambient database guards for each request.
/// This enables Metalama aspects to access guards without dependency injection.
/// Supports multiple database contexts (e.g., AppDbContext and AppDbContext).
/// </summary>
public sealed class AmbientGuardMiddleware
{
    private readonly RequestDelegate _next;

    public AmbientGuardMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    /// <summary>
    /// Invokes the middleware to set up ambient guards for the current request.
    /// </summary>
    public async Task InvokeAsync(HttpContext context)
    {
        // Resolve all registered database guards by their DbContext type names
        var guards = new Dictionary<string, IRequestDbGuard>();

        // Try to resolve each known database guard
        // Keys use nameof(DbContextType) pattern for type safety

        // AppDbContext (OLTP)
        var appGuard = context.RequestServices.GetKeyedService<IRequestDbGuard>("AppDbContext");
        if (appGuard != null)
            guards["AppDbContext"] = appGuard;

        // WarehouseDbContext (OLAP)
        var warehouseGuard = context.RequestServices.GetKeyedService<IRequestDbGuard>("WarehouseDbContext");
        if (warehouseGuard != null)
            guards["WarehouseDbContext"] = warehouseGuard;

        // Set all guards as ambient for this request
        using (AmbientRequestGuard.UseMultiple(guards))
        {
            // Continue to the next middleware/controller
            await _next(context);
        }

        // The guards will be disposed automatically when the request scope ends
    }
}
