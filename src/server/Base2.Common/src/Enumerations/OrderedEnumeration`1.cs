namespace Base2;

/// <remarks>
/// https://josipmisko.com/posts/string-enums-in-c-sharp-everything-you-need-to-know
/// https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/enumeration-classes-over-enum-types#implement-an-enumeration-base-class
/// </remarks>
[DebuggerDisplay("{Ordinal,nq}. {Name,nq} ({Id,nq})")]
public abstract record OrderedEnumeration<TId>(TId Id, string Name, int Ordinal)
    : Enumeration<TId>(Id, Name)
    where TId : IComparable
{
    public new static IEnumerable<T> GetAll<T>() where T : OrderedEnumeration<TId>
        => Enumeration<TId>.GetAll<T>().OrderBy(x => x.Ordinal);
}
