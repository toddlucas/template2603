using Microsoft.AspNetCore.Authorization;

using Base2.Access;
using Base2.Pagination;

namespace Base2.Controllers.Access;

[Route("api/[area]/[controller]")]
[Area(nameof(Access))]
[Tags(nameof(Access))]
[Authorize(Policy = AppPolicy.RequireUserRole)]
[ApiController]
public class OrganizationController(
    ILogger<OrganizationController> logger,
    OrganizationService organizationService) : ControllerBase
{
    private readonly ILogger _logger = logger;
    private readonly OrganizationService _organizationService = organizationService;

    /// <summary>
    /// Get an organization
    /// </summary>
    /// <param name="id">The ID of the organization.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>An organization object.</returns>
    [HttpGet("{id:long}")]
    [TenantRead]
    [Produces(typeof(OrganizationModel))]
    [EndpointDescription("Returns an organization object.")]
    public async Task<ActionResult> Get(long id, CancellationToken cancellationToken)
    {
        if (id <= 0)
            return BadRequest();

        OrganizationModel? result = await _organizationService.ReadOrDefaultAsync(id, cancellationToken);
        if (result is null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Get an organization with details
    /// </summary>
    /// <param name="id">The ID of the organization.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>An organization details object.</returns>
    [HttpGet("{id:long}/detail")]
    [TenantRead]
    [Produces(typeof(OrganizationDetailModel))]
    //[EndpointDescription("Returns an organization details object with related entities.")]
    public async Task<ActionResult> GetDetail(long id, CancellationToken cancellationToken)
    {
        if (id <= 0)
            return BadRequest();

        OrganizationDetailModel? result = await _organizationService.ReadDetailOrDefaultAsync(id, cancellationToken);
        if (result is null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Get a list of organizations
    /// </summary>
    /// <param name="query">Pagination query parameters.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>A paginated list of organizations.</returns>
    [HttpGet]
    [TenantRead]
    [Produces("application/json", Type = typeof(PagedResult<OrganizationModel>))]
    [EndpointDescription("Returns a paginated list of organizations.")]
    public async Task<ActionResult> List([FromQuery] PagedQuery query, CancellationToken cancellationToken)
    {
        // No need to manually call _guard.EnsureReadAsync() - the aspect handles it!

        PagedResult<OrganizationModel, string?> result = await _organizationService.GetPagedAsync(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Create an organization
    /// </summary>
    /// <param name="model">The organization object.</param>
    /// <returns>The organization object.</returns>
    [HttpPost]
    [TenantWrite]
    [Produces(typeof(OrganizationModel))]
    [EndpointDescription("Creates an organization.")]
    public async Task<ActionResult> Post(OrganizationModel model)
    {
        if (model is null)
            return BadRequest();

        var (userId, tenantId, groupId) = User.GetUserIdentifiers();
        OrganizationModel result = await _organizationService.CreateAsync(userId, tenantId, groupId, model);
        return Ok(result);
    }

    /// <summary>
    /// Update an organization
    /// </summary>
    /// <param name="model">The organization object.</param>
    /// <returns>The organization object.</returns>
    [HttpPut]
    [TenantWrite]
    [Produces(typeof(OrganizationModel))]
    [EndpointDescription("Updates an organization.")]
    public async Task<ActionResult> Put(OrganizationModel model)
    {
        if (model is null)
            return BadRequest();

        OrganizationModel? result = await _organizationService.UpdateAsync(model);
        if (result is null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Delete an organization
    /// </summary>
    /// <param name="id">The ID of the organization.</param>
    [HttpDelete("{id:long}")]
    [TenantWrite]
    [Authorize(Policy = AppPolicy.RequireResellerRole)]
    [EndpointDescription("Deletes an organization.")]
    public async Task<ActionResult> Delete(long id)
    {
        if (id <= 0)
            return BadRequest();

        bool succeeded = await _organizationService.DeleteAsync(id);
        if (!succeeded)
            return NotFound();

        return NoContent();
    }

    /// <summary>
    /// Find organizations by name
    /// </summary>
    /// <param name="name">The name to search for.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>A list of matching organizations.</returns>
    [HttpGet("search")]
    [TenantRead]
    [Produces("application/json", Type = typeof(OrganizationModel[]))]
    [EndpointDescription("Finds organizations by name.")]
    public async Task<ActionResult> SearchByName([FromQuery] string name, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest();

        OrganizationModel[] results = await _organizationService.FindByNameAsync(name, cancellationToken);
        return Ok(results);
    }

    /// <summary>
    /// Find an organization by code
    /// </summary>
    /// <param name="code">The code to search for.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The organization or null if not found.</returns>
    [HttpGet("search/code")]
    [TenantRead]
    [Produces(typeof(OrganizationModel))]
    [EndpointDescription("Finds an organization by code.")]
    public async Task<ActionResult> SearchByCode([FromQuery] string code, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest();

        OrganizationModel? result = await _organizationService.FindByCodeAsync(code, cancellationToken);
        if (result is null)
            return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Find organizations by status
    /// </summary>
    /// <param name="status">The status to filter by.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>A list of organizations with the specified status.</returns>
    [HttpGet("search/status")]
    [TenantRead]
    [Produces("application/json", Type = typeof(OrganizationModel[]))]
    [EndpointDescription("Finds organizations by status.")]
    public async Task<ActionResult> SearchByStatus([FromQuery] string status, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(status))
            return BadRequest();

        OrganizationModel[] results = await _organizationService.FindByStatusAsync(status, cancellationToken);
        return Ok(results);
    }

    /// <summary>
    /// Get root organizations
    /// </summary>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>A list of root organizations without a parent.</returns>
    [HttpGet("root")]
    [TenantRead]
    [Produces("application/json", Type = typeof(OrganizationModel[]))]
    [EndpointDescription("Returns root organizations.")]
    public async Task<ActionResult> GetRoot(CancellationToken cancellationToken)
    {
        OrganizationModel[] results = await _organizationService.FindRootOrganizationsAsync(cancellationToken);
        return Ok(results);
    }

    /// <summary>
    /// Get child organizations
    /// </summary>
    /// <param name="id">The parent organization ID.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>Returns a list of child organizations.</returns>
    /// <remarks>Returns child organizations of a given parent organization.</remarks>
    [HttpGet("{id:long}/children")]
    [TenantRead]
    [Produces("application/json", Type = typeof(OrganizationModel[]))]
    public async Task<ActionResult> GetChildren(long id, CancellationToken cancellationToken)
    {
        if (id <= 0)
            return BadRequest();

        OrganizationModel[] results = await _organizationService.FindByParentAsync(id, cancellationToken);
        return Ok(results);
    }
}
