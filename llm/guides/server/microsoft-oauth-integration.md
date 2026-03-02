# External OAuth Integration Guide

How to add Microsoft/O365 (and Google) sign-in to the SPA, and why the standard ASP.NET Core approach doesn't quite fit.

## The Gap

`AddIdentityApiEndpoints` and the ASP.NET Core social login providers (`AddMicrosoftAccount`, `AddGoogle`, etc.) solve different problems and were not designed to work together in a SPA context.

The social login providers follow the **redirect-based OAuth flow** built for server-rendered Razor Pages apps. The user leaves the page, the provider sends them to a callback URL on the server, and the server issues a cookie. The browser never has to think about it.

`AddIdentityApiEndpoints` follows a **bearer token flow** built for SPAs and native clients. There are no redirects and no cookies — the client POSTs credentials, gets back an `AccessTokenResponse`, and manages the tokens itself.

These two flows have fundamentally different shapes. Connecting them requires a bridge. There is no official Microsoft documentation or ASP.NET Core scaffolding for this specific combination. The ASP.NET Core team's own guidance (from a GitHub thread) is: **"We recommend using cookies for browser-based scenarios."**

## Three Options

### Option 1: Switch to cookies for the OAuth flow

Use `VITE_AUTH_TYPE=cookie` and lean on the standard social login flow. After the callback, the server issues an application cookie and the browser handles it automatically. No custom bridging code.

**Pros:** Fully documented, minimal custom code, aligns with Microsoft's recommendation for browser apps.

**Cons:** Requires cookie mode everywhere (or managing a hybrid where email login uses bearer but social login uses cookies). Cookie auth has cross-site concerns (SameSite configuration, CORS) that need attention. Does not work well for mobile clients.

### Option 2: Client-side ID token (Recommended)

Each provider has a client-side SDK (MSAL for Microsoft, Google Identity Services for Google) that handles the OAuth flow in the browser via a popup. The SDK returns an ID token. The app POSTs it to a single generic server endpoint (`POST /api/auth/external-token`), which validates the token and issues a normal `AccessTokenResponse`.

```
Client: acquire ID token via provider SDK popup
    ↓
Client: POST /api/auth/external-token { provider, idToken }
    ↓
Server: validate ID token against provider's JWKS endpoint
    ↓
Server: find or create ApplicationUser, return AccessTokenResponse
```

**Pros:** Works naturally with bearer tokens and mobile. No redirect dance. Documented by each provider. Server endpoint is provider-agnostic and testable in isolation. The same MSAL session can later acquire Graph API tokens for SharePoint/OneDrive without re-authentication.

**Cons:** Adds client-side SDK dependencies (MSAL ~200 KB, GIS ~50 KB). ID tokens are JWTs but require provider-specific validation configuration on the server.

### Option 3: Custom exchange code bridge

Use `AddMicrosoftAccount` for the redirect flow. After the callback the server generates a short-lived one-time code (stored in `IMemoryCache`), redirects to the SPA at `/external-login?code={code}`, and the SPA redeems it with `POST /api/auth/exchange-code` to get an `AccessTokenResponse`.

**Pros:** No client-side OAuth library. Stays within the ASP.NET Core Identity redirect model.

**Cons:** No official documentation or sample. The exchange code is a custom security-sensitive piece that needs careful implementation (TTL, one-time use enforcement, no code-fixation attacks). Difficult to adapt for mobile clients — the redirect flow has no clean landing point in a native app without deep links / universal links.

## Why Option 2 for This App

### Bearer tokens and mobile

The existing auth model is bearer-token-first. All token management, storage, and refresh logic in `authStore` and `authService` is built around bearer tokens. Option 2 slots in without changing that model. Bearer tokens are also the correct auth model for mobile clients (stored in system Keychain/Keystore), whereas cookies require additional work on mobile. The exchange code approach (Option 3) has no clean solution for mobile without deep links.

### Multi-provider from the start

Google also issues OIDC ID tokens. By designing a single server endpoint that accepts `{ provider, idToken }`, you handle Microsoft and Google with one implementation. Each provider uses a different JWKS endpoint and different claim names for the subject, but the user find/create/token-issue logic is shared. Adding more providers later is additive.

