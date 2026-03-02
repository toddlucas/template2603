using Microsoft.AspNetCore.Identity;

using Base2.Access;

namespace Base2.Data;

/// <summary>
/// The app database context.
/// </summary>
public class AppDbContext :
#if RESELLER
    TenantIdentityDbContext<ApplicationUser, IdentityRole<Guid>, IdentityGroup<Guid>, ApplicationTenant, Guid>
#else
    TenantIdentityDbContext<ApplicationUser, IdentityRole<Guid>, ApplicationTenant, Guid>
#endif
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="AppDbContext" />
    /// class using the specified options.
    /// </summary>
    /// <remarks>
    /// Requires a non-generic DbContextOptions in order to be used with
    /// TestSqliteDatabaseSet. But this is at odds with design-time creation.
    /// So we must use our own design-time factory.
    /// https://learn.microsoft.com/en-us/ef/core/cli/dbcontext-creation
    /// </remarks>
    private AppDbContext(DbContextOptions options)
        : base(options)
    {
    }

    public static AppDbContext Create(DbContextOptions options)
    {
        return new AppDbContext(options);
    }

    #region Identity

    // public DbSet<Profile> Profiles { get; set; } = null!;

    #endregion Identity

    #region Access

    public DbSet<Organization> Organizations { get; set; } = null!;
    public DbSet<OrganizationMember> OrganizationMembers { get; set; } = null!;
    public DbSet<Person> People { get; set; } = null!;

    #endregion Access

    protected bool IsUsingSqliteProvider => Database.ProviderName!.Contains("Sqlite", StringComparison.OrdinalIgnoreCase);

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // optionsBuilder.UseLoggerFactory(MyLoggerFactory);
        optionsBuilder.EnableSensitiveDataLogging(true);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        if (IsUsingSqliteProvider)
            modelBuilder.AddSqliteDateTimeOffset();

        // ApplicationTenant.OnModelCreating(modelBuilder);
        IdentityModel.OnModelCreating(modelBuilder);

        // Identity
        //Profile.OnModelCreating(modelBuilder);

        // Access entities
        Organization.OnModelCreating(modelBuilder);
        OrganizationMember.OnModelCreating(modelBuilder);
        Person.OnModelCreating(modelBuilder);

        modelBuilder.Snakeify();

        // Access enumerations
        EnumerationBuilder.OnStringCreating(modelBuilder, OrganizationStatusEnum.GetAll(), OrganizationStatusEnum.KeyLength, "organization_status");
        EnumerationBuilder.OnStringCreating(modelBuilder, OrganizationMemberRoleEnum.GetAll(), OrganizationMemberRoleEnum.KeyLength, "organization_member_role");
        EnumerationBuilder.OnStringCreating(modelBuilder, OrganizationMemberStatusEnum.GetAll(), OrganizationMemberStatusEnum.KeyLength, "organization_member_status");
    }
}
