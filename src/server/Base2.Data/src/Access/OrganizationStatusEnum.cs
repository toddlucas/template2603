namespace Base2.Access;

/// <summary>
/// Organization status enumeration class.
/// </summary>
public record OrganizationStatusEnum(int Ordinal, string Id, string Name)
    : StringEnumeration(Id, Name, Ordinal)
{
    public const int KeyLength = 20;

    public static OrganizationStatusEnum Inactive => new(10, nameof(OrganizationStatus.inactive), "Inactive");
    public static OrganizationStatusEnum Active => new(20, nameof(OrganizationStatus.active), "Active");

    public static IEnumerable<OrganizationStatusEnum> GetAll() => GetAll<OrganizationStatusEnum>();
}
