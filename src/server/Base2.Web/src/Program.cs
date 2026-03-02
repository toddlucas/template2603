using System.Net.Mime;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;

using Hangfire;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using Scalar.AspNetCore;
using Vite.AspNetCore;

using Base2.Data;
using Base2.Identity;
using Base2.Observability;
using Base2.Settings;
using Base2.Web.Extensions;
using Base2.Web.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile(
    $"appsettings.{builder.Environment.EnvironmentName}.local.json",
    optional: true,
    reloadOnChange: true);

builder.Logging.AddSeq();

builder.Services.AddDatabases(builder.Configuration);
builder.Services.AddServices(builder.Environment, builder.Configuration);
builder.Services.AddTenantServices();
builder.Services.AddTaskServices();
builder.Services.AddForegroundServices();

// Add Data Protection for encrypting sensitive data (email account credentials)
builder.Services.AddDataProtection()
    .SetApplicationName("ProductName");

builder.Services.AddAuthorizationBuilder()
    .AddDefaultPolicy("DefaultPolicy", policy => policy.RequireAuthenticatedUser())
    .AddPolicy(AppPolicy.RequireUserRole, policy => policy.RequireRole(AppRole.User))
    .AddPolicy(AppPolicy.RequireResellerRole, policy => policy.RequireRole(AppRole.Reseller))
    .AddPolicy(AppPolicy.RequireAdminRole, policy => policy.RequireRole(AppRole.Admin));

// https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity?view=aspnetcore-9.0&tabs=visual-studio#adddefaultidentity-and-addidentity
//builder.Services.AddDefaultIdentity<IdentityUser>() // UI
builder.Services.AddIdentityApiEndpoints<ApplicationUser>( // API
        options =>
        {
            options.SignIn.RequireConfirmedAccount = true;
            options.Stores.SchemaVersion = IdentitySchemaVersions.Version3;
        })
    .AddSignInManager<TenantSignInManager<ApplicationUser, Guid>>()
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<AppDbContext>();

builder.Services.AddOptions<BearerTokenOptions>(IdentityConstants.BearerScheme).Configure(options =>
{
    // options.BearerTokenExpiration = TimeSpan.FromSeconds(60);
});
//builder.Services.ConfigureApplicationCookie(options =>
//{
//    options.Cookie.SameSite = SameSiteMode.None;
//    options.Cookie.SecurePolicy = CookieSecurePolicy.None; // because you're on HTTP
//});

builder.Services.Configure<IdentityOptions>(builder.Configuration.GetSection(nameof(IdentityOptions)));

builder.Services.AddTransient<IEmailSender, AuthSendGridSender>();
builder.Services.Configure<AuthSendGridOptions>(builder.Configuration.GetSection(nameof(AuthSendGridOptions)));

builder.Services.ConfigureSharedSettings(builder.Configuration);

builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseDefaultHangfireStorage(builder.Configuration));

#if USE_FRONTEND_SERVER
builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = Environment.ProcessorCount * 2;
    options.ServerName = $"{Environment.MachineName}-{Guid.NewGuid()}";
});
#endif

builder.Services.AddOpenApi();

// Configure OpenTelemetry for Aspire
builder.Services.AddOpenTelemetry()
    .WithMetrics(metrics =>
    {
        // Collect metrics from your existing ObservabilityMetrics meter
        metrics.AddMeter(MetricsConstants.MeterName);

        // Add standard ASP.NET Core instrumentation
        metrics.AddAspNetCoreInstrumentation();
        metrics.AddHttpClientInstrumentation();
        metrics.AddRuntimeInstrumentation();

        // Export to OTLP (Aspire uses OTLP)
        // The endpoint is automatically configured via OTEL_EXPORTER_OTLP_ENDPOINT environment variable
        // when running with Aspire, or defaults to http://localhost:4318
        metrics.AddOtlpExporter();
    })
    .ConfigureResource(resource =>
        resource.AddService(
            serviceName: "Base2.Web",
            serviceVersion: "1.0.0"));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy
        .AllowAnyMethod()
        .WithOrigins(
            "http://localhost:8383", // web
            "http://localhost:8484", // admin
            "http://localhost:8585", // app
            "http://localhost:5173") // Vite default port
        .WithHeaders(
            Microsoft.Net.Http.Headers.HeaderNames.Authorization,
            Microsoft.Net.Http.Headers.HeaderNames.ContentType));
});

