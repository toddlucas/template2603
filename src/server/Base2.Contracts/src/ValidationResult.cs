namespace Base2;

/// <summary>
/// Result of a validation operation.
/// Used across features for configuration validation, connection testing, and activation checks.
/// </summary>
public class ValidationResult
{
    /// <summary>
    /// Whether the validation was successful.
    /// </summary>
    public bool IsValid { get; set; }

    /// <summary>
    /// Validation message (can be success or error details).
    /// </summary>
    public string? Message { get; set; }

    /// <summary>
    /// List of validation errors (multiple errors).
    /// </summary>
    public List<string>? Errors { get; set; }

    /// <summary>
    /// Additional validation details or metadata.
    /// </summary>
    public Dictionary<string, string>? Details { get; set; }
}

