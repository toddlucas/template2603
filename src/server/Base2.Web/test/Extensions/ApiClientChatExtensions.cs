using System.Net.Http.Json;
using System.Text.Json;

using Base2.Chat;

namespace Base2.Web.Test;

internal static class ApiClientChatExtensions
{
    private static readonly JsonSerializerOptions Options = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public static Task<HttpResponseMessage> PostChatTurnAsync(
        this ApiClient client,
        Guid projectId,
        ChatTurnRequest request) =>
        client.HttpClient.PostAsJsonAsync($"/api/projects/{projectId}/chat/turns", request, Options);
}
