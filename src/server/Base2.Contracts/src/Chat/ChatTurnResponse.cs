namespace Base2.Chat;

/// <summary>
/// The final result of a chat turn, returned after the stream closes.
/// </summary>
/// <remarks>
/// For streaming responses, the text content is delivered via SSE chunks.
/// This model is serialized as the final SSE event (event: done) so the client
/// can capture any changesets produced during tool execution.
/// </remarks>
public class ChatTurnResponse
{
    ///// <summary>
    ///// Any changesets created by the LLM's propose_edit tool calls during this turn.
    ///// Empty if the LLM produced only a text reply.
    ///// </summary>
    //public ChangesetModel[] Changesets { get; set; } = [];
}
