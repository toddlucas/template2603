namespace Base2.Business;

/// <summary>
/// Entity status enumeration class.
/// </summary>
public record EntityStatusEnum(int Ordinal, string Id, string Name)
    : StringEnumeration(Id, Name, Ordinal)
{
    public const int KeyLength = 20;

    public static EntityStatusEnum Draft => new(10, nameof(EntityStatus.draft), "Draft");
    public static EntityStatusEnum Active => new(20, nameof(EntityStatus.active), "Active");
    public static EntityStatusEnum Dissolved => new(30, nameof(EntityStatus.dissolved), "Dissolved");
    public static EntityStatusEnum Merged => new(40, nameof(EntityStatus.merged), "Merged");

    public static IEnumerable<EntityStatusEnum> GetAll() => GetAll<EntityStatusEnum>();
}
