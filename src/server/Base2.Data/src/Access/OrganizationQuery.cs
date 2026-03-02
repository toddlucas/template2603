using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Base2.Access;

using Record = Organization;

/// <summary>
/// Organization query operations.
/// </summary>
public record OrganizationQuery(DbSet<Record> DbSet, ILogger logger)
{
    /// <summary>
    /// Gets a single organization by ID (read-only, no tracking).
    /// </summary>
    /// <param name="id">The organization ID.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The organization or null if not found.</returns>
    public Task<Record?> SingleOrDefaultAsync(long id, CancellationToken cancellationToken = default) => DbSet
        .Where(e => e.Id == id)
        .SingleOrDefaultAsync(cancellationToken);

    /// <summary>
    /// Gets a single organization by ID (with change tracking for updates).
    /// </summary>
    /// <param name="id">The organization ID.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The organization or null if not found.</returns>
    public Task<Record?> TrackOrDefaultAsync(long id, CancellationToken cancellationToken = default) => DbSet
        .AsTracking()
        .Where(e => e.Id == id)
        .SingleOrDefaultAsync(cancellationToken);

    /// <summary>
    /// Gets a single organization by ID with related entities (read-only, no tracking).
    /// </summary>
    /// <param name="id">The organization ID.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The organization with related entities or null if not found.</returns>
    public Task<Record?> SingleDetailOrDefaultAsync(long id, CancellationToken cancellationToken = default) => DbSet
        .Include(e => e.Members)
        .Include(e => e.ChildOrganizations)
        .Include(e => e.ParentOrganization)
        .Where(e => e.Id == id)
        .SingleOrDefaultAsync(cancellationToken);

    /// <summary>
    /// Gets a single organization by ID with related entities (with change tracking for updates).
    /// </summary>
    /// <param name="id">The organization ID.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The organization with related entities or null if not found.</returns>
    public Task<Record?> TrackDetailOrDefaultAsync(long id, CancellationToken cancellationToken = default) => DbSet
        .Include(e => e.Members)
        .Include(e => e.ChildOrganizations)
        .Include(e => e.ParentOrganization)
        .AsTracking()
        .Where(e => e.Id == id)
        .SingleOrDefaultAsync(cancellationToken);

    /// <summary>
    /// Gets all organizations.
    /// </summary>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>All organizations.</returns>
    public Task<Record[]> ListAsync(CancellationToken cancellationToken = default) => DbSet
        .ToArrayAsync(cancellationToken);

    /// <summary>
    /// Finds an organization by code.
    /// </summary>
    /// <param name="code">The organization code.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The organization or null if not found.</returns>
    public Task<Record?> FindByCodeAsync(string code, CancellationToken cancellationToken = default) => DbSet
        .Where(e => e.Code == code)
        .SingleOrDefaultAsync(cancellationToken);

    /// <summary>
    /// Finds organizations by name (partial match).
    /// </summary>
    /// <param name="name">The organization name to search for.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Matching organizations.</returns>
    public Task<Record[]> FindByNameAsync(string name, CancellationToken cancellationToken = default) => DbSet
        .Where(e => e.Name.Contains(name))
        .ToArrayAsync(cancellationToken);

    /// <summary>
    /// Finds organizations by parent organization ID.
    /// </summary>
    /// <param name="parentOrgId">The parent organization ID.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Child organizations.</returns>
    public Task<Record[]> FindByParentAsync(long parentOrgId, CancellationToken cancellationToken = default) => DbSet
        .Where(e => e.ParentOrgId == parentOrgId)
        .ToArrayAsync(cancellationToken);

    /// <summary>
    /// Finds root organizations (organizations without a parent).
    /// </summary>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Root organizations.</returns>
    public Task<Record[]> FindRootOrganizationsAsync(CancellationToken cancellationToken = default) => DbSet
        .Where(e => e.ParentOrgId == null)
        .ToArrayAsync(cancellationToken);

    /// <summary>
    /// Finds organizations by status.
    /// </summary>
    /// <param name="status">The organization status.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Organizations with the specified status.</returns>
    public Task<Record[]> FindByStatusAsync(string status, CancellationToken cancellationToken = default) => DbSet
        .Where(e => e.StatusId == status)
        .ToArrayAsync(cancellationToken);

    /// <summary>
    /// Finds organizations by name and status.
    /// </summary>
    /// <param name="name">The organization name to search for.</param>
    /// <param name="status">The organization status.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Matching organizations.</returns>
    public Task<Record[]> FindByNameAndStatusAsync(string name, string status, CancellationToken cancellationToken = default) => DbSet
        .Where(e => e.Name.Contains(name) && e.StatusId == status)
        .ToArrayAsync(cancellationToken);

    /// <summary>
    /// Finds organizations with a specific code pattern.
    /// </summary>
    /// <param name="codePattern">The code pattern to search for.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Organizations matching the code pattern.</returns>
    public Task<Record[]> FindByCodePatternAsync(string codePattern, CancellationToken cancellationToken = default) => DbSet
        .Where(e => e.Code != null && e.Code.Contains(codePattern))
        .ToArrayAsync(cancellationToken);
}
