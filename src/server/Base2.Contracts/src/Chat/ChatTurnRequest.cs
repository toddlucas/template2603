namespace Base2.Chat;

/// <summary>
/// A single chat turn request from the client.
/// </summary>
public class ChatTurnRequest
{
    /// <summary>
    /// The AI session ID. Caller-generated; ties all changesets produced in a session together.
    /// </summary>
    [Display(Name = "Session ID")]
    [Required]
    public Guid SessionId { get; set; }

    /// <summary>
    /// The full conversation history, including the new user message as the last entry.
    /// The client owns and maintains this list across turns.
    /// </summary>
    [Display(Name = "Messages")]
    [Required]
    public ChatMessageModel[] Messages { get; set; } = [];

    /// <summary>
    /// Document IDs to load as context for this turn.
    /// </summary>
    [Display(Name = "Document IDs")]
    public Guid[] DocumentIds { get; set; } = [];
}

/// <summary>
/// A single message in the conversation history.
/// </summary>
public class ChatMessageModel
{
    /// <summary>
    /// The role of the message author: "user", "assistant", or "tool".
    /// </summary>
    [Display(Name = "Role")]
    [Required]
    [StringLength(50)]
    public string Role { get; set; } = null!;

    /// <summary>
    /// The text content of the message. May be null or empty for assistant messages
    /// that contained only tool calls and no visible text.
    /// </summary>
    [Display(Name = "Content")]
    public string? Content { get; set; }
}
