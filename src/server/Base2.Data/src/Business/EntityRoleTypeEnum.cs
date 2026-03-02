namespace Base2.Business;

/// <summary>
/// Entity role type enumeration class.
/// </summary>
public record EntityRoleTypeEnum(int Ordinal, string Id, string Name)
    : StringEnumeration(Id, Name, Ordinal)
{
    public const int KeyLength = 30;

    public static EntityRoleTypeEnum Owner => new(10, nameof(EntityRoleType.owner), "Owner");
    public static EntityRoleTypeEnum Member => new(20, nameof(EntityRoleType.member), "Member");
    public static EntityRoleTypeEnum Manager => new(30, nameof(EntityRoleType.manager), "Manager");
    public static EntityRoleTypeEnum Director => new(40, nameof(EntityRoleType.director), "Director");
    public static EntityRoleTypeEnum Officer => new(50, nameof(EntityRoleType.officer), "Officer");
    public static EntityRoleTypeEnum Trustee => new(60, nameof(EntityRoleType.trustee), "Trustee");
    public static EntityRoleTypeEnum Beneficiary => new(70, nameof(EntityRoleType.beneficiary), "Beneficiary");
    public static EntityRoleTypeEnum Advisor => new(80, nameof(EntityRoleType.advisor), "Advisor");
    public static EntityRoleTypeEnum Attorney => new(90, nameof(EntityRoleType.attorney), "Attorney");
    public static EntityRoleTypeEnum Accountant => new(100, nameof(EntityRoleType.accountant), "Accountant");
    public static EntityRoleTypeEnum RegisteredAgentContact => new(110, nameof(EntityRoleType.registered_agent_contact), "Registered Agent Contact");
    public static EntityRoleTypeEnum Signatory => new(120, nameof(EntityRoleType.signatory), "Signatory");

    public static IEnumerable<EntityRoleTypeEnum> GetAll() => GetAll<EntityRoleTypeEnum>();
}
