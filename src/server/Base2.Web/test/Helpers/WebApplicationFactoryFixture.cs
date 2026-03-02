namespace Base2;

public class WebApplicationFactoryFixture
{
    public WebApplicationFactory<Program> Factory { get; set; } = new();
    public WebApplicationFactoryFixture()
    {
        // Enable in-memory database mode for fast integration tests
        Environment.SetEnvironmentVariable("UseInMemoryDatabase", "true");
        Environment.SetEnvironmentVariable("AppDbProvider", "Sqlite");
        Environment.SetEnvironmentVariable("WarehouseDbProvider", "Sqlite");
        Environment.SetEnvironmentVariable("HangfireDbProvider", "Sqlite");

        // These connection strings won't be used in in-memory mode,
        // but are provided as fallback if in-memory mode is disabled
        Environment.SetEnvironmentVariable("ConnectionStrings:SqliteAppDbContextConnection", "Data Source=../../../../../Base2.Web/src/base2.db");
        Environment.SetEnvironmentVariable("ConnectionStrings:SqliteWarehouseDbContextConnection", "Data Source=../../../../../Base2.Web/src/warehouse.db");
        Environment.SetEnvironmentVariable("ConnectionStrings:SqliteDefaultHangfireConnection", "../../../../../Base2.Background/src/background.db");
    }
}

[CollectionDefinition(Name)]
public class WebApplicationFactoryCollection : ICollectionFixture<WebApplicationFactoryFixture>
{
    public const string Name = "WebApplicationFactory Collection";
}