### SharePoint and OneDrive

Because the product works with documents on SharePoint and OneDrive, the Microsoft sign-in is not just for authentication — it is also the gateway to Graph API access. The same MSAL instance used for sign-in can silently acquire Graph API tokens for SharePoint/OneDrive operations without prompting the user again:

```typescript
// No re-login — uses the existing MSAL session
const graphToken = await msalInstance.acquireTokenSilent({
  scopes: ['Files.ReadWrite', 'Sites.Read.All'],
  account: msalInstance.getAllAccounts()[0],
});
```

This is only possible with Option 2. The exchange code approach gives the client a Product Name bearer token but no path to Graph API tokens.

## Friction Points with ASP.NET Core Identity

Option 2 is the right choice, but it is not a frictionless drop-in. These are the non-obvious integration points.

### 1. Issuing bearer tokens from a controller

The Identity bearer token infrastructure writes the `AccessTokenResponse` to the HTTP response body via `BearerTokenHandler.HandleSignInAsync` when you call `HttpContext.SignInAsync`. There is no injectable `ITokenService` that returns an `AccessTokenResponse` you can hand back from a controller action cleanly. The two practical options are:

- Call `_signInManager.AuthenticationScheme = IdentityConstants.BearerScheme` then `await _signInManager.SignInAsync(user, isPersistent: false)`, then return `TypedResults.Empty`. This is exactly the pattern the existing minimal API login endpoint uses.
- Validate the ID token manually using `Microsoft.IdentityModel.Tokens` (without adding a new auth scheme) and use the `BearerTokenOptions` protectors to build the `AccessTokenResponse` directly.

The second option is more surgical — it avoids registering a new authentication scheme entirely, which eliminates the scheme conflict risk described below.

### 2. Adding `Microsoft.Identity.Web` introduces a new auth scheme

`AddMicrosoftIdentityWebApi` registers a new JWT bearer scheme. This sits alongside `IdentityConstants.BearerScheme` and could become the default challenge scheme, silently breaking existing `[Authorize]` endpoints. If you use this package, the scheme must be explicitly named and must not override the default. Manual token validation with `Microsoft.IdentityModel.Tokens` avoids this entirely.

### 3. Tenant assignment is not an injectable service

The tenant creation/assignment logic lives inside the `/api/auth/register` minimal API endpoint in `IdentityApiEndpointRouteBuilderExtensions.cs`, not in an injectable service. For new users signing in via a social provider for the first time, the `ExternalAuthController` needs to replicate or call into this logic. Before implementing, read the register endpoint and extract the tenant logic into a shared service that both the register endpoint and the new controller can use.

### 4. Email confirmation must be set explicitly

The server has `RequireConfirmedAccount = true`. Social provider users have a verified email by definition, but ASP.NET Core Identity does not know that. When creating the `ApplicationUser` for a new social login, `EmailConfirmed` must be set to `true` explicitly — otherwise the user will be silently locked out on the next sign-in attempt.

```csharp
var user = new ApplicationUser
{
    Email = email,
    UserName = email,
    EmailConfirmed = true, // required — social provider already verified this
    TenantId = tenantId,
};
```

## Two Tokens, Two Libraries

This is the most important thing to understand about the implementation: there are two completely separate tokens in the flow, and they use different libraries for different reasons.

### Token 1 — The incoming Microsoft/Google ID token

When the user completes the MSAL popup, Microsoft (or Google) issues a **JWT ID token**. This token is a standard JSON Web Token with a signature from the provider's private key. The client POSTs it to `POST /api/auth/external-token` as proof of identity.

The server's job is to verify this proof:

1. Fetch the provider's public signing keys from their OIDC discovery endpoint
2. Verify the token signature against those keys
3. Confirm the audience (`aud` claim) matches your client ID
4. Confirm the token has not expired
5. Extract the user's email and subject identifier

`Microsoft.IdentityModel.Tokens` and `System.IdentityModel.Tokens.Jwt` handle steps 1–5. These are low-level JWT validation libraries — they do nothing else. The ID token is consumed here and never stored or reused.

### Token 2 — The outgoing Product Name bearer token

