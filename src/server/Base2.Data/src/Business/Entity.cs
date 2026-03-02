namespace Base2.Business;

using TRecord = Entity;

public class Entity : EntityModel, ITemporalRecord
{
    #region Internal properties

#if RESELLER
    /// <summary>
    /// The group ID this entity belongs to.
    /// </summary>
    [Display(Name = "Group ID")]
    [Required]
    public Guid GroupId { get; set; }
#endif

    /// <summary>
    /// The tenant ID this entity belongs to.
    /// </summary>
    [Display(Name = "Tenant ID")]
    [Required]
    public Guid TenantId { get; set; }

    #endregion Internal properties

    #region Navigation properties

    /// <summary>
    /// The organization.
    /// </summary>
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// The entity type enumeration.
    /// </summary>
    public EntityTypeEnum? EntityTypeEnum { get; set; }

    /// <summary>
    /// The ownership model enumeration.
    /// </summary>
    public OwnershipModelEnum? OwnershipModelEnum { get; set; }

    /// <summary>
    /// The entity status enumeration.
    /// </summary>
    public EntityStatusEnum? EntityStatusEnum { get; set; }

    /// <summary>
    /// The entity roles.
    /// </summary>
    public ICollection<EntityRole> Roles { get; set; } = new List<EntityRole>();

    /// <summary>
    /// The parent entity relationships.
    /// </summary>
    public ICollection<EntityRelationship> ParentRelationships { get; set; } = new List<EntityRelationship>();

    /// <summary>
    /// The child entity relationships.
    /// </summary>
    public ICollection<EntityRelationship> ChildRelationships { get; set; } = new List<EntityRelationship>();

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
        modelBuilder.Entity<TRecord>().ToTable(nameof(Entity));

        // Column names (snake_case)
        modelBuilder.Entity<TRecord>().Property(x => x.Id).HasColumnName("id");
#if RESELLER
        modelBuilder.Entity<TRecord>().Property(x => x.GroupId).HasColumnName("group_id");
#endif
        modelBuilder.Entity<TRecord>().Property(x => x.TenantId).HasColumnName("tenant_id");
        modelBuilder.Entity<TRecord>().Property(x => x.OrgId).HasColumnName("org_id");
        modelBuilder.Entity<TRecord>().Property(x => x.Name).HasColumnName("name");
        modelBuilder.Entity<TRecord>().Property(x => x.LegalName).HasColumnName("legal_name");
        modelBuilder.Entity<TRecord>().Property(x => x.EntityTypeId).HasColumnName("entity_type_id");
        modelBuilder.Entity<TRecord>().Property(x => x.FormationDate).HasColumnName("formation_date");
        modelBuilder.Entity<TRecord>().Property(x => x.JurisdictionCountry).HasColumnName("jurisdiction_country");
        modelBuilder.Entity<TRecord>().Property(x => x.JurisdictionRegion).HasColumnName("jurisdiction_region");
        modelBuilder.Entity<TRecord>().Property(x => x.Ein).HasColumnName("ein");
        modelBuilder.Entity<TRecord>().Property(x => x.StateFileNumber).HasColumnName("state_file_number");
        modelBuilder.Entity<TRecord>().Property(x => x.RegisteredAgent).HasColumnName("registered_agent");
        modelBuilder.Entity<TRecord>().Property(x => x.OwnershipModelId).HasColumnName("ownership_model_id");
        modelBuilder.Entity<TRecord>().Property(x => x.StatusId).HasColumnName("status_id");
        modelBuilder.Entity<TRecord>().Property(x => x.Metadata).HasColumnName("metadata");
        modelBuilder.Entity<TRecord>().Property(x => x.CreatedAt).HasColumnName("created_at");
        modelBuilder.Entity<TRecord>().Property(x => x.UpdatedAt).HasColumnName("updated_at");
        modelBuilder.Entity<TRecord>().Property(x => x.DeletedAt).HasColumnName("deleted_at");

        // Relations
        modelBuilder.Entity<TRecord>()
            .HasOne(x => x.Organization)
            .WithMany()
            .HasForeignKey(x => x.OrgId)
            .IsRequired();

        // Enumeration relationships
        modelBuilder.Entity<TRecord>()
            .HasOne(x => x.EntityTypeEnum)
            .WithMany()
            .HasForeignKey(x => x.EntityTypeId)
            .IsRequired();

        modelBuilder.Entity<TRecord>()
            .HasOne(x => x.OwnershipModelEnum)
            .WithMany()
            .HasForeignKey(x => x.OwnershipModelId);

        modelBuilder.Entity<TRecord>()
            .HasOne(x => x.EntityStatusEnum)
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
            .HasIndex(b => new { b.TenantId, b.OrgId });
        modelBuilder.Entity<TRecord>()
            .HasIndex(b => new { b.TenantId, b.StatusId});

        // Seed data (optional)
        var createdAt1 = new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc);
        var createdAt2 = new DateTime(2024, 1, 20, 0, 0, 0, DateTimeKind.Utc);
        var createdAt3 = new DateTime(2024, 3, 25, 0, 0, 0, DateTimeKind.Utc);
        var updatedAt1 = new DateTime(2024, 12, 19, 0, 0, 0, DateTimeKind.Utc);
        var updatedAt2 = new DateTime(2024, 12, 19, 0, 0, 0, DateTimeKind.Utc);
        var updatedAt3 = new DateTime(2024, 12, 15, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<TRecord>().HasData(
            new TRecord
            {
                Id = 1,
#if RESELLER
                GroupId = IdentitySeedData.GroupId,
#endif
                TenantId = IdentitySeedData.TenantId,
                OrgId = 1,
                Name = "Acme LLC",
                LegalName = "Acme Corporation LLC",
                EntityTypeId = nameof(EntityType.llc),
                FormationDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                JurisdictionCountry = "US",
                JurisdictionRegion = "US-DE",
                OwnershipModelId = nameof(OwnershipModel.member_managed),
                StatusId = nameof(EntityStatus.active),
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
                OrgId = 1,
                Name = "Acme Holdings Inc",
                LegalName = "Acme Holdings Incorporated",
                EntityTypeId = nameof(EntityType.c_corp),
                FormationDate = new DateTime(2024, 1, 5, 0, 0, 0, DateTimeKind.Utc),
                JurisdictionCountry = "US",
                JurisdictionRegion = "US-DE",
                OwnershipModelId = nameof(OwnershipModel.board_managed),
                StatusId = nameof(EntityStatus.active),
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
                OrgId = 2,
                Name = "Acme Sub LLC",
                LegalName = "Acme Subsidiary LLC",
                EntityTypeId = nameof(EntityType.llc),
                FormationDate = new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                JurisdictionCountry = "US",
                JurisdictionRegion = "US-CA",
                OwnershipModelId = nameof(OwnershipModel.member_managed),
                StatusId = nameof(EntityStatus.active),
                CreatedAt = createdAt3,
                UpdatedAt = updatedAt3
            }
        );
    }
}
