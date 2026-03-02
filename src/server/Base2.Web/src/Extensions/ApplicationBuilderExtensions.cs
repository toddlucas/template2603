using Base2.Data;

namespace Base2.Web.Extensions;

/// <summary>
/// Extension methods for IApplicationBuilder to support database initialization.
/// </summary>
public static class ApplicationBuilderExtensions
{
    /// <summary>
    /// Initializes in-memory databases if in-memory mode is enabled.
    /// This ensures database schemas are created using EnsureCreated() for in-memory SQLite databases.
    /// </summary>
    /// <param name="app">The application builder.</param>
    /// <returns>The application builder for method chaining.</returns>
    public static IApplicationBuilder UseInMemoryDatabaseInitialization(this IApplicationBuilder app)
    {
        // Get configuration from services
        var configuration = app.ApplicationServices.GetRequiredService<IConfiguration>();

        // Only initialize if in-memory mode is enabled
        if (configuration.IsInMemoryDatabaseEnabled())
        {
            using var scope = app.ApplicationServices.CreateScope();
            var appDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var warehouseDb = scope.ServiceProvider.GetRequiredService<WarehouseDbContext>();

            appDb.Database.EnsureCreated();
            warehouseDb.Database.EnsureCreated();
        }

        return app;
    }
}