After the ID token is validated and the user is found or created, the server calls:

```csharp
_signInManager.AuthenticationScheme = IdentityConstants.BearerScheme;
await _signInManager.SignInAsync(user, isPersistent: false);
```

This is the **exact same call** the email/password login endpoint makes. It produces ASP.NET Core Identity's opaque bearer token — not a JWT — in the same `AccessTokenResponse` format the client already knows how to handle. The existing bearer token infrastructure is completely unchanged.

```
Microsoft/Google ID token (JWT)          Product Name bearer token (opaque)
─────────────────────────────────        ──────────────────────────────
Issued by:  Microsoft / Google           Issued by:  your server
Used for:   proving identity once        Used for:   all subsequent API calls
Arrives in: POST /api/auth/external-token body        Authorization: Bearer header
Validated:  JwtSecurityTokenHandler      Validated:  IdentityConstants.BearerScheme
Discarded:  immediately after login      Refreshed:  via /api/auth/refresh
```

From the rest of the app's perspective, a Microsoft or Google login is indistinguishable from an email/password login — it just takes a different route to get there.

### Why not `Microsoft.Identity.Web`?

`Microsoft.Identity.Web` is a higher-level package that does the JWT validation above, but it also registers a **new authentication scheme** in the ASP.NET Core pipeline. The app already has `IdentityConstants.BearerScheme` registered as the scheme for all API endpoints. Adding a second scheme risks overriding the default, causing every `[Authorize]` endpoint to start validating requests against Microsoft's public keys instead of Identity's opaque tokens — silently breaking all existing logins.

Using `Microsoft.IdentityModel.Tokens` directly avoids registering any new scheme. The ID token is validated as a one-time operation inside the controller, and the result is discarded after the user identity is established. The authentication pipeline is never involved.

## Implementation Outline

### Server

**NuGet:** `Microsoft.IdentityModel.Tokens` and `System.IdentityModel.Tokens.Jwt` (for manual ID token validation). These are already transitive dependencies in most ASP.NET Core projects. Avoids adding a full `Microsoft.Identity.Web` auth scheme.

**New settings classes:**

```csharp
// Base2.Services/src/Identity/ExternalAuthSettings.cs
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
```

**New shared service — `ITenantProvisioningService`:**

Extract the tenant creation/assignment logic from the `/register` endpoint into an injectable service used by both the register endpoint and the new `ExternalAuthController`.

**New controller — `ExternalController.cs`:**

```
POST /api/auth/external/token
Body: { provider: "Microsoft" | "Google", idToken: string }

1. Validate ID token against provider's JWKS endpoint
   - Microsoft: https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration
   - Google: https://accounts.google.com/.well-known/openid-configuration
2. Extract email + subject (OID for Microsoft, sub for Google)
3. Find user by external login record (provider + subject key), then fall back to email
4. New user: CreateAsync (EmailConfirmed=true) + AddLoginAsync + provision tenant + assign User role
5. Existing user: ensure external login record exists
6. _signInManager.AuthenticationScheme = IdentityConstants.BearerScheme
   await _signInManager.SignInAsync(user, isPersistent: false)
   return new EmptyResult()
```

**Account management endpoints (same for all providers):**

```
GET    /api/auth/external/logins          → UserManager.GetLoginsAsync
DELETE /api/auth/external/login/{provider} → UserManager.RemoveLoginAsync
```

### Client

**Microsoft — `@azure/msal-browser`:**

