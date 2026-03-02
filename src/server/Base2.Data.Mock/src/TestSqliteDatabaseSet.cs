using Base2.Data.Mock.Database;

namespace Base2.Data.Mock;

public class TestSqliteDatabaseSet : SqliteDatabaseSet
{
    private static readonly Dictionary<string, DbContextInfo> _infoMap = new()
    {
        [DatabaseNames.App] = new DbContextInfo(
            typeof(AppDbContext),
            AppDbContext.Create),

        [DatabaseNames.Warehouse] = new DbContextInfo(
            typeof(WarehouseDbContext),
            WarehouseDbContext.Create),
    };

    public TestSqliteDatabaseSet() : base(_infoMap)
    {
    }
}
