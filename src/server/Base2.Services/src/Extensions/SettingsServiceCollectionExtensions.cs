using Microsoft.Extensions.Configuration;

using Base2.Identity;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class SettingsServiceCollectionExtensions
{
    public static IServiceCollection ConfigureSharedSettings(this IServiceCollection services, IConfiguration config)
    {
        services.Configure<ExternalAuthSettings>(config.GetSection(ExternalAuthSettings.SectionName));

        return services;
    }
}
