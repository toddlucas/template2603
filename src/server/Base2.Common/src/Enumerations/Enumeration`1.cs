using System.Reflection;

namespace Base2;

public abstract record Enumeration<TId>(TId Id, string Name) : IComparable<Enumeration<TId>>
    where TId : IComparable
{
    public static IEnumerable<T> GetAll<T>() where T : Enumeration<TId>
        => typeof(T).GetProperties(
                BindingFlags.Public |
                BindingFlags.Static |
                BindingFlags.DeclaredOnly)
            .Select(f => f.GetValue(null))
            .Cast<T>();

    public int CompareTo(Enumeration<TId>? that)
    {
        if (that == null)
            return 1;

        return Id.CompareTo(that.Id);
    }
}
