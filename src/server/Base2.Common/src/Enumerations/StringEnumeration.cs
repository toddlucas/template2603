namespace Base2;

public abstract record StringEnumeration(string Id, string Name, int Ordinal)
    : OrderedEnumeration<string>(Id, Name, Ordinal)
{
    public new static IEnumerable<T> GetAll<T>() where T : StringEnumeration
        => Enumeration<string>.GetAll<T>().OrderBy(x => x.Ordinal);
}
