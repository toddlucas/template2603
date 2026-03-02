using System.Security.Claims;

namespace Microsoft.AspNetCore.Mvc;

public static class ClaimsPrincipalExtensions
{
    //public static long? GetNameIdentifierOrDefault(this ClaimsPrincipal principal)
    //    => principal.FindFirstInt64Value(ClaimTypes.NameIdentifier);

    //public static long GetNameIdentifier(this ClaimsPrincipal principal)
    //    => principal.RequireFirstInt64Value(ClaimTypes.NameIdentifier);

    public static Guid? GetNameIdentifierOrDefault(this ClaimsPrincipal principal)
        => principal.FindFirstGuidValue(ClaimTypes.NameIdentifier);

    public static Guid GetNameIdentifier(this ClaimsPrincipal principal)
        => principal.RequireFirstGuidValue(ClaimTypes.NameIdentifier);

    public static string RequireFirstValue(this ClaimsPrincipal principal, string claimType)
    {
        string? claimValue = principal.FindFirstValue(claimType);
        if (claimValue == null)
            throw new Exception("Claim value not found for {claimType}");

        return claimValue;
    }

    public static long RequireFirstInt64Value(this ClaimsPrincipal principal, string claimType)
    {
        string? claimValue = principal.RequireFirstValue(claimType);
        if (claimValue == null)
            throw new Exception("Claim value not found for {claimType}");

        if (!long.TryParse(claimValue, out long value))
            throw new Exception("Claim value is not Int64 for {claimType}");

        return value;
    }

    public static long? FindFirstInt64Value(this ClaimsPrincipal principal, string claimType)
    {
        string? claimValue = principal.FindFirstValue(claimType);
        if (claimValue == null)
            return null;

        if (!long.TryParse(claimValue, out long value))
            return null;

        return value;
    }

    public static Guid RequireFirstGuidValue(this ClaimsPrincipal principal, string claimType)
    {
        string? claimValue = principal.RequireFirstValue(claimType);
        if (claimValue == null)
            throw new Exception("Claim value not found for {claimType}");

        if (!Guid.TryParse(claimValue, out Guid value))
            throw new Exception("Claim value is not Int64 for {claimType}");

        return value;
    }

    public static Guid? FindFirstGuidValue(this ClaimsPrincipal principal, string claimType)
    {
        string? claimValue = principal.FindFirstValue(claimType);
        if (claimValue == null)
            return null;

        if (!Guid.TryParse(claimValue, out Guid value))
            return null;

        return value;
    }
}
