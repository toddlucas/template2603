using System.Net.Http.Json;
using System.Text.Json;

using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.AspNetCore.Identity.Data;

namespace Base2.Web.Test;

public class ApiClient(HttpClient client)
{
    private readonly HttpClient _client = client;
    private readonly JsonSerializerOptions _options = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public HttpClient HttpClient => _client;

    /// <summary>
    /// Login using token mode (bearer token).
    /// </summary>
    /// <param name="login">The login request with email and password.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The access token response or null if login failed.</returns>
    public async Task<AccessTokenResponse?> PostLoginAsync(LoginRequest login, CancellationToken cancellationToken = default)
    {
        // Use token mode (not cookies) by not passing useCookies parameter
        var response = await _client.PostAsJsonAsync("/api/auth/login", login, _options, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        // The response should contain the bearer token in the response body
        var tokenResponse = await response.Content.ReadFromJsonAsync<AccessTokenResponse>(_options, cancellationToken);
        return tokenResponse;
    }
}
