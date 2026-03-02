namespace Microsoft.AspNetCore.Http;

public class ProblemType
{
    public static string Generic = "https://base2.one/problems/undefined-error";

    // Standard HTTP error codes
    public static string BadRequest = "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.1";
    public static string NotFound = "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.5";
    public static string Conflict = "https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.10";
    public static string ServerError = "https://tools.ietf.org/html/rfc9110#section-15.6.1";

}