```typescript
// features/auth/providers/microsoftProvider.ts
import { PublicClientApplication } from '@azure/msal-browser';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage', // persists across sessions; avoids repeated MFA
  },
});

// Called from main.tsx before React mounts. Returns true if this window is an
// MSAL popup redirect and should not mount React.
export async function handleMsalStartup(): Promise<boolean> {
  const isPopupRedirect =
    window.location.search.includes('code=') ||
    window.location.search.includes('error=') ||
    window.location.hash.includes('code=') ||
    window.location.hash.includes('error=');

  if (isPopupRedirect) {
    try { await broadcastResponseToMainFrame(); } catch { }
    window.close();
    return true;
  }

  await msalInstance.initialize().catch(() => {});
  return false;
}

export const signInWithMicrosoft = async (): Promise<string> => {
  // Try silent first — returns immediately if a valid cached session exists.
  const account = msalInstance.getAllAccounts()[0];
  if (account) {
    try {
      const result = await msalInstance.acquireTokenSilent({ scopes: LOGIN_SCOPES, account });
      return result.idToken;
    } catch { /* fall through to popup */ }
  }

  const result = await msalInstance.loginPopup({
    scopes: LOGIN_SCOPES,
    overrideInteractionInProgress: true,
  });
  return result.idToken;
};

// Later, for SharePoint/OneDrive — no re-login required
export const acquireGraphToken = () =>
  msalInstance.acquireTokenSilent({
    scopes: ['Files.ReadWrite', 'Sites.Read.All'],
    account: msalInstance.getAllAccounts()[0],
  });
```

**`main.tsx`:**

```typescript
import { handleMsalStartup } from '$/features/auth/providers/microsoftProvider';

if (!await handleMsalStartup()) {
  createRoot(document.getElementById('root')!).render(...);
}
```

**Google — Google Identity Services:**

```typescript
// features/auth/providers/googleProvider.ts
export const signInWithGoogle = (): Promise<string> =>
  new Promise((resolve, reject) => {
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response) => resolve(response.credential),
    });
    google.accounts.id.prompt((notification) => {
      if (notification.isSkippedMoment()) reject(new Error('Google sign-in skipped'));
    });
  });
```

**Generic API call — `authApi.ts`:**

```typescript
export const postExternalToken = async (provider: 'Microsoft' | 'Google', idToken: string) =>
  postModel<{ provider: string; idToken: string }, AccessTokenResponse>(
    '/api/auth/external/token',
    { provider, idToken }
  );
```

**`authStore.ts`:**

```typescript
loginWithMicrosoft: async () => {
  const idToken = await signInWithMicrosoft();
  const response = await postExternalToken('Microsoft', idToken);
  // store same as postLogin
},
loginWithGoogle: async () => {
  const idToken = await signInWithGoogle();
  const response = await postExternalToken('Google', idToken);
  // store same as postLogin
},
```

**`AuthCard.tsx`:**

```tsx
<Button onClick={() => loginWithMicrosoft()}>Continue with Microsoft</Button>
<Button onClick={() => loginWithGoogle()}>Continue with Google</Button>
```

## Mobile

When a mobile client (React Native or native iOS/Android) is added, the server endpoint (`POST /api/auth/external-token`) does not change at all. The mobile app uses the platform SDK to acquire an ID token and POSTs it to the same endpoint:

- **React Native:** `react-native-msal` (Microsoft), `@react-native-google-signin/google-signin` (Google)
- **iOS native:** `MSAL.framework` (Microsoft), `GoogleSignIn-iOS` (Google)
- **Android native:** `com.microsoft.identity.client:msal` (Microsoft), `com.google.android.gms:play-services-auth` (Google)

The Azure AD and Google Cloud app registrations need additional redirect URI entries for mobile when that time comes (`msauth.{bundleId}://auth` for MSAL mobile, a reverse-DNS scheme for Google).

## Environment Variables

```
# Microsoft
VITE_MICROSOFT_CLIENT_ID=
VITE_MICROSOFT_TENANT_ID=common

# Google
VITE_GOOGLE_CLIENT_ID=
```

## App Registration Requirements

**Azure AD (Microsoft):**
- Platform: **Single-page application**
- Redirect URIs: all web origins (dev + prod)
- Implicit grant: not required (MSAL uses Authorization Code + PKCE)
- API permissions: `openid`, `email`, `profile` (delegated, no admin consent)
- For SharePoint/OneDrive (when needed): add `Files.ReadWrite`, `Sites.Read.All`

**Google Cloud Console:**
- OAuth 2.0 Client ID type: **Web application**
- Authorized JavaScript origins: all web origins (dev + prod)
- No redirect URIs needed (GIS uses the postMessage flow)
- Scopes: `openid`, `email`, `profile`

## Implementation Notes

Findings from the first working integration, in the order they were discovered.

### Controller route naming matters

