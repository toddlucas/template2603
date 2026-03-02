using Base2.Data.Mock.Database;

namespace Base2.Data.Mock;

public class TestDbContextScope : DbContextScope
{
    public TestDbContextScope(SqliteDatabaseSet dbs) : base(dbs)
    {
    }

    internal AppDbContext App => (AppDbContext)GetContext(DatabaseNames.App);
    internal WarehouseDbContext Warehouse => (WarehouseDbContext)GetContext(DatabaseNames.Warehouse);
}
