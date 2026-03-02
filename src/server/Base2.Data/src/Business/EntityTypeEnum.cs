namespace Base2.Business;

/// <summary>
/// Entity type enumeration class.
/// </summary>
public record EntityTypeEnum(int Ordinal, string Id, string Name)
    : StringEnumeration(Id, Name, Ordinal)
{
    public const int KeyLength = 20;

    public static EntityTypeEnum Llc => new(10, nameof(EntityType.llc), "LLC");
    public static EntityTypeEnum CCorp => new(20, nameof(EntityType.c_corp), "C Corporation");
    public static EntityTypeEnum SCorp => new(30, nameof(EntityType.s_corp), "S Corporation");
    public static EntityTypeEnum Lp => new(40, nameof(EntityType.lp), "Limited Partnership");
    public static EntityTypeEnum Llp => new(50, nameof(EntityType.llp), "Limited Liability Partnership");
    public static EntityTypeEnum Trust => new(60, nameof(EntityType.trust), "Trust");
    public static EntityTypeEnum SoleProp => new(70, nameof(EntityType.sole_prop), "Sole Proprietorship");
    public static EntityTypeEnum Plc => new(80, nameof(EntityType.plc), "Public Limited Company");
    public static EntityTypeEnum NonProfit => new(90, nameof(EntityType.non_profit), "Non-Profit");
    public static EntityTypeEnum Spv => new(100, nameof(EntityType.spv), "Special Purpose Vehicle");
    public static EntityTypeEnum Other => new(110, nameof(EntityType.other), "Other");

    public static IEnumerable<EntityTypeEnum> GetAll() => GetAll<EntityTypeEnum>();
}
