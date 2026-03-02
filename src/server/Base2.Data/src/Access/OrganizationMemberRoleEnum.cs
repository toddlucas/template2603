namespace Base2.Access;

/// <summary>
/// Organization member role enumeration class.
/// </summary>
public record OrganizationMemberRoleEnum(int Ordinal, string Id, string Name)
    : StringEnumeration(Id, Name, Ordinal)
{
    public const int KeyLength = 20;

    public static OrganizationMemberRoleEnum Owner => new(10, nameof(OrganizationMemberRole.owner), "Owner");
    public static OrganizationMemberRoleEnum Admin => new(20, nameof(OrganizationMemberRole.admin), "Admin");
    public static OrganizationMemberRoleEnum Manager => new(30, nameof(OrganizationMemberRole.manager), "Manager");
    public static OrganizationMemberRoleEnum Viewer => new(40, nameof(OrganizationMemberRole.viewer), "Viewer");
    public static OrganizationMemberRoleEnum Advisor => new(50, nameof(OrganizationMemberRole.advisor), "Advisor");
    public static OrganizationMemberRoleEnum External => new(60, nameof(OrganizationMemberRole.external), "External");

    public static IEnumerable<OrganizationMemberRoleEnum> GetAll() => GetAll<OrganizationMemberRoleEnum>();
}
