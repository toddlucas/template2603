namespace Base2.Business;

/// <summary>
/// Entity relationship type enumeration class.
/// </summary>
public record EntityRelationshipTypeEnum(int Ordinal, string Id, string Name)
    : StringEnumeration(Id, Name, Ordinal)
{
    public const int KeyLength = 20;

    public static EntityRelationshipTypeEnum Owns => new(10, nameof(EntityRelationshipType.owns), "Owns");
    public static EntityRelationshipTypeEnum Controls => new(20, nameof(EntityRelationshipType.controls), "Controls");
    public static EntityRelationshipTypeEnum SubsidiaryOf => new(30, nameof(EntityRelationshipType.subsidiary_of), "Subsidiary Of");
    public static EntityRelationshipTypeEnum GpOf => new(40, nameof(EntityRelationshipType.gp_of), "General Partner Of");
    public static EntityRelationshipTypeEnum LpOf => new(50, nameof(EntityRelationshipType.lp_of), "Limited Partner Of");
    public static EntityRelationshipTypeEnum TrusteeOf => new(60, nameof(EntityRelationshipType.trustee_of), "Trustee Of");
    public static EntityRelationshipTypeEnum BeneficiaryOf => new(70, nameof(EntityRelationshipType.beneficiary_of), "Beneficiary Of");
    public static EntityRelationshipTypeEnum ManagerOf => new(80, nameof(EntityRelationshipType.manager_of), "Manager Of");
    public static EntityRelationshipTypeEnum AdvisorTo => new(90, nameof(EntityRelationshipType.advisor_to), "Advisor To");
    public static EntityRelationshipTypeEnum SpvFor => new(100, nameof(EntityRelationshipType.spv_for), "SPV For");

    public static IEnumerable<EntityRelationshipTypeEnum> GetAll() => GetAll<EntityRelationshipTypeEnum>();
}