The standard `[Route("api/[area]/[controller]")]` attribute expands `[controller]` to the class name minus the `Controller` suffix. A class named `ExternalAuthController` produces the route `api/auth/externalauth` — not `api/auth/external-token` as intended.

The fix: name the class `ExternalController`. The template then expands to `api/auth/external`, giving clean sub-routes:

```
POST   /api/auth/external/token
GET    /api/auth/external/logins
DELETE /api/auth/external/login/{provider}
```

### Returning from a controller after `SignInAsync`

`BearerTokenHandler.HandleSignInAsync` writes the `AccessTokenResponse` JSON directly to `HttpContext.Response`. By the time `SignInAsync` returns, the response has been started (headers committed). Returning `Ok()` or `StatusCode(200)` after that throws `InvalidOperationException: Status code cannot be set because the response has already started`.

The minimal API pattern returns `TypedResults.Empty`, which is a true no-op. The equivalent in an MVC controller is `return new EmptyResult()` — `EmptyResult.ExecuteResult` has an empty body and does not touch the response.

### MSAL popup closing

Getting the popup to close cleanly after the Microsoft redirect took several iterations.

**Approaches tried:**

1. **`redirectUri: window.location.origin`** (i.e. the app root) — The popup loaded the full React app, rendering the dashboard inside the popup. The popup never closed.

2. **`redirectUri: '/blank.html'`** — Works, but requires a separate redirect URI registered in Azure AD for every environment, and adds a `.html`-suffixed path.

3. **Initialize MSAL before `createRoot().render()`** — In `main.tsx`, calling `await msalInstance.initialize()` before mounting React. The theory was that MSAL would detect the popup context, post the result to the opener, and call `window.close()`. In practice, MSAL v5 does not call `window.close()` itself — `initialize()` prepares the cache but does not post the auth code to the BroadcastChannel. The main window's `loginPopup()` timed out. React still rendered.

4. **`broadcastResponseToMainFrame()` from `@azure/msal-browser/redirect-bridge`** ✓ — The correct MSAL v5 approach:

MSAL v5 abandoned `window.opener.postMessage()` entirely. The popup communicates back to the main window via a **`BroadcastChannel`** keyed on the MSAL state ID embedded in the redirect URL. The main window's `loginPopup()` creates this channel and waits for the message; the popup must post to it.

`broadcastResponseToMainFrame()` is the MSAL v5 function that does exactly this: parse the auth response from the URL, post it to the right channel, then call `window.close()`.

The popup detection uses a URL check (`code=` or `error=` in the query string or hash) rather than relying on `broadcastResponseToMainFrame` throwing — the throw-based approach was tried but proved unreliable as a module-level promise (see below). The URL check is explicit and always correct: the main app window never has `code=` or `error=` in its URL.

```typescript
// microsoftProvider.ts
export async function handleMsalStartup(): Promise<boolean> {
  const isPopupRedirect =
    window.location.search.includes('code=') ||
    window.location.search.includes('error=') ||
    window.location.hash.includes('code=') ||
    window.location.hash.includes('error=');

  if (isPopupRedirect) {
    try {
      await broadcastResponseToMainFrame();
    } catch {
      // Broadcast failed — close anyway so the popup doesn't stay open.
    }
    window.close();
    return true;
  }

  await msalInstance.initialize().catch(() => {});
  return false;
}
```

```typescript
// main.tsx — top-level await, no async wrapper needed
if (!await handleMsalStartup()) {
  createRoot(document.getElementById('root')!).render(...);
}
```

Key points:
- **`handleMsalStartup` must be a called function, not a module-level promise.** A module-level `const msalStartup = (async () => { ... })()` is evaluated once when the module is first imported and its result is cached in the module registry. In the popup (a fresh page load) the module re-evaluates correctly — but this pattern is fragile and caused intermittent failures during development. A plain exported `async function` called from `main.tsx` is unambiguous: it always runs fresh on every page load.
- **Do not call `msalInstance.initialize()` in the popup.** `initialize()` prepares the MSAL cache for the main window; it does not post the auth code to the BroadcastChannel. Calling it in the popup is a no-op and the main window's `loginPopup()` times out.
- **`@azure/msal-browser/redirect-bridge` is a first-class package export** — it is not a private path. It is the intended way to run MSAL in redirect/popup callback pages.
- **No dedicated redirect page needed** — `broadcastResponseToMainFrame()` is called from the full app entry point before React mounts. The popup loads the app briefly, posts its message, and closes before `createRoot()` runs.
- **Top-level `await` in ES modules** is supported by Vite and all modern bundlers — no `async function bootstrap()` wrapper needed.

