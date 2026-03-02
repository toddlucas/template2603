using System.IdentityModel.Tokens.Jwt;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

using Base2.Identity;

namespace Base2.Controllers.Auth;

[Route("api/[area]/[controller]")]
[Area(nameof(Auth))]
[Tags(nameof(Auth))]
[ApiController]
public class ExternalController(
    ILogger<ExternalController> logger,
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    ITenantProvisioningService tenantProvisioning,
    IOptions<ExternalAuthSettings> externalAuthOptions) : ControllerBase
{
    private readonly ILogger _logger = logger;
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly SignInManager<ApplicationUser> _signInManager = signInManager;
    private readonly ITenantProvisioningService _tenantProvisioning = tenantProvisioning;
    private readonly ExternalAuthSettings _externalAuth = externalAuthOptions.Value;

    public record ExternalTokenRequest(string Provider, string IdToken);

    /// <summary>
    /// Validates an ID token from an external provider and issues a bearer token.
    /// </summary>
    [HttpPost("token")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ExchangeToken(
        [FromBody] ExternalTokenRequest request,
        CancellationToken cancellationToken)
    {
        ClaimsPrincipalResult? parsed;

        try
        {
            parsed = request.Provider switch
            {
                "Microsoft" => await ValidateMicrosoftTokenAsync(request.IdToken, cancellationToken),
                _ => null,
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "External token validation failed for provider {Provider}.", request.Provider);
            return Unauthorized();
        }

        if (parsed is null)
        {
            _logger.LogWarning("Unsupported external auth provider: {Provider}.", request.Provider);
            return Unauthorized();
        }

        // Find existing user by external login, then fall back to email.
        var loginInfo = new UserLoginInfo(request.Provider, parsed.Subject, request.Provider);
        var user = await _userManager.FindByLoginAsync(request.Provider, parsed.Subject);

        if (user is null && !string.IsNullOrEmpty(parsed.Email))
        {
            user = await _userManager.FindByEmailAsync(parsed.Email);

            // Link this provider to the existing email-registered account.
            if (user is not null)
            {
                var addLoginResult = await _userManager.AddLoginAsync(user, loginInfo);
                if (!addLoginResult.Succeeded)
                {
                    _logger.LogWarning(
                        "Failed to link {Provider} to existing user {Email}: {Errors}",
                        request.Provider,
                        parsed.Email,
                        string.Join(", ", addLoginResult.Errors.Select(e => e.Description)));
                    return Unauthorized();
                }
            }
        }

        if (user is null)
        {
            // New user — create account.
            user = new ApplicationUser();

            var userStore = HttpContext.RequestServices.GetRequiredService<IUserStore<ApplicationUser>>();
            var emailStore = (IUserEmailStore<ApplicationUser>)userStore;

            await userStore.SetUserNameAsync(user, parsed.Email, cancellationToken);
            await emailStore.SetEmailAsync(user, parsed.Email, cancellationToken);

            // Social provider already verified the email.
            user.EmailConfirmed = true;

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                _logger.LogWarning(
                    "Failed to create user for {Email}: {Errors}",
                    parsed.Email,
                    string.Join(", ", createResult.Errors.Select(e => e.Description)));
                return Unauthorized();
            }

            await _userManager.AddLoginAsync(user, loginInfo);
            await _tenantProvisioning.ProvisionAsync(user, cancellationToken);
            await _userManager.AddToRoleAsync(user, AppRole.User);
        }

        _signInManager.AuthenticationScheme = IdentityConstants.BearerScheme;
        await _signInManager.SignInAsync(user, isPersistent: false);

        // SignInAsync has already written the AccessTokenResponse to the response body.
        // Return an empty result so the MVC pipeline does not attempt a second write.
        return new EmptyResult();
    }

    public record ExternalLoginModel(string LoginProvider, string ProviderKey, string? ProviderDisplayName);

    /// <summary>
    /// Returns the external login providers linked to the current user.
    /// </summary>
    [HttpGet("logins")]
    [Authorize(Policy = AppPolicy.RequireUserRole)]
    [ProducesResponseType(typeof(IList<ExternalLoginModel>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLogins()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null) return NotFound();

        var logins = await _userManager.GetLoginsAsync(user);
        return Ok(logins.Select(l => new ExternalLoginModel(l.LoginProvider, l.ProviderKey, l.ProviderDisplayName)));
    }

    /// <summary>
    /// Removes an external login provider from the current user's account.
    /// </summary>
    [HttpDelete("login/{provider}")]
    [Authorize(Policy = AppPolicy.RequireUserRole)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteLogin(string provider)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null) return NotFound();

        var logins = await _userManager.GetLoginsAsync(user);
        var login = logins.SingleOrDefault(l => l.LoginProvider == provider);
        if (login is null) return NotFound();

        var result = await _userManager.RemoveLoginAsync(user, login.LoginProvider, login.ProviderKey);
        if (!result.Succeeded)
            return BadRequest(result.Errors.Select(e => e.Description));

        return NoContent();
    }

    // -------------------------------------------------------------------------

    private record ClaimsPrincipalResult(string Subject, string Email);

    private async Task<ClaimsPrincipalResult> ValidateMicrosoftTokenAsync(
        string idToken,
        CancellationToken cancellationToken)
    {
        var tenantId = _externalAuth.Microsoft.TenantId;
        var clientId = _externalAuth.Microsoft.ClientId;

        var metadataAddress =
            $"https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration";

        var configManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            metadataAddress,
            new OpenIdConnectConfigurationRetriever(),
            new HttpDocumentRetriever());

        var oidcConfig = await configManager.GetConfigurationAsync(cancellationToken);

        var validationParams = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuers =
            [
                $"https://login.microsoftonline.com/{tenantId}/v2.0",
                // Personal Microsoft accounts use a shared MSA issuer.
                "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
            ],
            ValidateAudience = true,
            ValidAudience = clientId,
            ValidateLifetime = true,
            IssuerSigningKeys = oidcConfig.SigningKeys,
        };

        var handler = new JwtSecurityTokenHandler();
        handler.ValidateToken(idToken, validationParams, out var securityToken);

        var jwt = (JwtSecurityToken)securityToken;

        var subject =
            jwt.Claims.FirstOrDefault(c => c.Type == "oid")?.Value
            ?? throw new SecurityTokenException("Microsoft ID token missing 'oid' claim.");

        var email =
            jwt.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value
            ?? jwt.Claims.FirstOrDefault(c => c.Type == "preferred_username")?.Value
            ?? throw new SecurityTokenException("Microsoft ID token missing email claim.");

        return new ClaimsPrincipalResult(subject, email);
    }
}
