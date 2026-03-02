using System.Security.Claims;

using Microsoft.AspNetCore.Authentication;

// using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace Base2.Controllers.Auth;

[Route("api/[area]/[controller]")]
[Area(nameof(Auth))]
[Tags(nameof(Auth))]
[Authorize(Policy = AppPolicy.RequireUserRole)]
[ApiController]
public class StatusController(ILogger<StatusController> logger) : ControllerBase
{
    private readonly ILogger _logger = logger;

    /// <summary>
    /// Returns the authentication status for the current user.
    /// </summary>
    /// <returns>An authentication status object containing token expiry information.</returns>
    [HttpGet]
    [Produces(typeof(AuthStatusModel))]
    [EndpointDescription("Returns the authentication status including token expiry for the logged-in user.")]
    public async Task<ActionResult<AuthStatusModel>> Get()
    {
        var model = new AuthStatusModel();

        // Try to get the expiration claim from the JWT token
        string? expClaim = User.FindFirstValue("exp"); // JwtRegisteredClaimNames.Exp);
        if (expClaim is not null)
        {
            if (!string.IsNullOrEmpty(expClaim) && long.TryParse(expClaim, out long unixTimestamp))
            {
                model.ExpiresAt = unixTimestamp;
                model.ExpiresAtUtc = DateTimeOffset.FromUnixTimeSeconds(unixTimestamp).UtcDateTime;
            }
            else
            {
                _logger.LogWarning("Token expiration claim not found or invalid for user");
            }
        }
        else
        {
            var authResult = await HttpContext.AuthenticateAsync();
            var expiresUtc = authResult.Properties?.ExpiresUtc;
            if (expiresUtc is not null)
            {
                model.ExpiresAtUtc = expiresUtc.Value.UtcDateTime;
                model.ExpiresAt = expiresUtc.Value.ToUnixTimeSeconds();
            }
            else
            {
                _logger.LogWarning("Cookie expiration claim not found or invalid for user");
            }
        }

        return Ok(model);
    }
}
