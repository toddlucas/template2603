using System.Text.Json.Serialization;

using Scalar.AspNetCore;

using Base2.Desktop;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile(
    $"appsettings.{builder.Environment.EnvironmentName}.local.json",
    optional: true,
    reloadOnChange: false);

// Bind to localhost only — the sidecar is a single-user local process.
// The port is supplied via --urls on the command line by the Electron main process.
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(0); // fallback; --urls overrides this
});

builder.Services.AddDatabases(builder.Configuration);
builder.Services.AddServices(builder.Environment, builder.Configuration);

builder.Services.AddRouting(options => options.LowercaseUrls = true);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    // Allow the Electron renderer (file:// origin or localhost Vite dev server).
    options.AddDefaultPolicy(policy => policy
        .SetIsOriginAllowed(origin =>
        {
            if (origin == "null") return true; // file:// origin in Electron
            if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                return uri.Host == "localhost" || uri.Host == "127.0.0.1";
            return false;
        })
        .AllowAnyMethod()
        .WithHeaders(
            Microsoft.Net.Http.Headers.HeaderNames.ContentType,
            Microsoft.Net.Http.Headers.HeaderNames.Accept));
});

var app = builder.Build();

// Auto-migrate the SQLite database on startup.
await app.MigrateDesktopDatabaseAsync();

app.UseCors();
app.UseRouting();

// No authentication — localhost only, single-user.

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Health check endpoint — polled by the Electron main process.
app.MapGet("/health", () => Results.Ok(new { status = "healthy", version = "1.0" }))
   .ExcludeFromDescription();

app.MapControllers();

app.Run();

// Required for integration tests.
public partial class Program { }
