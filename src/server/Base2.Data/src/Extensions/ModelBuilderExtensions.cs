using System.Reflection;
using System.Text.RegularExpressions;

using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.EntityFrameworkCore;
#pragma warning restore IDE0130 // Namespace does not match folder structure

public static class ModelBuilderExtensions
{
    public static void AddSqliteDateTimeOffset(this ModelBuilder modelBuilder)
    {
        // SQLite does not have proper support for DateTimeOffset via Entity Framework Core, see the limitations
        // here: https://docs.microsoft.com/en-us/ef/core/providers/sqlite/limitations#query-limitations
        // To work around this, when the Sqlite database provider is used, all model properties of type DateTimeOffset
        // use the DateTimeOffsetToBinaryConverter. (NOTE: This was changed to
        // DateTimeOffsetToStringConverter so dates are easier to read in
        // queries, but also since the offset is also stored.)
        // Based on: https://github.com/aspnet/EntityFrameworkCore/issues/10784#issuecomment-415769754
        // This only supports millisecond precision, but should be sufficient for most use cases.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            // Skip owned entity types — calling modelBuilder.Entity() on them
            // would re-register them as non-owned, conflicting with OwnsOne/OwnsMany.
            if (entityType.IsOwned())
                continue;

            IEnumerable<PropertyInfo> properties = entityType.ClrType.GetProperties().Where(p =>
                p.PropertyType == typeof(DateTimeOffset) ||
                p.PropertyType == typeof(DateTimeOffset?));

            foreach (PropertyInfo property in properties)
            {
                modelBuilder
                    .Entity(entityType.Name)
                    .Property(property.Name)
                    // .HasConversion(new DateTimeOffsetToBinaryConverter());
                    .HasConversion(new DateTimeOffsetToStringConverter());
            }
        }
    }

    public static void Snakeify(this ModelBuilder builder)
    {
        // https://andrewlock.net/customising-asp-net-core-identity-ef-core-naming-conventions-for-postgresql/
        // https://stackoverflow.com/questions/59114236/why-was-relational-extention-method-removed-in-net-core-3
        // https://stackoverflow.com/questions/77645295/changing-the-index-name-of-data-in-dbcontext-with-ef-core-7
        foreach (var entity in builder.Model.GetEntityTypes())
        {
            // Skip owned entity types — they are mapped to JSON columns or share their
            // owner's table and must not have their table name overridden independently.
            if (entity.IsOwned())
                continue;

            // Rename the table.
            entity.SetTableName(ToSingularSnakeCase(entity.GetTableName()!));

            // Rename the column.
            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(ToSingularSnakeCase(property.Name));
            }

            // PK_
            foreach (var key in entity.GetKeys())
            {
                key.SetName(ToSingularSnakeCase(key.GetName()!));
            }

            // FK_
            foreach (var key in entity.GetForeignKeys())
            {
                key.SetConstraintName(ToSingularSnakeCase(key.GetConstraintName()!));
            }

            // IX_
            foreach (var index in entity.GetIndexes())
            {
                index.SetDatabaseName(ToSingularSnakeCase(index.GetDatabaseName()!));
            }
        }
    }

    private static string ToSingularSnakeCase(string pascal)
    {
        string snake = ToSnakeCase(pascal);

        // Microsoft.AspNetCore.Identity
        string rename = snake.Replace("asp_net", "identity");
        if (snake != rename)
        {
            // Singularize
            if (rename.EndsWith('s'))
                rename = rename[..^1];

            snake = rename;
        }

        return snake;
    }

    public static string ToSnakeCase(string input)
    {
        if (string.IsNullOrEmpty(input)) { return input; }

        var startUnderscores = Regex.Match(input, @"^_+");
        return startUnderscores + Regex.Replace(input, @"([a-z0-9])([A-Z])", "$1_$2").ToLower();
    }
}
