namespace Base2.Data;

public static class EnumerationExtensions
{
    public static void AddEnumeration<T>(this ModelBuilder modelBuilder, IEnumerable<T> items, string? tableName = null) where T : Enumeration<string>
    {
        modelBuilder.Entity<T>()
            .ToTable(tableName ?? typeof(T).Name.ToLowerInvariant())
            .HasKey(m => new { m.Id });

        modelBuilder.Entity<T>()
            .Property(m => m.Id)
            .ValueGeneratedNever();

        modelBuilder.Entity<T>()
            .HasData(items);
    }
}
