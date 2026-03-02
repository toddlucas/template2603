using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Base2.Data;

public static class EnumerationBuilder
{
    public static void OnCreating<T, TId>(this ModelBuilder modelBuilder, IEnumerable<T> items, string? tableName = null)
        where T : Enumeration<TId>
        where TId : IComparable
    {
        PropertyBuilder<TId> idProp = modelBuilder.Entity<T>()
            .Property(m => m.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        modelBuilder.Entity<T>().HasKey(x => x.Id);

        OnCreatingImpl<T, TId>(modelBuilder, items, tableName);
    }

    public static void OnStringCreating<T>(this ModelBuilder modelBuilder, IEnumerable<T> items, int? keyLength = null, string? tableName = null) where T : StringEnumeration
    {
        PropertyBuilder<string> idProp = modelBuilder.Entity<T>()
            .Property(m => m.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        if (keyLength.HasValue)
            idProp.HasMaxLength(keyLength.Value);

        modelBuilder.Entity<T>()
            .Property(m => m.Ordinal)
            .HasColumnName("ordinal");

        OnCreatingImpl<T, string>(modelBuilder, items, tableName);
    }

    private static void OnCreatingImpl<T, TId>(this ModelBuilder modelBuilder, IEnumerable<T> items, string? tableName = null)
        where T : Enumeration<TId>
        where TId : IComparable
    {
        modelBuilder.Entity<T>()
            .ToTable(tableName ?? typeof(T).Name.ToLowerInvariant())
            .HasKey(m => new { m.Id });

        modelBuilder.Entity<T>()
            .Property(m => m.Name)
            .HasColumnName("name");

        modelBuilder.Entity<T>()
            .HasData(items);
    }
}
