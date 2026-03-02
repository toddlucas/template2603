using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

using OpenAI;

using Base2.Access;
using Base2.Chat;
using Base2.Identity;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class IServiceCollectionExtensions
{
    private static IServiceCollection AddCoreServices(this IServiceCollection serviceCollection, IHostEnvironment env, IConfiguration configuration)
    {
        serviceCollection.AddSingleton(TimeProvider.System);

        // Identity
        serviceCollection.AddScoped<ITenantProvisioningService, TenantProvisioningService>();

        // Access
        serviceCollection.AddScoped<OrganizationService>();

        // Cloud provider — use the developer file-system provider in Development; Null otherwise.
        if (env.IsDevelopment())
        {
            var configured = configuration["DeveloperWorkspace:WorkspacePath"];
            var workspacePath = string.IsNullOrWhiteSpace(configured)
                ? Path.Combine(env.ContentRootPath, "wwwroot", "workspace")
                : Path.IsPathRooted(configured)
                    ? configured
                    : Path.Combine(env.ContentRootPath, configured);
        }
        else
        {
            //serviceCollection.AddScoped<Base2.Cloud.Abstractions.ICloudDocumentProvider, Base2.Cloud.Null.NullCloudDocumentProvider>();
        }

        // Observability (Metrics)
        serviceCollection.AddObservabilityMetrics();

        return serviceCollection;
    }

    private static IServiceCollection AddAIServices(this IServiceCollection serviceCollection, IConfiguration configuration)
    {
        serviceCollection.Configure<ChatClientOptions>(
            configuration.GetSection(ChatClientOptions.SectionName));

        // Register IChatClient only when an API key is present; tests can replace it via DI.
        serviceCollection.AddSingleton<IChatClient>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<ChatClientOptions>>().Value;
            if (string.IsNullOrWhiteSpace(options.ApiKey))
                return new NullChatClient();

            return new OpenAIClient(options.ApiKey)
                .GetChatClient(options.Model)
                .AsIChatClient()
                .AsBuilder()
                .UseFunctionInvocation()
                .Build();
        });

        serviceCollection.AddScoped<ChatService>();

        return serviceCollection;
    }

    public static IServiceCollection AddServices(this IServiceCollection serviceCollection, IHostEnvironment env, IConfiguration configuration)
    {
        serviceCollection.AddCoreServices(env, configuration);
        serviceCollection.AddAIServices(configuration);

        return serviceCollection;
    }
}
