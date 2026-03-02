# Development Tokens Guide

How to obtain and use auth tokens when testing the API locally with curl.

## Why `dotnet user-jwts` Doesn't Work Here

`dotnet user-jwts` is a great tool for apps that use the standard JWT bearer middleware (`AddJwtBearer`). It generates a signed JWT and automatically configures the matching signing key in user secrets so the app trusts it.

This app uses **ASP.NET Core Identity's bearer token scheme** (`AddIdentityApiEndpoints` + `IdentityConstants.BearerScheme`) instead. Identity issues its own opaque tokens that are validated against the database — not via a signing key. Tokens from `dotnet user-jwts` will be rejected because the app isn't configured to trust them.

For reference, here's what the `dotnet user-jwts` command would look like if it were applicable:

```bash
# Not usable here — for reference only
dotnet user-jwts create \
  --issuer "issuer-name" \
  --audience "http://localhost/" \
  --role User \
  --name <user-id> \
  --claim "special:uri=example"
```

## Getting a Token via Login

The correct approach is to log in through the Identity API endpoint and capture the `accessToken` from the response.

```bash
TOKEN=$(curl -s -X POST http://localhost:8181/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bb@example.com","password":"qw12QW!@"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
```

The token is valid for the duration configured in `BearerTokenOptions` (default is 1 hour).

## Using the Token with curl

Pass the token as a `Bearer` in the `Authorization` header:

```bash
# List documents for a project
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8181/api/projects/{projectId}/documents

# Register a document with a project
curl -X POST http://localhost:8181/api/projects/123e4567-e89b-12d3-a456-426614174000/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"providerId":"my-doc.docx","name":"My Doc"}'
```

## Required Role

All endpoints under `DocumentsController` (and most other controllers) require the `User` role via `[Authorize(Policy = AppPolicy.RequireUserRole)]`. The token obtained by logging in as a normal user account will already have this role — no extra configuration needed.

## Background

This was a deliberate trade-off in ASP.NET Core Identity's design. A few reasons:

**Revocability.** Standard JWTs are stateless — once issued, they're valid until they expire and there's no built-in way to invalidate them. Identity's bearer tokens are backed by the database, so you can revoke them (e.g. on logout, password change, or security events) and the invalidation takes effect immediately.

**No key management burden.** JWT signing requires generating, storing, rotating, and protecting a signing key. Identity's scheme sidesteps that entirely for the common case — no key to leak, rotate, or misconfigure.

**Refresh token pairing.** Identity issues an `accessToken` + `refreshToken` pair out of the box. With standard JWTs you have to build the refresh flow yourself, including secure storage and rotation of the refresh token.

**Simplicity for cookie-based apps.** Identity was originally designed around cookie auth. The bearer token support (`AddIdentityApiEndpoints`) was added later as a lightweight API-friendly option, and it reuses the same database-backed session model rather than bolting on a separate JWT infrastructure.
