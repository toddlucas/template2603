using System.Text.Json;

using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Microsoft.EntityFrameworkCore;

public static class PropertyBuilderExtensions
{
    //public static PropertyBuilder<string?> HasJsonb(this PropertyBuilder<string?> propertyBuilder, bool isSqlite)
    //    => propertyBuilder.HasJsonbOrDefault(isSqlite);

    public static PropertyBuilder<TProperty> HasJsonb<TProperty>(this PropertyBuilder<TProperty> propertyBuilder, TProperty propertyDefault, bool isSqlite)
    {
        if (isSqlite)
        {
            return propertyBuilder.HasJsonConversion(propertyDefault);
        }

        return propertyBuilder.HasColumnType("jsonb");
    }

    public static PropertyBuilder<TProperty?> HasJsonbOrDefault<TProperty>(this PropertyBuilder<TProperty?> propertyBuilder, bool isSqlite)
    {
        if (isSqlite)
        {
            return propertyBuilder.HasJsonConversionOrDefault();
        }

        return propertyBuilder.HasColumnType("jsonb");
    }

    public static PropertyBuilder<Dictionary<string, string>?> HasDictionaryConversion(this PropertyBuilder<Dictionary<string, string>?> propertyBuilder, JsonSerializerOptions? options = null)
        => propertyBuilder.HasJsonConversionOrDefault();

    public static PropertyBuilder<Dictionary<string, string>?> HasJsonbTags(this PropertyBuilder<Dictionary<string, string>?> propertyBuilder, bool isSqlite)
        => propertyBuilder.HasJsonbOrDefault(isSqlite);

    private static PropertyBuilder<TProperty?> HasJsonConversionOrDefault<TProperty>(this PropertyBuilder<TProperty?> propertyBuilder, JsonSerializerOptions? options = null)
    {
        // Sqlite doesn't have JSON/B, so we'll use value converters to TEXT.
        var converter = new ValueConverter<TProperty?, string?>(
            v => JsonSerializer.Serialize(v, options),
            v => v == null ? default : JsonSerializer.Deserialize<TProperty?>(v, options));

        // Add value comparer for collections to ensure EF Core detects changes.
        // Without this, modifications to collection contents won't be tracked.
        ValueComparer<TProperty?>? comparer = null;
        
        var propertyType = typeof(TProperty);
        if (propertyType.IsGenericType)
        {
            var genericDef = propertyType.GetGenericTypeDefinition();
            
            // For collections (List, Dictionary, etc.), compare by JSON equality.
            // This ensures changes to collection contents are properly detected.
            if (genericDef == typeof(List<>) || 
                genericDef == typeof(IList<>) || 
                genericDef == typeof(ICollection<>) ||
                genericDef == typeof(Dictionary<,>) ||
                genericDef == typeof(IDictionary<,>))
            {
                comparer = new ValueComparer<TProperty?>(
                    equalsExpression: (c1, c2) => JsonSerializer.Serialize(c1, options) == JsonSerializer.Serialize(c2, options),
                    hashCodeExpression: c => c == null ? 0 : JsonSerializer.Serialize(c, options).GetHashCode(),
                    snapshotExpression: c => JsonSerializer.Deserialize<TProperty>(JsonSerializer.Serialize(c, options), options));
            }
        }

        return comparer != null 
            ? propertyBuilder.HasConversion(converter, comparer)
            : propertyBuilder.HasConversion(converter);
    }

    private static PropertyBuilder<TProperty> HasJsonConversion<TProperty>(this PropertyBuilder<TProperty> propertyBuilder, TProperty propertyDefault, JsonSerializerOptions? options = null)
    {
        // Sqlite doesn't have JSON/B, so we'll use value converters to TEXT.
        var converter = new ValueConverter<TProperty, string>(
            v => JsonSerializer.Serialize(v, options),
            v => JsonSerializer.Deserialize<TProperty>(v, options) ?? propertyDefault);

        // Add value comparer for collections to ensure EF Core detects changes.
        ValueComparer<TProperty>? comparer = null;
        
        var propertyType = typeof(TProperty);
        if (propertyType.IsGenericType)
        {
            var genericDef = propertyType.GetGenericTypeDefinition();
            
            // For collections, compare by JSON equality.
            if (genericDef == typeof(List<>) || 
                genericDef == typeof(IList<>) || 
                genericDef == typeof(ICollection<>) ||
                genericDef == typeof(Dictionary<,>) ||
                genericDef == typeof(IDictionary<,>))
            {
                comparer = new ValueComparer<TProperty>(
                    equalsExpression: (c1, c2) => JsonSerializer.Serialize(c1, options) == JsonSerializer.Serialize(c2, options),
                    hashCodeExpression: c => JsonSerializer.Serialize(c, options).GetHashCode(),
                    snapshotExpression: c => JsonSerializer.Deserialize<TProperty>(JsonSerializer.Serialize(c, options), options) ?? propertyDefault);
            }
        }

        return comparer != null 
            ? propertyBuilder.HasConversion(converter, comparer)
            : propertyBuilder.HasConversion(converter);
    }
}
