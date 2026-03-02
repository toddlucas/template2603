using Microsoft.EntityFrameworkCore;
using Base2.Data;

namespace Base2.Desktop;

internal static class WebApplicationExtensions
{
    /// <summary>
    /// Applies any pending EF Core migrations to the local SQLite database.
    /// Creates the database file if it does not exist.
    /// </summary>
    internal static async Task MigrateDesktopDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var appDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await appDb.Database.MigrateAsync();
    }
}
