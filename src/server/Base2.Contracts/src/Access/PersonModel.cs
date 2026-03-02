using Base2.Business;

namespace Base2;

/// <summary>
/// Represents a person in the system.
/// </summary>
public class PersonModel
{
    /// <summary>
    /// The person ID.
    /// </summary>
    [Display(Name = "ID")]
    public long Id { get; set; }

    /// <summary>
    /// The person's given (first) name.
    /// </summary>
    [Display(Name = "Given Name")]
    [Required]
    [StringLength(100)]
    public string GivenName { get; set; } = null!;

    /// <summary>
    /// The person's family (last) name.
    /// </summary>
    [Display(Name = "Family Name")]
    [Required]
    [StringLength(100)]
    public string FamilyName { get; set; } = null!;

    /// <summary>
    /// The person's email address (unique within tenant).
    /// </summary>
    [Display(Name = "Email")]
    [EmailAddress]
    [StringLength(255)]
    public string? Email { get; set; }

    /// <summary>
    /// The person's phone number.
    /// </summary>
    [Display(Name = "Phone")]
    [Phone]
    [StringLength(20)]
    public string? Phone { get; set; }

    /// <summary>
    /// The person's date of birth.
    /// </summary>
    [Display(Name = "Date of Birth")]
    public DateTime? DateOfBirth { get; set; }

    /// <summary>
    /// The person's addresses (JSONB).
    /// </summary>
    [Display(Name = "Addresses")]
    public string? Addresses { get; set; }

    /// <summary>
    /// The person's authentication provider ID.
    /// </summary>
    [Display(Name = "Auth Provider ID")]
    [StringLength(255)]
    public string? AuthProviderId { get; set; }

    /// <summary>
    /// Additional metadata for the person.
    /// </summary>
    [Display(Name = "Metadata")]
    public string? Metadata { get; set; }
}

/// <summary>
/// Detailed person model with related entities and temporal tracking.
/// </summary>
public class PersonDetailModel : PersonModel, ITemporal
{
    /// <summary>
    /// The organization memberships for this person.
    /// </summary>
    public OrganizationMemberModel[] OrgMemberships { get; set; } = [];

    /// <summary>
    /// The entity roles for this person.
    /// </summary>
    public EntityRoleModel[] EntityRoles { get; set; } = [];

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
