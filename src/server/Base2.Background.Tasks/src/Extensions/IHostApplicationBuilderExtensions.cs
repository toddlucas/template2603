using Hangfire;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.Hosting;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class IHostApplicationBuilderExtensions
{
    /// <summary>
    /// Configures recurring jobs for the host (console app).
    /// </summary>
    public static IHost UseRecurringJobs(this IHost host)
    {
        ConfigureRecurringJobs(host.Services);
        return host;
    }

    private static void ConfigureRecurringJobs(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();

        // This forces the AddHangfire configuration callback to execute
        var jobStorage = scope.ServiceProvider.GetRequiredService<JobStorage>();

        // Register email account health check job (runs daily at 2 AM UTC)
        //RecurringJob.AddOrUpdate<Base2.Infrastructure.EmailAccountHealthCheckJob>(
        //    recurringJobId: Base2.Infrastructure.EmailAccountHealthCheckJob.JobId,
        //    methodCall: job => job.ExecuteAsync(CancellationToken.None),
        //    cronExpression: Cron.Daily(2),  // 2 AM UTC
        //    options: new RecurringJobOptions
        //    {
        //        TimeZone = TimeZoneInfo.Utc
        //    });
    }
}
