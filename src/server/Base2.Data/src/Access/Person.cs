namespace Base2.Access;

using TRecord = Person;

public class Person : PersonModel, ITemporalRecord
{
    #region Internal properties

    /// <summary>
    /// The tenant ID this person belongs to.
    /// </summary>
    [Display(Name = "Tenant ID")]
    [Required]
    public Guid TenantId { get; set; }

    #endregion Internal properties

    #region Navigation properties

    /// <summary>
    /// The organization memberships.
    /// </summary>
    public ICollection<OrganizationMember> OrganizationMemberships { get; set; } = new List<OrganizationMember>();

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
        modelBuilder.Entity<TRecord>().ToTable(nameof(Person));

        // Column names (snake_case)
        modelBuilder.Entity<TRecord>().Property(x => x.Id).HasColumnName("id");
        modelBuilder.Entity<TRecord>().Property(x => x.TenantId).HasColumnName("tenant_id");
        modelBuilder.Entity<TRecord>().Property(x => x.GivenName).HasColumnName("given_name");
        modelBuilder.Entity<TRecord>().Property(x => x.FamilyName).HasColumnName("family_name");
        modelBuilder.Entity<TRecord>().Property(x => x.Email).HasColumnName("email");
        modelBuilder.Entity<TRecord>().Property(x => x.Phone).HasColumnName("phone");
        modelBuilder.Entity<TRecord>().Property(x => x.DateOfBirth).HasColumnName("dob");
        modelBuilder.Entity<TRecord>().Property(x => x.Addresses).HasColumnName("addresses");
        modelBuilder.Entity<TRecord>().Property(x => x.AuthProviderId).HasColumnName("auth_provider_id");
        modelBuilder.Entity<TRecord>().Property(x => x.Metadata).HasColumnName("metadata");
        modelBuilder.Entity<TRecord>().Property(x => x.CreatedAt).HasColumnName("created_at");
        modelBuilder.Entity<TRecord>().Property(x => x.UpdatedAt).HasColumnName("updated_at");
        modelBuilder.Entity<TRecord>().Property(x => x.DeletedAt).HasColumnName("deleted_at");

        // Indexes
        modelBuilder.Entity<TRecord>()
            .HasIndex(b => b.TenantId);
        modelBuilder.Entity<TRecord>()
            .HasIndex(b => new { b.TenantId, b.Email })
            .IsUnique();

        // Seed data (optional)
        var createdAt1 = new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc);
        var createdAt2 = new DateTime(2024, 2, 10, 0, 0, 0, DateTimeKind.Utc);
        var createdAt3 = new DateTime(2024, 3, 20, 0, 0, 0, DateTimeKind.Utc);
        var updatedAt1 = new DateTime(2024, 12, 19, 0, 0, 0, DateTimeKind.Utc);
        var updatedAt2 = new DateTime(2024, 11, 30, 0, 0, 0, DateTimeKind.Utc);
        var updatedAt3 = new DateTime(2024, 12, 15, 0, 0, 0, DateTimeKind.Utc);

        modelBuilder.Entity<TRecord>().HasData(
            new TRecord
            {
                Id = 1,
                TenantId = IdentitySeedData.TenantId,
                GivenName = "John",
                FamilyName = "Doe",
                Email = "john.doe@acme.com",
                Phone = "+1-555-0123",
                CreatedAt = createdAt1,
                UpdatedAt = updatedAt1
            },
            new TRecord
            {
                Id = 2,
                TenantId = IdentitySeedData.TenantId,
                GivenName = "Jane",
                FamilyName = "Smith",
                Email = "jane.smith@acme.com",
                Phone = "+1-555-0124",
                CreatedAt = createdAt2,
                UpdatedAt = updatedAt2
            },
            new TRecord
            {
                Id = 3,
                TenantId = IdentitySeedData.TenantId,
                GivenName = "Bob",
                FamilyName = "Johnson",
                Email = "bob.johnson@acme.com",
                Phone = "+1-555-0125",
                CreatedAt = createdAt3,
                UpdatedAt = updatedAt3
            }
        );
    }
}
