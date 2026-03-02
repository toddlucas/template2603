using Base2.Identity;
using Base2.Data.Identity;
using Base2.Data;
using Base2.Data.Database;
using Base2.Data.Identity;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Extensions.DependencyInjection;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class IServiceCollectionExtensions
{
    private const string _npgsqlAssembly = "Base2.Data.Npgsql";
    private const string _sqliteAssembly = "Base2.Data.Sqlite";

    public static IServiceCollection AddDatabases(this IServiceCollection serviceCollection, IConfiguration configuration)
    {
        serviceCollection.AddAppDbConfiguration(configuration);
        serviceCollection.AddWarehouseDbConfiguration(configuration);

        serviceCollection.AddTransient<ITenantResolver, TenantResolver>();

        return serviceCollection;
    }

    /// <summary>
    /// Add the app DbContext to the container.
    /// </summary>
    public static IServiceCollection AddAppDbConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        // Determine if tenant interceptors should be enabled
        string provider = configuration.GetDatabaseProvider("AppDb", "Npgsql");
        bool addWriteGuardInterceptor = configuration.IsWriteGuardInterceptorEnabled();

        // Register the guard with keyed service using DbContext type name
        if (addWriteGuardInterceptor && provider == "Npgsql")
        {
            // PostgreSQL with tenant context: Full tenant context with RLS support
            services.AddKeyedScoped<IRequestDbGuard>(
                nameof(AppDbContext),
                (serviceProvider, key) =>
                {
                    var dbContext = serviceProvider.GetRequiredService<AppDbContext>();
                    var tenantContext = serviceProvider.GetRequiredService<TenantContext<Guid>>();
                    return new RequestDbGuard<AppDbContext>(dbContext, tenantContext);
                });
        }
        else
        {
            // SQLite or other providers: Passthrough implementation
            services.AddKeyedScoped<IRequestDbGuard>(
                nameof(AppDbContext),
                (serviceProvider, key) => new PassthroughRequestDbGuard());
        }

        // Register interceptor for AppDbContext
        if (addWriteGuardInterceptor)
        {
            services.AddScoped<WriteGuardInterceptor<AppDbContext>>();
        }

        return services.AddProviderDbContext<AppDbContext>(configuration, "AppDb", "Npgsql", addWriteGuardInterceptor: addWriteGuardInterceptor);
    }

    /// <summary>
    /// Add the data DbContext to the container.
    /// </summary>
    public static IServiceCollection AddWarehouseDbConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        // Determine if tenant interceptors should be enabled
        string provider = configuration.GetDatabaseProvider("WarehouseDb", "Npgsql");
        bool addWriteGuardInterceptor = configuration.IsWriteGuardInterceptorEnabled();

        // Register the guard with keyed service using DbContext type name
        if (addWriteGuardInterceptor && provider == "Npgsql")
        {
            // PostgreSQL with tenant context: Full tenant context with RLS support
            services.AddKeyedScoped<IRequestDbGuard>(
                nameof(WarehouseDbContext),
                (serviceProvider, key) =>
                {
                    var dbContext = serviceProvider.GetRequiredService<WarehouseDbContext>();
                    var tenantContext = serviceProvider.GetRequiredService<TenantContext<Guid>>();
                    return new RequestDbGuard<WarehouseDbContext>(dbContext, tenantContext);
                });
        }
        else
        {
            // SQLite or other providers: Passthrough implementation
            services.AddKeyedScoped<IRequestDbGuard>(
                nameof(WarehouseDbContext),
                (serviceProvider, key) => new PassthroughRequestDbGuard());
        }

        // Register interceptor for WarehouseDbContext
        if (addWriteGuardInterceptor)
        {
            services.AddScoped<WriteGuardInterceptor<WarehouseDbContext>>();
        }

        return services.AddProviderDbContext<WarehouseDbContext>(configuration, "WarehouseDb", "Npgsql", addWriteGuardInterceptor: addWriteGuardInterceptor);
    }

    public static IServiceCollection AddProviderDbContext<TContext>(
        this IServiceCollection serviceCollection,
        IConfiguration configuration,
        string configurationPrefix,
        string defaultProvider,
        ServiceLifetime contextLifetime = ServiceLifetime.Scoped,
        ServiceLifetime optionsLifetime = ServiceLifetime.Scoped,
        bool addWriteGuardInterceptor = false)
        where TContext : DbContext
    {
        string provider = configuration.GetDatabaseProvider(configurationPrefix, defaultProvider);
        bool isInMemory = provider == "Sqlite" && configuration.IsInMemoryDatabaseEnabled();

        // Register the connection manager as singleton if in-memory mode
        if (isInMemory && !serviceCollection.Any(d => d.ServiceType == typeof(InMemoryDatabaseManager)))
        {
            serviceCollection.AddSingleton<InMemoryDatabaseManager>();
        }

        string connectionString = GetConnectionString(configuration, configurationPrefix, provider);

        serviceCollection.AddDbContext<TContext>((serviceProvider, options) =>
        {
            if (provider == "Sqlite")
            {
                if (isInMemory)
                {
                    // Use managed connection for in-memory database
                    var manager = serviceProvider.GetRequiredService<InMemoryDatabaseManager>();
                    var connection = manager.GetOrCreateConnection(typeof(TContext).Name);

                    options = options.UseSqlite(
                        connection,
                        o =>
                        {
                            o.MigrationsAssembly(_sqliteAssembly);
                            o.UseQuerySplittingBehavior(QuerySplittingBehavior.SingleQuery);
                        });
                }
                else
                {
                    // File-based SQLite
                    options = options.UseSqlite(
                        connectionString,
                        o =>
                        {
                            o.MigrationsAssembly(_sqliteAssembly);
                            o.UseQuerySplittingBehavior(QuerySplittingBehavior.SingleQuery);
                        });
                }
            }
            else if (provider == "Npgsql")
            {
                options = options.UseNpgsql(
                    connectionString,
                    o =>
                    {
                        o.MigrationsAssembly(_npgsqlAssembly);
                        o.UseQuerySplittingBehavior(QuerySplittingBehavior.SingleQuery);
                    });
            }
            else
            {
                throw new Exception($"Configuration not found for {provider} provider.");
            }

            options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);

            // Add tenant interceptors for PostgreSQL if requested
            if (addWriteGuardInterceptor && provider == "Npgsql")
            {
                // Resolve the generic interceptor for this specific DbContext type
                var writeGuardInterceptor = serviceProvider.GetRequiredService<WriteGuardInterceptor<TContext>>();

                options.AddInterceptors(writeGuardInterceptor);
            }
        },
        contextLifetime,
        optionsLifetime);

        return serviceCollection;
    }

    private static string GetConnectionString(IConfiguration configurationManager, string configurationPrefix, string provider)
    {
        // Check if in-memory mode is enabled for SQLite
        if (provider == "Sqlite" && configurationManager.IsInMemoryDatabaseEnabled())
        {
            return "DataSource=:memory:";
        }

        var connectionString = configurationManager.GetConnectionString(
            provider + configurationPrefix + "ContextConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new Exception($"Connection string not found for {provider}.");
        }

        return connectionString;
    }
}
