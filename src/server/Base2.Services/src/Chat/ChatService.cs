using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Channels;

using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;

namespace Base2.Chat;

/// <summary>
/// Orchestrates a single chat turn: builds the LLM prompt, dispatches tool calls,
/// and streams the assistant reply back to the caller.
/// </summary>
/// <remarks>
/// The service is stateless across turns. The caller owns the conversation history
/// and submits the full <see cref="ChatTurnRequest.Messages"/> list on every request.
///
/// Tool-call dispatch is handled by the M.E.AI function-invocation middleware registered
/// on <see cref="IChatClient"/> at startup. The service drives the agentic loop by
/// repeatedly calling <see cref="IChatClient.CompleteStreamingAsync"/> until the model
/// produces a final text reply with no further tool calls.
/// </remarks>
public class ChatService(
    IChatClient chatClient,
    IOptions<ChatClientOptions> options,
    ILogger<ChatService> logger)
{
    private readonly ILogger _logger = logger;
    private readonly IChatClient _chatClient = chatClient;
    private readonly string? _captureDir = options.Value.CaptureDir;

    /// <summary>
    /// Executes a chat turn, streaming assistant text chunks and collecting any changesets
    /// produced by tool calls.
    /// </summary>
    /// <param name="projectId">The project in scope for this turn.</param>
    /// <param name="request">The turn request including session ID, messages, and document IDs.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>
    /// An async enumerable of <see cref="ChatStreamChunk"/> values. Text chunks carry the
    /// incremental assistant reply. The final chunk is always a <see cref="ChatStreamChunk.Done"/>
    /// carrying the <see cref="ChatTurnResponse"/> with any produced changesets.
    /// </returns>
    public async IAsyncEnumerable<ChatStreamChunk> StreamTurnAsync(
        Guid projectId,
        ChatTurnRequest request,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var messages = await BuildMessagesAsync(projectId, request, cancellationToken);

        // Unbounded channel: tool closures write tool-call events; we drain it between text chunks.
        var toolEvents = Channel.CreateUnbounded<ChatStreamChunk>(
            new UnboundedChannelOptions { SingleWriter = false, SingleReader = true });

        var tools = BuildTools(projectId, request.SessionId, toolEvents.Writer);
        var options = new ChatOptions { Tools = tools };

        var replyBuilder = new StringBuilder();

        await foreach (var chunk in _chatClient.GetStreamingResponseAsync(messages, options, cancellationToken))
        {
            // Drain any tool events that arrived before this text chunk.
            while (toolEvents.Reader.TryRead(out var toolEvent))
                yield return toolEvent;

            var text = chunk.Text;
            if (!string.IsNullOrEmpty(text))
            {
                replyBuilder.Append(text);
                yield return ChatStreamChunk.Text(text);
            }
        }

        // Drain any remaining tool events (e.g. the final propose_edit done).
        while (toolEvents.Reader.TryRead(out var toolEvent))
            yield return toolEvent;

        _logger.LogInformation(
            "Chat turn complete for project {ProjectId}, session {SessionId}. Reply length: {Length} chars.",
            projectId, request.SessionId, replyBuilder.Length);

        yield return ChatStreamChunk.Done(new ChatTurnResponse()); // { Changesets = [.. createdChangesets] });
    }

    // --- Private helpers ---

    /// <summary>
    /// Writes <paramref name="editedMarkdown"/> to <see cref="_captureDir"/> as a timestamped file.
    /// No-ops when <see cref="_captureDir"/> is null. Failures are logged and swallowed — capture
    /// is best-effort and must never interrupt the chat turn.
    /// </summary>
    private void CaptureEditedMarkdown(Guid documentId, string editedMarkdown)
    {
        if (string.IsNullOrWhiteSpace(_captureDir))
            return;

        try
        {
            Directory.CreateDirectory(_captureDir);
            string timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss-fff");
            string fileName = $"{timestamp}-doc-{documentId:N}.md";
            string path = Path.Combine(_captureDir, fileName);
            File.WriteAllText(path, editedMarkdown);
            _logger.LogDebug("Captured editedMarkdown to {Path}.", path);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to capture editedMarkdown to {CaptureDir}. Continuing.", _captureDir);
        }
    }

    /// <summary>
    /// Builds the full message list: system prompt + document context + caller history.
    /// </summary>
    private async Task<List<ChatMessage>> BuildMessagesAsync(
        Guid projectId,
        ChatTurnRequest request,
        CancellationToken cancellationToken)
    {
        var messages = new List<ChatMessage>();

        // System prompt
        messages.Add(new ChatMessage(ChatRole.System, BuildSystemPrompt()));

        // Inject document context as a system message so it doesn't pollute the user turn.
        //if (request.DocumentIds.Length > 0)
        //{
        //    var contextBuilder = new StringBuilder();
        //    contextBuilder.AppendLine("The following documents are available as context for this conversation:");
        //    contextBuilder.AppendLine();

        //    foreach (var docId in request.DocumentIds)
        //    {
        //        try
        //        {
        //            var doc = await _documentService.ReadOrDefaultAsync(docId, cancellationToken);
        //            var markdown = await _documentService.GetMarkdownAsync(docId, cancellationToken);

        //            contextBuilder.AppendLine($"### Document: {doc?.Name ?? docId.ToString()} (id: {docId})");
        //            contextBuilder.AppendLine();
        //            contextBuilder.AppendLine(markdown);
        //            contextBuilder.AppendLine();
        //        }
        //        catch (Exception ex)
        //        {
        //            _logger.LogWarning(ex, "Failed to load document {DocumentId} for chat context.", docId);
        //        }
        //    }

        //    messages.Add(new ChatMessage(ChatRole.System, contextBuilder.ToString()));
        //}

        // Caller's conversation history (user + assistant turns)
        foreach (var msg in request.Messages)
        {
            var role = msg.Role.ToLowerInvariant() switch
            {
                "assistant" => ChatRole.Assistant,
                "tool" => ChatRole.Tool,
                _ => ChatRole.User,
            };
            messages.Add(new ChatMessage(role, msg.Content ?? string.Empty));
        }

        return messages;
    }

    private static string BuildSystemPrompt() =>
        """
        You are a document editing assistant. You help users review, revise, and improve documents.

        You have access to tools that let you read documents and propose edits. When a user asks you
        to change a document, use the propose_edit tool to create a structured changeset that the user
        can review and approve or reject before any changes are applied.

        Guidelines:
        - Always read a document before proposing edits to it.
        - Describe your proposed changes clearly before calling propose_edit.
        - Preserve the author's voice and intent unless asked to change it.
        - When proposing edits, provide the complete revised markdown for the affected document.
        """;

    /// <summary>
    /// Builds the M.E.AI tool list for this turn.
    /// Tool closures write <see cref="ChatStreamChunk.ToolCallChunk"/> events to <paramref name="toolEvents"/>
    /// so the caller can stream tool activity to the client in real time.
    /// </summary>
    private List<AITool> BuildTools(
        Guid projectId,
        Guid sessionId,
        ChannelWriter<ChatStreamChunk> toolEvents)
    {
        return
        [
            //AIFunctionFactory.Create(
            //    async (CancellationToken ct) =>
            //    {
            //        var callId = Guid.NewGuid().ToString("N")[..8];
            //        await toolEvents.WriteAsync(ChatStreamChunk.ToolStart(callId, "list_documents"), ct);
            //        var result = await _documentService.ListByProjectAsync(projectId, ct);
            //        await toolEvents.WriteAsync(ChatStreamChunk.ToolDone(callId, "list_documents"), ct);
            //        return result;
            //    },
            //    name: "list_documents",
            //    description: "Lists all documents registered with the current project. Returns document names and IDs."),

            //AIFunctionFactory.Create(
            //    async (Guid documentId, CancellationToken ct) =>
            //    {
            //        var callId = Guid.NewGuid().ToString("N")[..8];
            //        await toolEvents.WriteAsync(ChatStreamChunk.ToolStart(callId, "read_document"), ct);
            //        var result = await _documentService.GetMarkdownAsync(documentId, ct);
            //        await toolEvents.WriteAsync(ChatStreamChunk.ToolDone(callId, "read_document"), ct);
            //        return result;
            //    },
            //    name: "read_document",
            //    description: "Fetches the full markdown content of a document. Call this before proposing any edits."),

            //AIFunctionFactory.Create(
            //    async (Guid documentId, string description, string editedMarkdown, CancellationToken ct) =>
            //    {
            //        var callId = Guid.NewGuid().ToString("N")[..8];
            //        await toolEvents.WriteAsync(ChatStreamChunk.ToolStart(callId, "propose_edit"), ct);
            //        var metadata = _documentService.GetCachedMetadata(documentId);

            //        // Capture the raw LLM markdown before reconciliation so it can be replayed later.
            //        CaptureEditedMarkdown(documentId, editedMarkdown);

            //        // Emit provisional edits so the client can show live redlines
            //        // while the changeset is being persisted.
            //        var ops = _reconciler.Reconcile(metadata, editedMarkdown);
            //        foreach (var update in ops.Updates)
            //            await toolEvents.WriteAsync(ChatStreamChunk.ProvisionalEdit(
            //                documentId, "update", update.ElementId, update.OriginalContent, update.NewContent, null), ct);
            //        foreach (var insert in ops.Inserts)
            //            await toolEvents.WriteAsync(ChatStreamChunk.ProvisionalEdit(
            //                documentId, "insert", null, null, insert.NewContent, insert.PositionAfter), ct);
            //        foreach (var delete in ops.Deletes)
            //            await toolEvents.WriteAsync(ChatStreamChunk.ProvisionalEdit(
            //                documentId, "delete", delete.ElementId, delete.OriginalContent, null, null), ct);

            //        var changeset = await _changesetService.CreateAsync(
            //            projectId, sessionId, documentId, metadata, editedMarkdown, description, ct);
            //        _logger.LogInformation(
            //            "Tool propose_edit created changeset {ChangesetId} for document {DocumentId}.",
            //            changeset.Id, documentId);
            //        createdChangesets.Add(changeset);
            //        await toolEvents.WriteAsync(ChatStreamChunk.ToolDone(callId, "propose_edit"), ct);
            //        return changeset;
            //    },
            //    name: "propose_edit",
            //    description: """
            //        Proposes a set of edits to a document. Creates a pending changeset that the user
            //        must approve before any changes are written to cloud storage.
            //        Provide the complete revised markdown for the document, not just the changed sections.
            //        You must call read_document before calling this tool.
            //        """),

            //AIFunctionFactory.Create(
            //    async (Guid changesetId, CancellationToken ct) =>
            //    {
            //        var callId = Guid.NewGuid().ToString("N")[..8];
            //        await toolEvents.WriteAsync(ChatStreamChunk.ToolStart(callId, "get_changeset"), ct);
            //        var result = await _changesetService.GetAsync(changesetId, ct);
            //        await toolEvents.WriteAsync(ChatStreamChunk.ToolDone(callId, "get_changeset"), ct);
            //        return result;
            //    },
            //    name: "get_changeset",
            //    description: "Retrieves a previously created changeset and its edit details."),
        ];
    }
}

