using System.Net.Mime;
using System.Text.Json;

using Base2.Chat;

namespace Base2.Controllers.Chat;

[Route("api/projects/{projectId:guid}/chat")]
[Tags("Chat")]
[Authorize(Policy = AppPolicy.RequireUserRole)]
[ApiController]
public class ChatController(
    ILogger<ChatController> logger,
    ChatService chatService) : ControllerBase
{
    private readonly ILogger _logger = logger;
    private readonly ChatService _chatService = chatService;

    private static readonly JsonSerializerOptions JsonOptions =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    /// <summary>
    /// Submit a chat turn and stream the assistant reply via Server-Sent Events.
    /// </summary>
    /// <remarks>
    /// The response is a text/event-stream. Events have one of four forms:
    ///
    ///   event: text
    ///   data: {"content":"..."}
    ///
    ///   event: tool_start
    ///   data: {"callId":"...","toolName":"..."}
    ///
    ///   event: tool_done
    ///   data: {"callId":"...","toolName":"..."}
    ///
    ///   event: done
    ///   data: {"changesets":[...]}
    ///
    /// The "done" event is always the last event and carries any changesets produced
    /// by the LLM's propose_edit tool calls during this turn.
    /// </remarks>
    /// <param name="projectId">The project in scope for this turn.</param>
    /// <param name="request">The turn request.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    [HttpPost("turns")]
    [TenantRead]
    [Produces(MediaTypeNames.Text.EventStream)]
    [EndpointDescription("Submits a chat turn and streams the assistant reply via Server-Sent Events.")]
    public async Task StreamTurn(
        Guid projectId,
        [FromBody] ChatTurnRequest request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            Response.StatusCode = StatusCodes.Status400BadRequest;
            return;
        }

        Response.Headers.ContentType = MediaTypeNames.Text.EventStream;
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        await foreach (var chunk in _chatService.StreamTurnAsync(projectId, request, cancellationToken))
        {
            switch (chunk)
            {
                case ChatStreamChunk.TextChunk text:
                    await WriteSseEventAsync("text",
                        JsonSerializer.Serialize(new { content = text.Content }, JsonOptions),
                        cancellationToken);
                    break;

                case ChatStreamChunk.ToolStartChunk toolStart:
                    await WriteSseEventAsync("tool_start",
                        JsonSerializer.Serialize(new { callId = toolStart.CallId, toolName = toolStart.ToolName }, JsonOptions),
                        cancellationToken);
                    break;

                case ChatStreamChunk.ToolDoneChunk toolDone:
                    await WriteSseEventAsync("tool_done",
                        JsonSerializer.Serialize(new { callId = toolDone.CallId, toolName = toolDone.ToolName }, JsonOptions),
                        cancellationToken);
                    break;

                case ChatStreamChunk.ProvisionalEditChunk pe:
                    await WriteSseEventAsync("provisional_edit",
                        JsonSerializer.Serialize(new
                        {
                            documentId = pe.DocumentId,
                            kind = pe.Kind,
                            elementId = pe.ElementId,
                            originalContent = pe.OriginalContent,
                            newContent = pe.NewContent,
                            positionAfter = pe.PositionAfter,
                        }, JsonOptions),
                        cancellationToken);
                    break;

                case ChatStreamChunk.DoneChunk done:
                    await WriteSseEventAsync("done",
                        JsonSerializer.Serialize(done.Response, JsonOptions),
                        cancellationToken);
                    break;
            }

            await Response.Body.FlushAsync(cancellationToken);
        }
    }

    private async Task WriteSseEventAsync(string eventName, string data, CancellationToken ct)
    {
        await Response.WriteAsync($"event: {eventName}\n", ct);
        await Response.WriteAsync($"data: {data}\n\n", ct);
    }
}
