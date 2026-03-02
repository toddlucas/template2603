namespace Base2.Business;

/// <summary>
/// Represents an entity relationship (entity↔entity graph).
/// </summary>
public class EntityRelationshipModel
{
    /// <summary>
    /// The entity relationship ID.
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
    /// The parent entity ID.
    /// </summary>
    [Display(Name = "Parent Entity ID")]
    [Required]
    public long ParentEntityId { get; set; }

    /// <summary>
    /// The child entity ID.
    /// </summary>
    [Display(Name = "Child Entity ID")]
    [Required]
    public long ChildEntityId { get; set; }

    /// <summary>
    /// The relationship type. See <see cref="EntityRelationshipType"/>.
    /// </summary>
    [Display(Name = "Relationship Type")]
    [Required]
    [StringLength(20)]
    public string RelationshipTypeId { get; set; } = null!;

    /// <summary>
    /// The percentage ownership (0-100).
    /// </summary>
    [Display(Name = "Percent Ownership")]
    [Range(0, 100)]
    public decimal? PercentOwnership { get; set; }

    /// <summary>
    /// The start date of this relationship.
    /// </summary>
    [Display(Name = "Start Date")]
    public DateTime? StartAt { get; set; }

    /// <summary>
    /// The end date of this relationship.
    /// </summary>
    [Display(Name = "End Date")]
    public DateTime? EndAt { get; set; }

    /// <summary>
    /// Additional metadata for the entity relationship.
    /// </summary>
    [Display(Name = "Metadata")]
    public string? Metadata { get; set; }
}

/// <summary>
/// Detailed entity relationship model with related entities and temporal tracking.
/// </summary>
public class EntityRelationshipDetailModel : EntityRelationshipModel, ITemporal
{
    /// <summary>
    /// The organization this entity relationship belongs to.
    /// </summary>
    public OrganizationModel Organization { get; set; } = null!;

    /// <summary>
    /// The parent entity.
    /// </summary>
    public EntityModel ParentEntity { get; set; } = null!;

    /// <summary>
    /// The child entity.
    /// </summary>
    public EntityModel ChildEntity { get; set; } = null!;

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