/// <summary>
/// A discriminated chunk in the chat stream.
/// </summary>
public abstract record ChatStreamChunk
{
    private ChatStreamChunk() { }

    /// <summary>
    /// An incremental text fragment from the assistant reply.
    /// </summary>
    public sealed record TextChunk(string Content) : ChatStreamChunk;

    /// <summary>
    /// Emitted when a tool call begins. <see cref="CallId"/> correlates with the matching
    /// <see cref="ToolDoneChunk"/> so the client can track concurrent calls.
    /// </summary>
    public sealed record ToolStartChunk(string CallId, string ToolName) : ChatStreamChunk;

    /// <summary>
    /// Emitted when a tool call completes successfully.
    /// </summary>
    public sealed record ToolDoneChunk(string CallId, string ToolName) : ChatStreamChunk;

    /// <summary>
    /// The final chunk, emitted once after the full reply is complete.
    /// Carries any changesets produced during tool execution.
    /// </summary>
    public sealed record DoneChunk(ChatTurnResponse Response) : ChatStreamChunk;

    /// <summary>
    /// Emitted for each element-level change immediately after reconciliation,
    /// before the changeset is persisted. Lets the client show live redlines.
    /// </summary>
    /// <param name="DocumentId">The document being edited.</param>
    /// <param name="Kind">"update", "insert", or "delete".</param>
    /// <param name="ElementId">The stable element ID (null for inserts).</param>
    /// <param name="OriginalContent">The element's current content (null for inserts).</param>
    /// <param name="NewContent">The replacement content (null for deletes).</param>
    /// <param name="PositionAfter">The preceding element ID anchor (inserts only).</param>
    public sealed record ProvisionalEditChunk(
        Guid DocumentId,
        string Kind,
        string? ElementId,
        string? OriginalContent,
        string? NewContent,
        string? PositionAfter) : ChatStreamChunk;

    /// <summary>Creates a text chunk.</summary>
    public static ChatStreamChunk Text(string content) => new TextChunk(content);

    /// <summary>Creates a tool-start chunk.</summary>
    public static ChatStreamChunk ToolStart(string callId, string toolName) => new ToolStartChunk(callId, toolName);

    /// <summary>Creates a tool-done chunk.</summary>
    public static ChatStreamChunk ToolDone(string callId, string toolName) => new ToolDoneChunk(callId, toolName);

    /// <summary>Creates the terminal done chunk.</summary>
    public static ChatStreamChunk Done(ChatTurnResponse response) => new DoneChunk(response);

    /// <summary>Creates a provisional-edit chunk for one reconciled operation.</summary>
    public static ChatStreamChunk ProvisionalEdit(
        Guid documentId, string kind, string? elementId,
        string? originalContent, string? newContent, string? positionAfter)
        => new ProvisionalEditChunk(documentId, kind, elementId, originalContent, newContent, positionAfter);
}
