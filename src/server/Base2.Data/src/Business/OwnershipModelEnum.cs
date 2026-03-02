namespace Base2.Business;

/// <summary>
/// Ownership model enumeration class.
/// </summary>
public record OwnershipModelEnum(int Ordinal, string Id, string Name)
    : StringEnumeration(Id, Name, Ordinal)
{
    public const int KeyLength = 20;

    public static OwnershipModelEnum MemberManaged => new(10, nameof(OwnershipModel.member_managed), "Member Managed");
    public static OwnershipModelEnum ManagerManaged => new(20, nameof(OwnershipModel.manager_managed), "Manager Managed");
    public static OwnershipModelEnum BoardManaged => new(30, nameof(OwnershipModel.board_managed), "Board Managed");
    public static OwnershipModelEnum TrusteeManaged => new(40, nameof(OwnershipModel.trustee_managed), "Trustee Managed");

    public static IEnumerable<OwnershipModelEnum> GetAll() => GetAll<OwnershipModelEnum>();
}
