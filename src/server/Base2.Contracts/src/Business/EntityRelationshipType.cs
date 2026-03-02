namespace Base2.Business;

/// <summary>
/// Entity relationship types.
/// </summary>
public enum EntityRelationshipType
{
    owns,
    controls,
    subsidiary_of,
    gp_of,
    lp_of,
    trustee_of,
    beneficiary_of,
    manager_of,
    advisor_to,
    spv_for
}
