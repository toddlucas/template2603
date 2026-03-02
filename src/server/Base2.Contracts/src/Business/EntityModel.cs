namespace Base2.Business;

/// <summary>
/// Represents a business entity (LLC, Corporation, Trust, etc.) in the system.
/// </summary>
public class EntityModel
{
    /// <summary>
    /// The entity ID.
    /// </summary>
    [Display(Name = "ID")]
    public long Id { get; set; }

    /// <summary>
    /// The organization this entity belongs to.
    /// </summary>
    [Display(Name = "Organization ID")]
    [Required]
    public long OrgId { get; set; }

    /// <summary>
    /// The entity name.
    /// </summary>
    [Display(Name = "Name")]
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = null!;

    /// <summary>
    /// The entity's legal name (may differ from display name).
    /// </summary>
    [Display(Name = "Legal Name")]
    [StringLength(200)]
    public string? LegalName { get; set; }

    /// <summary>
    /// The entity type (LLC, Corporation, Trust, etc.). See <see cref="EntityType"/>.
    /// </summary>
    [Display(Name = "Entity Type")]
    [Required]
    [StringLength(20)]
    public string EntityTypeId { get; set; } = null!;

    /// <summary>
    /// The entity's formation date.
    /// </summary>
    [Display(Name = "Formation Date")]
    public DateTime? FormationDate { get; set; }

    /// <summary>
    /// The entity's jurisdiction country (ISO-3166-1).
    /// </summary>
    [Display(Name = "Jurisdiction Country")]
    [StringLength(2)]
    public string? JurisdictionCountry { get; set; }

    /// <summary>
    /// The entity's jurisdiction region (ISO-3166-2).
    /// </summary>
    [Display(Name = "Jurisdiction Region")]
    [StringLength(10)]
    public string? JurisdictionRegion { get; set; }

    /// <summary>
    /// The entity's EIN/Tax ID.
    /// </summary>
    [Display(Name = "EIN")]
    [StringLength(20)]
    public string? Ein { get; set; }

    /// <summary>
    /// The entity's state file number.
    /// </summary>
    [Display(Name = "State File Number")]
    [StringLength(50)]
    public string? StateFileNumber { get; set; }

    /// <summary>
    /// The entity's registered agent information (JSONB).
    /// </summary>
    [Display(Name = "Registered Agent")]
    public string? RegisteredAgent { get; set; }

    /// <summary>
    /// The entity's ownership model.
    /// </summary>
    [Display(Name = "Ownership Model")]
    [StringLength(20)]
    public string? OwnershipModelId { get; set; }

    /// <summary>
    /// The entity's status.
    /// </summary>
    [Display(Name = "Status")]
    [Required]
    [StringLength(20)]
    public string StatusId { get; set; } = null!;

    /// <summary>
    /// Additional metadata for the entity.
    /// </summary>
    [Display(Name = "Metadata")]
    public string? Metadata { get; set; }
}

/// <summary>
/// Detailed entity model with related entities and temporal tracking.
/// </summary>
public class EntityDetailModel : EntityModel, ITemporal
{
    /// <summary>
    /// The organization this entity belongs to.
    /// </summary>
    public OrganizationModel Organization { get; set; } = null!;

    /// <summary>
    /// The entity roles for this entity.
    /// </summary>
    public EntityRoleModel[] EntityRoles { get; set; } = [];

    /// <summary>
    /// The entity relationships for this entity.
    /// </summary>
    public EntityRelationshipModel[] EntityRelationships { get; set; } = [];

    #region ITemporal

    /// <summary>
    /// The created timestamp.
    /// </summary>
    [Display(Name = "Created at")]
    [Description("The date and time this record was created, in the format defined by RFC 3339, section 5.6, for example, 2017-07-21T17:32:28Z.")]
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The updated timestamp.
    /// </summary>
    [Display(Name = "Updated at")]
    [Description("The date and time this record was last updated, in the format defined by RFC 3339, section 5.6, for example, 2017-07-21T17:32:28Z.")]
    public DateTime UpdatedAt { get; set; }

    #endregion ITemporal
}
