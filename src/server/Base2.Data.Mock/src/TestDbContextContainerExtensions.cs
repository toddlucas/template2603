namespace Base2.Data.Mock;

public static class TestDbContextContainerExtensions
{
    /// <summary>
    /// Create a DI container and add app services, with a test database.
    /// </summary>
    /// <param name="container"></param>
    /// <param name="callback"></param>
    /// <returns></returns>
    /// <remarks>
    /// The test DB context will be injected in such a way that a distinct
    /// context will be created within each scope, but it will maintain a
    /// connection to the in-memory Sqlite database so the database is coherent
    /// across scopes.
    /// </remarks>
    public static async Task<ServiceProvider> AddDbServicesAsync(this TestDbContextContainer container, Action<IServiceCollection>? callback = null)
    {
        await container.CreateAsync(DatabaseNames.App, DatabaseNames.Warehouse);

        IServiceCollection serviceCollection = new ServiceCollection();

        serviceCollection.AddScoped(typeof(AppDbContext), (sp) =>
        {
            // Create a new DbContext for this scope, using the same connection.
            return container.DatabaseSet!.CreateContext<AppDbContext>(DatabaseNames.App);
        });

        serviceCollection.AddScoped(typeof(WarehouseDbContext), (sp) =>
        {
            return container.DatabaseSet!.CreateContext<WarehouseDbContext>(DatabaseNames.Warehouse);
        });


        // Do additional test services need to be added?
        callback?.Invoke(serviceCollection);

        return serviceCollection.BuildServiceProvider();
    }

    private static void AddTestConfiguration(this IServiceCollection services)
    {
        // Load a test version of appsettings.
        IConfigurationRoot configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json")
            .Build();

        //services.AddOptions<PlatformSettings>()
        //    .Bind(configuration.GetSection(nameof(PlatformSettings)))
        //    .ValidateDataAnnotations();
    }

    public static Task<ServiceProvider> AddTestDbServicesAsync(this TestDbContextContainer container)
        => container.AddDbServicesAsync(AddTestServices);

    public static Task<ServiceProvider> AddTestDbServicesAsync(this TestDbContextContainer container, FakeTimeProvider fakeTimeProvider)
        => container.AddDbServicesAsync((services) => AddTestServices(services, fakeTimeProvider));

    private static void AddTestServices(IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
    }

    private static void AddTestServices(IServiceCollection services, FakeTimeProvider fakeTimeProvider)
    {
        services.AddSingleton<TimeProvider>(fakeTimeProvider);
    }
}
