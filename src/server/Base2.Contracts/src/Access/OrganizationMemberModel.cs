using Base2.Access;

namespace Base2;

/// <summary>
/// Represents a user within a company.
/// </summary>
public class OrganizationMemberModel
{
    /// <summary>
    /// The organization member ID.
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
    /// The person ID.
    /// </summary>
    [Display(Name = "Person ID")]
    [Required]
    public long PersonId { get; set; }

    /// <summary>
    /// The member role. See <see cref="OrganizationMemberRole"/>.
    /// </summary>
    [Display(Name = "Role")]
    [Required]
    [StringLength(20)]
    public string RoleId { get; set; } = null!;

    /// <summary>
    /// The member status. See <see cref="OrganizationMemberStatus"/>.
    /// </summary>
    [Display(Name = "Status")]
    [StringLength(50)]
    public string? StatusId { get; set; }

    /// <summary>
    /// The start date of this membership.
    /// </summary>
    [Display(Name = "Start Date")]
    public DateTime? StartAt { get; set; }

    /// <summary>
    /// The end date of this membership.
    /// </summary>
    [Display(Name = "End Date")]
    public DateTime? EndAt { get; set; }

    /// <summary>
    /// Additional metadata for the organization member.
    /// </summary>
    [Display(Name = "Metadata")]
    public string? Metadata { get; set; }
}

/// <summary>
/// Detailed organization member model with related entities and temporal tracking.
/// </summary>
public class OrganizationMemberDetailModel : OrganizationMemberModel, ITemporal
{
    /// <summary>
    /// The organization this member belongs to.
    /// </summary>
    public OrganizationModel Organization { get; set; } = null!;

    /// <summary>
    /// The person who is a member.
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
