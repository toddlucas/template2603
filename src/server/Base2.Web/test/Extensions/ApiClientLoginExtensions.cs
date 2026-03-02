using Microsoft.AspNetCore.Identity.Data;
using Microsoft.Net.Http.Headers;

namespace Base2.Web.Test;

internal static class ApiClientLoginExtensions
{
    private const string DefaultTestEmail = "bb@example.com";
    private const string DefaultTestPassword = "qw12QW!@";

    /// <summary>
    /// Login with default test credentials and set the bearer token for subsequent requests.
    /// </summary>
    public static async Task LoginAsync(this ApiClient client, CancellationToken cancellationToken = default)
    {
        var loginRequest = new LoginRequest
        {
            Email = DefaultTestEmail,
            Password = DefaultTestPassword
        };

        var tokenResponse = await client.PostLoginAsync(loginRequest, cancellationToken);
        if (tokenResponse == null)
        {
            throw new InvalidOperationException($"Login failed for user {DefaultTestEmail}");
        }

        // Set the bearer token for subsequent requests
        client.HttpClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokenResponse.AccessToken);
    }

    /// <summary>
    /// Login with custom credentials and set the bearer token for subsequent requests.
    /// </summary>
    public static async Task LoginAsync(this ApiClient client, string email, string password, CancellationToken cancellationToken = default)
    {
        var loginRequest = new LoginRequest
        {
            Email = email,
            Password = password
        };

        var tokenResponse = await client.PostLoginAsync(loginRequest, cancellationToken);
        if (tokenResponse == null)
        {
            throw new InvalidOperationException($"Login failed for user {email}");
        }

        // Set the bearer token for subsequent requests
        client.HttpClient.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokenResponse.AccessToken);
    }

    public static Dictionary<string, string> CreateBearerHeaders(this ApiClient client, string token)
        => new Dictionary<string, string> { [HeaderNames.Authorization] = $"Bearer {token}" };
}
