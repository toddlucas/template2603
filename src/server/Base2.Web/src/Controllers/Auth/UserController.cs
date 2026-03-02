using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

using Base2.Data.Identity;
using Base2.Data;

namespace Base2.Controllers.Auth;

[Route("api/[area]/[controller]")]
[Area(nameof(Auth))]
[Tags(nameof(Auth))]
[Authorize(Policy = AppPolicy.RequireUserRole)]
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
    /// Returns the current user.
    /// </summary>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>A user object.</returns>
    [HttpGet]
    [Produces(typeof(IdentityUserModel))]
    [EndpointDescription("Returns the user object for the logged-in user.")]
    public async Task<ActionResult> Get(CancellationToken cancellationToken)
    {
        Guid id = User.GetNameIdentifier();

        // Ensure read transaction with tenant context
        await _guard.EnsureReadAsync(cancellationToken);

        ApplicationUser? result = await _userManager.Users.Where(u => u.Id == id).SingleOrDefaultAsync();
        if (result is null)
            return NotFound();

        return Ok(result.ToModel());
    }

    /// <summary>
    /// Updates the user object.
    /// </summary>
    /// <param name="model">The user object.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>The updated user object.</returns>
    [HttpPut]
    [Produces(typeof(IdentityUserModel))]
    public async Task<ActionResult> Put(IdentityUserModel model, CancellationToken cancellationToken)
    {
        Guid id = User.GetNameIdentifier();

        // Start with read transaction to check if user exists
        await _guard.EnsureReadAsync(cancellationToken);

        ApplicationUser? record = await _userManager.Users.Where(u => u.Id == id).SingleOrDefaultAsync();
        if (record is null)
            return BadRequest();

        // Promote to write transaction for the update
        await _guard.EnsureWriteAsync(cancellationToken);

        record.UpdateFrom(model);
        await _userManager.UpdateAsync(record);

        // Read the updated result (still in write transaction)
        ApplicationUser? result = await _userManager.Users.Where(u => u.Id == id).SingleOrDefaultAsync();
        if (result is null)
            return BadRequest();

        return Ok(result.ToModel());
    }
}