var rateOptions = new AppRateLimitOptions();
builder.Configuration.GetSection(AppRateLimitOptions.AppRateLimit).Bind(rateOptions);
const string fixedRatePolicy = "FixedPolicy";

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy<Guid>(policyName: fixedRatePolicy, partitioner: httpContext =>
    {
        Guid? userId = httpContext.User.GetNameIdentifierOrDefault();

        return userId == null || userId == Guid.Empty
            ? RateLimitPartition.GetFixedWindowLimiter(Guid.Empty, _ =>
                new FixedWindowRateLimiterOptions
                {
                    PermitLimit = rateOptions.PermitLimit,
                    Window = TimeSpan.FromSeconds(rateOptions.Window),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = rateOptions.QueueLimit,
                })
            : RateLimitPartition.GetFixedWindowLimiter(userId.Value, _ =>
                new FixedWindowRateLimiterOptions
                {
                    PermitLimit = rateOptions.PermitLimit,
                    Window = TimeSpan.FromSeconds(rateOptions.Window),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0, // Set to 0 to disable queuing
                    // QueueLimit = rateOptions.QueueLimit,
                });
    });
});

builder.Services.AddLocalization();

builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var supportedCultures = new[] { "en-US", "fr", "de", "el", "es" };
    options.SetDefaultCulture(supportedCultures[0])
        .AddSupportedCultures(supportedCultures)
        .AddSupportedUICultures(supportedCultures);
});

builder.Services.AddRouting(options => options.LowercaseUrls = true);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddControllers();
//builder.Services.AddControllersWithViews()
//    ;

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddViteServices(options =>
{
    options.Server.Port = 8383;
});

var app = builder.Build();

// Initialize in-memory databases if enabled
app.UseInMemoryDatabaseInitialization();

#if false
// Configure recurring jobs
app.UseRecurringJobs();
#endif

//	Catches unhandled exceptions globally and formats them as ProblemDetails.
app.UseExceptionHandler();

// Convert empty error responses (like 404 or 403) to ProblemDetails.
app.UseStatusCodePages();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

//app.UseStaticFiles();
app.UseHttpsRedirection();
app.UseRequestLocalization();
app.UseRouting();

// https://learn.microsoft.com/en-us/aspnet/core/security/cors?view=aspnetcore-9.0
// Usually called before UseStaticFiles.
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();
app.UseTenantContextMiddleware();
app.UseAmbientGuard();

app.UseRateLimiter();
//app.MapStaticAssets();

// Proxy to the Vite Development Server.
if (app.Environment.IsDevelopment())
{
    // WebSockets support is required for HMR (hot module reload).
    // Uncomment the following line if your pipeline doesn't contain it.
    app.UseWebSockets();

    // Enable all required features to use the Vite Development Server.
    // Pass true if you want to use the integrated middleware.
    //app.UseViteDevelopmentServer(/* false */);
    //app.UseViteDevelopmentServer(true);
}

//app.UseHangfireDashboard();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();               // http://localhost:8181/openapi/v1.json
    app.MapScalarApiReference();    // http://localhost:8181/scalar/v1
}

app.MapGroup("/api/auth")
    .WithTags("Auth")
    .MapTenantIdentityApi<ApplicationUser>();

app.MapDefaultControllerRoute()
    //.RequireRateLimiting(fixedRatePolicy)
    .WithStaticAssets();
//app.MapRazorPages();

// Attribute routing (API) endpoints.
app.MapControllers()
    .RequireRateLimiting(fixedRatePolicy);

#pragma warning disable ASP0014
// TODO: Convert to top-level Map calls off of app.
// TODO: Secure with policy.
app.UseEndpoints(endpoints =>
{
    endpoints.MapHangfireDashboard();   // http://localhost:8181/hangfire
});
#pragma warning restore ASP0014

#if DEBUG
app.MapGet(
    "/",
    () =>
        Results.Content("""
            <!doctype html>
            <html lang='en'>
            <title>Product Name</title>
            <body>
                <div><a href="http://localhost:8383">App</a></div>
                <div><a href="http://localhost:8484/admin/">Admin</a></div>
                <div><a href="http://localhost:8181/hangfire">Hangfire</a></div>
                <div><a href="http://localhost:8181/scalar/v1">Scalar API</a></div>
                <div><a href="http://localhost:8181/openapi/v1.json">OpenAPI JSON</a></div>
                <div><a href="http://localhost:8181/hangfire">Hangfire</a></div>
            </body>
            </html>
            """,
        MediaTypeNames.Text.Html))
    .ExcludeFromDescription();
#endif

app.Run();

// Required for unit test project.
public partial class Program { }
