using System.Runtime.CompilerServices;

using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;

using Base2.Chat;

namespace Base2.Services.Test.Chat;

/// <summary>
/// Unit tests for <see cref="ChatService.StreamTurnAsync"/>.
/// Uses scripted <see cref="IChatClient"/> stubs to drive deterministic scenarios.
/// <see cref="IChatDocumentService"/> and <see cref="IChatChangesetService"/> are substituted
/// via NSubstitute; no database is required.
/// </summary>
public class ChatServiceTests
{
    private static readonly Guid ProjectId = Guid.NewGuid();
    private static readonly Guid SessionId = Guid.NewGuid();

    // --- Helpers ---

    private static ChatService BuildChatService(
        IChatClient chatClient) =>
        new(
            chatClient,
            Options.Create(new ChatClientOptions()),
            NullLogger<ChatService>.Instance);

    private static ChatTurnRequest BuildRequest(string userMessage, Guid[]? documentIds = null) => new()
    {
        SessionId = SessionId,
        Messages = [new ChatMessageModel { Role = "user", Content = userMessage }],
        DocumentIds = documentIds ?? [],
    };

    private static async Task<List<ChatStreamChunk>> CollectChunksAsync(
        ChatService service,
        ChatTurnRequest request)
    {
        var chunks = new List<ChatStreamChunk>();
        await foreach (var chunk in service.StreamTurnAsync(ProjectId, request))
            chunks.Add(chunk);
        return chunks;
    }

    // --- Tests ---

    [Fact]
    public async Task StreamTurnAsync_NoToolCalls_YieldsTextChunksAndDoneChunk()
    {
        // Arrange: LLM returns a plain text reply with no tool calls.
        var chatClient = new ScriptedChatClient(
        [
            new ChatResponseUpdate(ChatRole.Assistant, "Hello, "),
            new ChatResponseUpdate(ChatRole.Assistant, "world!"),
        ]);

        var service = BuildChatService(chatClient);
        var request = BuildRequest("Say hello.");

        // Act
        var chunks = await CollectChunksAsync(service, request);

        // Assert: two text chunks then one done chunk.
        chunks.OfType<ChatStreamChunk.TextChunk>().Should().HaveCount(2);
        chunks.OfType<ChatStreamChunk.TextChunk>().Select(c => c.Content).Should().Equal("Hello, ", "world!");

        var done = chunks.OfType<ChatStreamChunk.DoneChunk>().Single();
        //done.Response.Changesets.Should().BeEmpty();
    }

    [Fact]
    public async Task StreamTurnAsync_EmptyDocumentIds_SucceedsWithNoDocumentContext()
    {
        // Arrange: no documents requested, LLM gives a simple reply.
        var chatClient = new ScriptedChatClient(
        [
            new ChatResponseUpdate(ChatRole.Assistant, "No docs needed."),
        ]);

        var service = BuildChatService(chatClient);
        var request = BuildRequest("Just chat.", documentIds: []);

        // Act
        var chunks = await CollectChunksAsync(service, request);

        // Assert: succeeds normally.
        chunks.OfType<ChatStreamChunk.TextChunk>().Should().HaveCount(1);
        //chunks.OfType<ChatStreamChunk.DoneChunk>().Single().Response.Changesets.Should().BeEmpty();
    }

    [Fact]
    public async Task StreamTurnAsync_MultipleUserMessages_PassesFullHistoryToClient()
    {
        // Arrange: verify the client receives all messages in the history.
        List<IEnumerable<ChatMessage>>? capturedMessages = null;

        var chatClient = new CapturingChatClient(
            captured => capturedMessages = captured,
            [new ChatResponseUpdate(ChatRole.Assistant, "OK.")]);

        var service = BuildChatService(chatClient);
        var request = new ChatTurnRequest
        {
            SessionId = SessionId,
            Messages =
            [
                new ChatMessageModel { Role = "user", Content = "First message." },
                new ChatMessageModel { Role = "assistant", Content = "First reply." },
                new ChatMessageModel { Role = "user", Content = "Second message." },
            ],
            DocumentIds = [],
        };

        // Act
        await CollectChunksAsync(service, request);

        // Assert: the messages sent to the client include system prompt(s) + all 3 history messages.
        capturedMessages.Should().NotBeNull();
        var sent = capturedMessages!.SelectMany(m => m).ToList();

        // At minimum: 1 system prompt + 3 history messages.
        sent.Count.Should().BeGreaterThanOrEqualTo(4);
        sent.Where(m => m.Role == ChatRole.System).Should().NotBeEmpty();
        sent.Where(m => m.Role == ChatRole.User).Should().HaveCount(2);
        sent.Where(m => m.Role == ChatRole.Assistant).Should().HaveCount(1);
    }

    [Fact]
    public async Task StreamTurnAsync_DoneChunk_IsAlwaysLastChunk()
    {
        // Arrange
        var chatClient = new ScriptedChatClient(
        [
            new ChatResponseUpdate(ChatRole.Assistant, "A"),
            new ChatResponseUpdate(ChatRole.Assistant, "B"),
            new ChatResponseUpdate(ChatRole.Assistant, "C"),
        ]);

        var service = BuildChatService(chatClient);
        var chunks = await CollectChunksAsync(service, BuildRequest("Go."));

        // Assert: done is last.
        chunks.Last().Should().BeOfType<ChatStreamChunk.DoneChunk>();
    }
}

/// <summary>
/// A scripted <see cref="IChatClient"/> that returns a fixed sequence of <see cref="ChatResponseUpdate"/> values.
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

/// <summary>
/// A capturing <see cref="IChatClient"/> that records the messages it receives, then returns scripted updates.
/// </summary>
file sealed class CapturingChatClient(
    Action<List<IEnumerable<ChatMessage>>> onCapture,
    IReadOnlyList<ChatResponseUpdate> updates) : IChatClient
{
    private readonly List<IEnumerable<ChatMessage>> _captured = [];

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
        _captured.Add(messages.ToList());
        onCapture(_captured);

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
