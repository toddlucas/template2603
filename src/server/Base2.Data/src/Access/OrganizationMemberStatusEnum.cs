namespace Base2.Access;

/// <summary>
/// Organization member status enumeration class.
/// </summary>
public record OrganizationMemberStatusEnum(int Ordinal, string Id, string Name)
    : StringEnumeration(Id, Name, Ordinal)
{
    public const int KeyLength = 20;

    public static OrganizationMemberStatusEnum Inactive => new(10, nameof(OrganizationMemberStatus.inactive), "Inactive");
    public static OrganizationMemberStatusEnum Active => new(20, nameof(OrganizationMemberStatus.active), "Active");

    public static IEnumerable<OrganizationMemberStatusEnum> GetAll() => GetAll<OrganizationMemberStatusEnum>();
}
