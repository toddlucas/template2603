namespace Base2.Business;

/// <summary>
/// Represents an entity role (who relates to an entity; time-bounded).
/// </summary>
public class EntityRoleModel
{
    /// <summary>
    /// The entity role ID.
    /// </summary>
    [Display(Name = "ID")]
    public long Id { get; set; }

    /// <summary>
    /// The organization ID.
    /// </summary>
    [Display(Name = "Organization ID")]
    [Required]
    public long OrgId { get; set; }

    /// <summary>
    /// The entity ID.
    /// </summary>
    [Display(Name = "Entity ID")]
    [Required]
    public long EntityId { get; set; }

    /// <summary>
    /// The person ID.
    /// </summary>
    [Display(Name = "Person ID")]
    [Required]
    public long PersonId { get; set; }

    /// <summary>
    /// The entity role type. See <see cref="EntityRoleType"/>.
    /// </summary>
    [Display(Name = "Role")]
    [Required]
    [StringLength(30)]
    public string RoleId { get; set; } = null!;

    /// <summary>
    /// The equity percentage (0-100).
    /// </summary>
    [Display(Name = "Equity Percentage")]
    [Range(0, 100)]
    public decimal? EquityPercent { get; set; }

    /// <summary>
    /// The number of units/shares.
    /// </summary>
    [Display(Name = "Units/Shares")]
    public decimal? UnitsShares { get; set; }

    /// <summary>
    /// The start date of this role.
    /// </summary>
    [Display(Name = "Start Date")]
    public DateTime? StartAt { get; set; }

    /// <summary>
    /// The end date of this role.
    /// </summary>
    [Display(Name = "End Date")]
    public DateTime? EndAt { get; set; }

    /// <summary>
    /// Additional metadata for the entity role.
    /// </summary>
    [Display(Name = "Metadata")]
    public string? Metadata { get; set; }
}

/// <summary>
/// Detailed entity role model with related entities and temporal tracking.
/// </summary>
public class EntityRoleDetailModel : EntityRoleModel, ITemporal
{
    /// <summary>
    /// The organization this entity role belongs to.
    /// </summary>
    public OrganizationModel Organization { get; set; } = null!;

    /// <summary>
    /// The entity this role relates to.
    /// </summary>
    public EntityModel Entity { get; set; } = null!;

    /// <summary>
    /// The person who has this role.
    /// </summary>
    public PersonModel Person { get; set; } = null!;

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
