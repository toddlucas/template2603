using Base2.Access;

namespace Base2.Business;

using TRecord = EntityRole;

public class EntityRole : EntityRoleModel, ITemporalRecord
{
    #region Internal properties

#if RESELLER
    /// <summary>
    /// The group ID this entity role belongs to.
    /// </summary>
    [Display(Name = "Group ID")]
    [Required]
    public Guid GroupId { get; set; }
#endif

    /// <summary>
    /// The tenant ID this entity role belongs to.
    /// </summary>
    [Display(Name = "Tenant ID")]
    [Required]
    public Guid TenantId { get; set; }

    #endregion Internal properties

    #region Navigation properties

    /// <summary>
    /// The entity.
    /// </summary>
    public Entity Entity { get; set; } = null!;

    /// <summary>
    /// The person.
    /// </summary>
    public Person Person { get; set; } = null!;

    /// <summary>
    /// The organization.
    /// </summary>
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// The entity role type enumeration.
    /// </summary>
    public EntityRoleTypeEnum? EntityRoleTypeEnum { get; set; }

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
        modelBuilder.Entity<TRecord>().ToTable(nameof(EntityRole));

        // Column names (snake_case)
        modelBuilder.Entity<TRecord>().Property(x => x.Id).HasColumnName("id");
#if RESELLER
        modelBuilder.Entity<TRecord>().Property(x => x.GroupId).HasColumnName("group_id");
#endif
        modelBuilder.Entity<TRecord>().Property(x => x.TenantId).HasColumnName("tenant_id");
        modelBuilder.Entity<TRecord>().Property(x => x.OrgId).HasColumnName("org_id");
        modelBuilder.Entity<TRecord>().Property(x => x.EntityId).HasColumnName("entity_id");
        modelBuilder.Entity<TRecord>().Property(x => x.PersonId).HasColumnName("person_id");
        modelBuilder.Entity<TRecord>().Property(x => x.RoleId).HasColumnName("role_id");
        modelBuilder.Entity<TRecord>().Property(x => x.EquityPercent).HasColumnName("equity_percent");
        modelBuilder.Entity<TRecord>().Property(x => x.UnitsShares).HasColumnName("units_shares");
        modelBuilder.Entity<TRecord>().Property(x => x.StartAt).HasColumnName("start_at");
        modelBuilder.Entity<TRecord>().Property(x => x.EndAt).HasColumnName("end_at");
        modelBuilder.Entity<TRecord>().Property(x => x.Metadata).HasColumnName("metadata");
        modelBuilder.Entity<TRecord>().Property(x => x.CreatedAt).HasColumnName("created_at");
        modelBuilder.Entity<TRecord>().Property(x => x.UpdatedAt).HasColumnName("updated_at");
        modelBuilder.Entity<TRecord>().Property(x => x.DeletedAt).HasColumnName("deleted_at");

        // Relations
        modelBuilder.Entity<TRecord>()
            .HasOne(x => x.Entity)
            .WithMany(y => y.Roles)
            .HasForeignKey(x => x.EntityId)
            .IsRequired();

        modelBuilder.Entity<TRecord>()
            .HasOne(x => x.Person)
            .WithMany()
            .HasForeignKey(x => x.PersonId)
            .IsRequired();

        modelBuilder.Entity<TRecord>()
            .HasOne(x => x.Organization)
            .WithMany()
            .HasForeignKey(x => x.OrgId)
            .IsRequired();

        // Enumeration relationships
        modelBuilder.Entity<TRecord>()
            .HasOne(x => x.EntityRoleTypeEnum)
            .WithMany()
            .HasForeignKey(x => x.RoleId)
            .IsRequired();

        // Indexes
#if RESELLER
        modelBuilder.Entity<TRecord>()
            .HasIndex(b => b.GroupId);
#endif
        modelBuilder.Entity<TRecord>()
            .HasIndex(b => b.TenantId);
        modelBuilder.Entity<TRecord>()
            .HasIndex(b => new { b.TenantId, b.OrgId, b.EntityId });
        modelBuilder.Entity<TRecord>()
            .HasIndex(b => new { b.TenantId, b.PersonId });

        // Seed data (optional)
        var createdAt = new DateTime(2024, 12, 1, 0, 0, 0, DateTimeKind.Utc);
        modelBuilder.Entity<TRecord>().HasData(new TRecord
        {
            Id = 1,
#if RESELLER
            GroupId = IdentitySeedData.GroupId,
#endif
            TenantId = IdentitySeedData.TenantId,
            OrgId = 1,
            EntityId = 1,
            PersonId = 1,
            RoleId = nameof(EntityRoleType.owner),
            EquityPercent = 1.0000m,
            StartAt = createdAt,
            CreatedAt = createdAt,
            UpdatedAt = createdAt
        });
    }
}
