namespace Base2.Chat;

/// <summary>
/// Configuration options for the OpenAI chat client.
/// </summary>
public class ChatClientOptions
{
    /// <summary>
    /// The configuration section name.
    /// </summary>
    public const string SectionName = "ChatClient";

    /// <summary>
    /// The OpenAI API key.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// The model to use (e.g. "gpt-4o", "gpt-4o-mini").
    /// </summary>
    public string Model { get; set; } = "gpt-4o";

    /// <summary>
    /// When set, the raw <c>editedMarkdown</c> argument from every <c>propose_edit</c> tool call
    /// is written to this directory as a timestamped <c>.md</c> file before reconciliation runs.
    /// Null (default) disables capture entirely — no filesystem access occurs.
    /// </summary>
    /// <remarks>
    /// Intended for local development only. Set via <c>ChatClient:CaptureDir</c> in
    /// <c>appsettings.Development.json</c> or an environment variable override.
    /// </remarks>
    public string? CaptureDir { get; set; }
}
