using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

using Base2.Data.Identity;
using Base2.Data;
using Base2.Pagination;

namespace Base2.Controllers.Identity;

[Route("api/[area]/[controller]")]
[Area(nameof(Identity))]
[Tags(nameof(Identity))]
[Authorize(Policy = AppPolicy.RequireAdminRole)]
[ApiExplorerSettings(IgnoreApi = true)]
[ApiController]
public class UserController(
    ILogger<UserController> logger,
    UserManager<ApplicationUser> userManager,
    [FromKeyedServices(nameof(AppDbContext))] IRequestDbGuard guard) : ControllerBase
{
    private readonly ILogger _logger = logger;
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly IRequestDbGuard _guard = guard;

    /// <summary>
    /// Returns a user.
    /// </summary>
    /// <param name="id">The ID of the user.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>A user object.</returns>
    [HttpGet]
    [TenantRead]
    // [EndpointSummary("/api/demographics/profile")]
    [EndpointDescription("Returns a user details object.")]
    public async Task<ActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        if (id == Guid.Empty)
            return BadRequest();

        // No need to manually call _guard.EnsureReadAsync() - the aspect handles it!

        // TODO: Map to IdentityUserModel.
        ApplicationUser? result = await _userManager.Users.Where(u => u.Id == id).SingleOrDefaultAsync();
        if (result is null)
            return NotFound();

        return Ok(result.ToModel());
    }

    /// <summary>
    /// Returns a list of users.
    /// </summary>
    /// <param name="query">Pagination query parameters.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>A list of users.</returns>
    [HttpGet("list")]
    [TenantRead]
    [EndpointDescription("Returns a paginated list of users.")]
    public async Task<ActionResult> List([FromQuery] PagedQuery query, CancellationToken cancellationToken)
    {
        // No need to manually call _guard.EnsureReadAsync() - the aspect handles it!

        IQueryable<ApplicationUser> queryable = _userManager.Users;

        query.Search((term) =>
        {
            queryable = queryable
                .Where(c => c.Email!.ToLower().Contains(term));
        });

        ApplicationUser[] records = await queryable
            .OrderByPage(query, nameof(IdentityUser.Id))
            .Paginate(query, out int count)
            .ToArrayAsync(cancellationToken);

        return Ok(PagedResult.Create(records.ToModels(), count, (string?)null));
    }
}
