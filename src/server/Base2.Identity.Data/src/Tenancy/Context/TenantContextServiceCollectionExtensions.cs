using Base2.Identity;

namespace Microsoft.Extensions.DependencyInjection;

public static class ITenantServiceCollectionExtensions
{
    public static IServiceCollection AddTenantServices(this IServiceCollection serviceCollection)
    {
        // Identity
        //serviceCollection.AddTransient<TenantManager>();
        //serviceCollection.AddTransient<ITenantResolver, TenantResolver>();
        serviceCollection.AddScoped<TenantContext<Guid>>();

        return serviceCollection;
    }
}