### MSAL token cache and MFA prompts

By default, `PublicClientApplication` uses `sessionStorage` as its cache location. `sessionStorage` is scoped to a single browser window — a new popup window has no cached tokens. This means every popup triggers a full Microsoft login flow, including MFA re-verification.

Switching to `localStorage` persists the cache across tabs and sessions:

```typescript
export const msalInstance = new PublicClientApplication({
  auth: { ... },
  cache: {
    cacheLocation: 'localStorage', // persists across sessions; avoids repeated MFA
  },
});
```

With `localStorage`, MSAL reuses the existing Microsoft session silently for repeat sign-ins during the same browser session. MFA is only re-triggered on genuinely new sessions or when the refresh token expires.

### `popupBridgeTimeout` must cover the full login round-trip

`loginPopup()` opens the popup and immediately starts a `BroadcastChannel` listener with a timeout (`popupBridgeTimeout`, default 60 seconds). The clock starts when the popup opens — not when the user finishes logging in. The popup must complete the full round-trip (navigate to Microsoft, user authenticates, Microsoft redirects back, app loads, `broadcastResponseToMainFrame()` runs) within this window.

Setting `popupBridgeTimeout` to a short value (e.g. 5 seconds) to reduce the wait after a user closes the popup will cause `timed_out` errors for normal sign-ins if the user takes more than that to authenticate. The default 60 seconds is also marginal — a user on a slow connection going through MFA can easily exceed it.

Set it to 3 minutes (180,000 ms), which covers any realistic login flow:

```typescript
system: { popupBridgeTimeout: 180_000 }
```

The closed-popup case is handled separately with `overrideInteractionInProgress` (see below) — not by shortening the timeout.

### Closed popup and retry — `overrideInteractionInProgress`

When the user closes the popup before completing sign-in, `loginPopup()` eventually rejects with `timed_out` (after the bridge timeout). Until it rejects, the MSAL interaction lock (`interaction.status` in sessionStorage) is held. A second click before the timeout fires throws `interaction_in_progress`.

Setting `overrideInteractionInProgress: true` on the `loginPopup` request tells MSAL to cancel the stale pending interaction and start a fresh one immediately, rather than throwing:

```typescript
msalInstance.loginPopup({
  scopes: ['openid', 'email', 'profile'],
  overrideInteractionInProgress: true,
});
```

The `timed_out` error from the cancelled stale request should be caught silently (it is not a real failure):

```typescript
} catch (err) {
  const code = (err as { errorCode?: string }).errorCode;
  const isSilent = code === 'user_cancelled' || code === 'timed_out';
  if (!isSilent) {
    set({ externalLogin: { status: 'failed', error: 'Microsoft sign-in failed' } });
  } else {
    set({ externalLogin: { status: 'idle', error: null } });
  }
}
```

### `EmptyResult` vs `TypedResults.Empty`

These are not the same type, but they have the same behaviour:

| | `TypedResults.Empty` (Minimal API) | `new EmptyResult()` (MVC controller) |
|---|---|---|
| Type | `EmptyHttpResult` | `EmptyResult` |
| `ExecuteAsync` / `ExecuteResult` | `Task.CompletedTask` | empty body |
| Status code | whatever was already set | whatever was already set |

Use `new EmptyResult()` in controller actions that call `SignInAsync`. The existing minimal API endpoints use `TypedResults.Empty` — both work for the same reason.

## Related

- [`azure-ad-app-registration.md`](azure-ad-app-registration.md) — Azure portal configuration reference
- [`development-tokens.md`](development-tokens.md) — how Identity bearer tokens work
- [`appsettings.Development.json`](../../../src/server/Base2.Web/src/appsettings.Development.json) — `ExternalAuth` section with dev credentials
