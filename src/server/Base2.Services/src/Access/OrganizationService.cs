using Base2.Pagination;

namespace Base2.Access;

using Record = Organization;
using Model = OrganizationModel;
using DetailModel = OrganizationDetailModel;

/// <summary>
/// Organization service for business logic and data operations.
/// </summary>
public class OrganizationService(AppDbContext dbContext, ILogger<OrganizationService> logger)
{
    private readonly ILogger _logger = logger;
    private readonly AppDbContext _dbContext = dbContext;
    private readonly DbSet<Record> _dbSet = dbContext.Organizations;
    private readonly OrganizationQuery _query = new(dbContext.Organizations, logger);

    /// <summary>
    /// Gets a single organization by ID.
    /// </summary>
    /// <param name="id">The organization ID.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The organization model or null if not found.</returns>
    public async Task<Model?> ReadOrDefaultAsync(long id, CancellationToken cancellationToken = default)
    {
        Record? record = await _query.SingleOrDefaultAsync(id, cancellationToken);
        return record?.ToModel();
    }

    /// <summary>
    /// Gets a single organization by ID with related entities.
    /// </summary>
    /// <param name="id">The organization ID.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The organization detail model or null if not found.</returns>
    public async Task<DetailModel?> ReadDetailOrDefaultAsync(long id, CancellationToken cancellationToken = default)
    {
        Record? record = await _query.SingleDetailOrDefaultAsync(id, cancellationToken);
        return record?.ToDetailModel();
    }

    /// <summary>
    /// Gets all organizations.
    /// </summary>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>All organization models.</returns>
    public async Task<Model[]> ListAsync(CancellationToken cancellationToken = default)
    {
        Record[] records = await _query.ListAsync(cancellationToken);
        return records.ToModels();
    }

    /// <summary>
    /// Creates a new organization.
    /// </summary>
    /// <param name="userId">The ID of the user creating the organization.</param>
    /// <param name="tenantId">The tenant ID for data isolation.</param>
    /// <param name="groupId">The group ID for group isolation.</param>
    /// <param name="model">The organization model.</param>
    /// <returns>The created organization model.</returns>
    public async Task<Model> CreateAsync(Guid userId, Guid tenantId, Guid groupId, Model model)
    {
        Record record = model.ToRecord();
        record.TenantId = tenantId;
#if RESELLER
        record.GroupId = groupId;
#endif
        record.CreatedAt = record.UpdatedAt = DateTime.UtcNow;

        _dbSet.Add(record);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Created organization {OrganizationId} with name '{Name}'.", record.Id, record.Name);
        return record.ToModel();
    }

    /// <summary>
    /// Updates an existing organization.
    /// </summary>
    /// <param name="model">The organization model.</param>
    /// <returns>The updated organization model or null if not found.</returns>
    public async Task<Model?> UpdateAsync(Model model)
    {
        Record? record = await _query.TrackOrDefaultAsync(model.Id);
        if (record is null)
        {
            _logger.LogWarning("Attempted to update non-existent organization {OrganizationId}.", model.Id);
            return null;
        }

        record.UpdateFrom(model);
        record.UpdatedAt = DateTime.UtcNow;

        _dbSet.Update(record);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Updated organization {OrganizationId} with name '{Name}'.", record.Id, record.Name);
        return record.ToModel();
    }

    /// <summary>
    /// Deletes an organization.
    /// </summary>
    /// <param name="id">The organization ID.</param>
    /// <returns>True if the organization was deleted, false if not found.</returns>
    public async Task<bool> DeleteAsync(long id)
    {
        Record? record = await _query.TrackOrDefaultAsync(id);
        if (record == null)
        {
            _logger.LogWarning("Attempted to delete non-existent organization {OrganizationId}.", id);
            return false;
        }

        _dbSet.Remove(record);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Deleted organization {OrganizationId} with name '{Name}'.", id, record.Name);
        return true;
    }

    /// <summary>
    /// Finds an organization by code.
    /// </summary>
    /// <param name="code">The organization code.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The organization model or null if not found.</returns>
    public async Task<Model?> FindByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        Record? record = await _query.FindByCodeAsync(code, cancellationToken);
        return record?.ToModel();
    }

    /// <summary>
    /// Finds organizations by name (partial match).
    /// </summary>
    /// <param name="name">The organization name to search for.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Matching organization models.</returns>
    public async Task<Model[]> FindByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        Record[] records = await _query.FindByNameAsync(name, cancellationToken);
        return records.ToModels();
    }

    /// <summary>
    /// Finds organizations by parent organization ID.
    /// </summary>
    /// <param name="parentOrgId">The parent organization ID.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Child organization models.</returns>
    public async Task<Model[]> FindByParentAsync(long parentOrgId, CancellationToken cancellationToken = default)
    {
        Record[] records = await _query.FindByParentAsync(parentOrgId, cancellationToken);
        return records.ToModels();
    }

    /// <summary>
    /// Finds root organizations (organizations without a parent).
    /// </summary>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Root organization models.</returns>
    public async Task<Model[]> FindRootOrganizationsAsync(CancellationToken cancellationToken = default)
    {
        Record[] records = await _query.FindRootOrganizationsAsync(cancellationToken);
        return records.ToModels();
    }

    /// <summary>
    /// Finds organizations by status.
    /// </summary>
    /// <param name="status">The organization status.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Organization models with the specified status.</returns>
    public async Task<Model[]> FindByStatusAsync(string status, CancellationToken cancellationToken = default)
    {
        Record[] records = await _query.FindByStatusAsync(status, cancellationToken);
        return records.ToModels();
    }

    /// <summary>
    /// Finds organizations by name and status.
    /// </summary>
    /// <param name="name">The organization name to search for.</param>
    /// <param name="status">The organization status.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Matching organization models.</returns>
    public async Task<Model[]> FindByNameAndStatusAsync(string name, string status, CancellationToken cancellationToken = default)
    {
        Record[] records = await _query.FindByNameAndStatusAsync(name, status, cancellationToken);
        return records.ToModels();
    }

    /// <summary>
    /// Gets a paginated list of organizations with search and sorting support.
    /// </summary>
    /// <param name="query">Pagination query parameters.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>A paginated result of organization models.</returns>
    public async Task<PagedResult<Model, string?>> GetPagedAsync(PagedQuery query, CancellationToken cancellationToken = default)
    {
        IQueryable<Record> queryable = _dbSet.AsQueryable();

        query.Search((term) =>
        {
            queryable = queryable
                .Where(o => o.Name.ToLower().Contains(term) ||
                           o.Code!.ToLower().Contains(term) ||
                           o.Metadata!.ToLower().Contains(term));
        });

        Record[] records = await queryable
            .OrderByPage(query, nameof(Record.Name))
            .Paginate(query, out int count)
            .ToArrayAsync(cancellationToken);

        return PagedResult.Create(records.ToModels(), count, (string?)null);
    }
}
