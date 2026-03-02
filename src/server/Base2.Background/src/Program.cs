using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

HostApplicationBuilder builder = Host.CreateApplicationBuilder(args);

builder.Logging.AddSeq();

builder.Services.AddMetrics();
builder.Services.AddDatabases(builder.Configuration);
builder.Services.AddTenantServices();
builder.Services.AddServices(builder.Environment, builder.Configuration);
builder.Services.AddTaskServices();
builder.Services.AddBackgroundServices();
builder.Services.AddObservabilityMetrics();

builder.Services.AddLocalization();

// Add Data Protection for encrypting sensitive data (email account credentials)
builder.Services.AddDataProtection()
    .SetApplicationName("ProductName");

builder.Services.ConfigureSharedSettings(builder.Configuration);

builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseDefaultHangfireStorage(builder.Configuration));

builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = Environment.ProcessorCount * 2;
    options.ServerName = "product_name";
    // options.Queues = new[] { "default", "processor" };
});

IHost host = builder.Build();

host.UseRecurringJobs();

host.Run();
