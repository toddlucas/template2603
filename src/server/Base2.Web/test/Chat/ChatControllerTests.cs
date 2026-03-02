using System.Net;
using System.Net.Mime;
using System.Runtime.CompilerServices;
using System.Text;

using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

using Base2.Chat;

namespace Base2.Web.Test.Chat;

/// <summary>
/// Controller-level integration tests for <see cref="Controllers.Chat.ChatController"/>.
/// Uses <see cref="WebApplicationFactory{TProgram}"/> with the in-memory SQLite database.
/// </summary>
[Collection(WebApplicationFactoryCollection.Name)]
public class ChatControllerTests(WebApplicationFactoryFixture fixture)
{
    private readonly WebApplicationFactory<Program> _baseFactory = fixture.Factory;

    private static readonly Guid ProjectId = Guid.NewGuid();

    // --- Factory helpers ---

    /// <summary>
    /// Creates a factory that replaces <see cref="IChatClient"/> with the given stub.
    /// </summary>
    private WebApplicationFactory<Program> WithChatClient(IChatClient chatClient) =>
        _baseFactory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IChatClient>();
                services.AddSingleton<IChatClient>(_ => chatClient);
            }));

    // --- Tests: unauthenticated ---

    [Fact]
    public async Task PostTurn_Unauthenticated_Returns401()
    {
        var client = new ApiClient(_baseFactory.CreateClient());
        var request = BuildRequest("Hello.");

        var response = await client.PostChatTurnAsync(ProjectId, request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // --- Tests: happy path ---

    [Fact]
    public async Task PostTurn_AuthenticatedWithStubClient_Returns200AndEventStream()
    {
        // Arrange: stub returns a single text chunk.
        var chatClient = new ScriptedChatClient(
        [
            new ChatResponseUpdate(ChatRole.Assistant, "Hello from the AI."),
        ]);

        var factory = WithChatClient(chatClient);
        var client = new ApiClient(factory.CreateClient());
        await client.LoginAsync();

        var request = BuildRequest("Say hello.");

        // Act
        var response = await client.PostChatTurnAsync(ProjectId, request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be(MediaTypeNames.Text.EventStream);

        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("event: text");
        body.Should().Contain("Hello from the AI.");
        body.Should().Contain("event: done");
    }

    [Fact]
    public async Task PostTurn_AuthenticatedWithNullBody_Returns400()
    {
        var factory = WithChatClient(new ScriptedChatClient([]));
        var client = new ApiClient(factory.CreateClient());
        await client.LoginAsync();

        // Send an empty body (no JSON).
        var response = await client.HttpClient.PostAsync(
            $"/api/projects/{ProjectId}/chat/turns",
            new StringContent(string.Empty, Encoding.UTF8, MediaTypeNames.Application.Json));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // --- Helpers ---

    private static ChatTurnRequest BuildRequest(string userMessage) => new()
    {
        SessionId = Guid.NewGuid(),
        Messages = [new ChatMessageModel { Role = "user", Content = userMessage }],
        DocumentIds = [],
    };
}

/// <summary>
/// A scripted <see cref="IChatClient"/> for controller-level tests.
/// </summary>
file sealed class ScriptedChatClient(IReadOnlyList<ChatResponseUpdate> updates) : IChatClient
{
    public Task<ChatResponse> GetResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new ChatResponse(new ChatMessage(ChatRole.Assistant, string.Empty)));

    public async IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        foreach (var update in updates)
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return update;
            await Task.Yield();
        }
    }

    public object? GetService(Type serviceType, object? serviceKey = null) => null;
    public void Dispose() { }
}
