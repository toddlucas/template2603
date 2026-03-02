namespace Base2.Identity;

public class ExternalAuthSettings
{
    public const string SectionName = "ExternalAuth";

    public MicrosoftAuthSettings Microsoft { get; set; } = new();
    public GoogleAuthSettings Google { get; set; } = new();
}

public class MicrosoftAuthSettings
{
    public string ClientId { get; set; } = "";
    public string TenantId { get; set; } = "common";
}

public class GoogleAuthSettings
{
    public string ClientId { get; set; } = "";
}
