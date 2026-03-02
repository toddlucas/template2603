using System.Runtime.CompilerServices;

using Microsoft.Extensions.AI;

namespace Base2.Chat;

/// <summary>
/// A no-op <see cref="IChatClient"/> used when no API key is configured.
/// Throws <see cref="InvalidOperationException"/> if actually invoked, so
/// misconfiguration is surfaced at call time rather than at startup.
/// </summary>
internal sealed class NullChatClient : IChatClient
{
    public Task<ChatResponse> GetResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException(
            "No AI API key is configured. Set ChatClient:ApiKey in application settings.");


#pragma warning disable CS1998, CS0162
    public async IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException(
            "No AI API key is configured. Set ChatClient:ApiKey in application settings.");
        yield break;
    }
#pragma warning restore CS1998, CS0162

    public object? GetService(Type serviceType, object? serviceKey = null) => null;
    public void Dispose() { }
}
