using Base2.Access;

namespace Base2;

using TRecord = Organization;

public class Organization : OrganizationModel, ITemporalRecord
{
    #region Internal properties

#if RESELLER
    /// <summary>
    /// The group ID this organization member belongs to.
    /// </summary>
    [Display(Name = "Group ID")]
    [Required]
    public Guid GroupId { get; set; }
#endif

    /// <summary>
    /// The tenant ID this organization member belongs to.
    /// </summary>
    [Display(Name = "Tenant ID")]
    [Required]
    public Guid TenantId { get; set; }

    #endregion Internal properties

    #region Navigation properties

    /// <summary>
    /// The organization status enumeration.
    /// </summary>
    public OrganizationStatusEnum? OrganizationStatusEnum { get; set; }

    /// <summary>
    /// The organization members.
    /// </summary>
    public ICollection<OrganizationMember> Members { get; set; } = new List<OrganizationMember>();

    /// <summary>
    /// The child organizations.
    /// </summary>
    public ICollection<Organization> ChildOrganizations { get; set; } = new List<Organization>();

    /// <summary>
    /// The parent organization.
    /// </summary>
    public Organization? ParentOrganization { get; set; }

    #endregion Navigation properties

    #region ITemporalRecord

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

    /// <summary>
    /// The deleted timestamp.
    /// </summary>
    [Display(Name = "Deleted at")]
    [Description("The date and time this record was deleted, or null, in the format defined by RFC 3339, section 5.6, for example, 2017-07-21T17:32:28Z.")]
    public DateTime? DeletedAt { get; set; }

    #endregion ITemporalRecord

    public static void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Table
        modelBuilder.Entity<TRecord>().ToTable(nameof(Organization));

        // Column names (snake_case)
        modelBuilder.Entity<TRecord>().Property(x => x.Id).HasColumnName("id");
#if RESELLER
        modelBuilder.Entity<TRecord>().Property(x => x.GroupId).HasColumnName("group_id");
#endif
        modelBuilder.Entity<TRecord>().Property(x => x.TenantId).HasColumnName("tenant_id");
        modelBuilder.Entity<TRecord>().Property(x => x.Name).HasColumnName("name");
        modelBuilder.Entity<TRecord>().Property(x => x.Code).HasColumnName("code");
        modelBuilder.Entity<TRecord>().Property(x => x.ParentOrgId).HasColumnName("parent_org_id");
        modelBuilder.Entity<TRecord>().Property(x => x.StatusId).HasColumnName("status");
        modelBuilder.Entity<TRecord>().Property(x => x.Metadata).HasColumnName("metadata");
        modelBuilder.Entity<TRecord>().Property(x => x.CreatedAt).HasColumnName("created_at");
        modelBuilder.Entity<TRecord>().Property(x => x.UpdatedAt).HasColumnName("updated_at");
        modelBuilder.Entity<TRecord>().Property(x => x.DeletedAt).HasColumnName("deleted_at");

        // Relations
        modelBuilder.Entity<TRecord>()
            .HasOne(x => x.ParentOrganization)
            .WithMany(y => y.ChildOrganizations)
            .HasForeignKey(x => x.ParentOrgId)
            .IsRequired(false);

        modelBuilder.Entity<TRecord>()
            .HasOne(x => x.OrganizationStatusEnum)
            .WithMany()
            .HasForeignKey(x => x.StatusId)
            .IsRequired();

        // Indexes
#if RESELLER
        modelBuilder.Entity<TRecord>()
            .HasIndex(b => b.GroupId);
#endif
        modelBuilder.Entity<TRecord>()
            .HasIndex(b => b.TenantId);
        modelBuilder.Entity<TRecord>()
            .HasIndex(b => new { b.TenantId, b.Name });
        modelBuilder.Entity<TRecord>()
            .HasIndex(b => new { b.TenantId, b.Code })
            .IsUnique()
            .HasFilter("code IS NOT NULL");

        // Seed data (optional)
        var createdAt1 = new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc);
        var createdAt2 = new DateTime(2024, 3, 20, 0, 0, 0, DateTimeKind.Utc);
        var createdAt3 = new DateTime(2024, 2, 10, 0, 0, 0, DateTimeKind.Utc);
        var updatedAt1 = new DateTime(2024, 12, 19, 0, 0, 0, DateTimeKind.Utc);
        var updatedAt2 = new DateTime(2024, 12, 15, 0, 0, 0, DateTimeKind.Utc);
        var updatedAt3 = new DateTime(2024, 11, 30, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<TRecord>().HasData(
            new TRecord
            {
                Id = 1,
#if RESELLER
                GroupId = IdentitySeedData.GroupId,
#endif
                TenantId = IdentitySeedData.TenantId,
                Name = "Acme Corporation",
                Code = "ACME",
                ParentOrgId = null,
                StatusId = nameof(OrganizationStatus.active),
                Metadata = "Primary organization",
                CreatedAt = createdAt1,
                UpdatedAt = updatedAt1
            },
            new TRecord
            {
                Id = 2,
#if RESELLER
                GroupId = IdentitySeedData.GroupId,
#endif
                TenantId = IdentitySeedData.TenantId,
                Name = "Acme Subsidiary",
                Code = "ACME-SUB",
                ParentOrgId = 1,
                StatusId = nameof(OrganizationStatus.active),
                Metadata = "Subsidiary organization",
                CreatedAt = createdAt2,
                UpdatedAt = updatedAt2
            },
            new TRecord
            {
                Id = 3,
#if RESELLER
                GroupId = IdentitySeedData.GroupId,
#endif
                TenantId = IdentitySeedData.TenantId,
                Name = "Beta Industries",
                Code = "BETA",
                ParentOrgId = null,
                StatusId = nameof(OrganizationStatus.inactive),
                Metadata = "Secondary organization",
                CreatedAt = createdAt3,
                UpdatedAt = updatedAt3
            }
        );
    }
}
