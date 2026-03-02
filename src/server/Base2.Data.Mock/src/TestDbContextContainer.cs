using Base2.Data.Mock.Database;

namespace Base2.Data.Mock;

public class TestDbContextContainer : DbContextContainer
{
    public TestDbContextContainer() : base(new TestSqliteDatabaseSet())
    {
    }

    /// <summary>
    /// Creates a container scope which includes the Sqlite database contexts.
    /// </summary>
    public TestDbContextScope BeginScope()
    {
        if (DatabaseSet == null)
            throw new ObjectDisposedException("The databases have been disposed");

        return new TestDbContextScope(DatabaseSet);
    }
}
