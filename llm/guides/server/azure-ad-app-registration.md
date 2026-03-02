# Azure AD App Registration Guide

Configuration reference for the Entra ID app registration used for Microsoft OAuth sign-in.

## Existing Registrations

Two registrations exist. Credentials are in `appsettings.Development.json`:

| Registration | Client ID | Purpose |
|---|---|---|
| Original (Web platform) | `3bc3a21e-336c-4a38-bfe4-0fe02eaf052c` | Legacy server-side redirect flow — no longer used |
| SPA client | `8609c8d6-b2aa-4c3b-acd6-3726699dfffe` | Active — used by `@azure/msal-browser` |

- **Tenant ID (both):** `ece394e8-e931-4d2a-815a-52c26aa2c35e` (your organization's Azure AD tenant)

The SPA client is the active registration. To find it in the portal: [portal.azure.com](https://portal.azure.com) → **Entra ID** → **App registrations** → search by client ID `8609c8d6-b2aa-4c3b-acd6-3726699dfffe`.

## Platform Configuration

The SPA client has two platform entries: **Single-page application** (for the web app) and **Mobile and desktop applications** (for the Electron app). Both use Authorization Code + PKCE; the difference is only in how the redirect URI is delivered.

To find platform settings in the portal:

**Entra ID** → **App registrations** → `8609c8d6-b2aa-4c3b-acd6-3726699dfffe` → **Authentication** (left sidebar)

### Single-page application platform (web app — Approach A)

The `redirectUri` passed to `PublicClientApplication` must be registered here. The implementation uses `window.location.origin` as the redirect URI — no path suffix, no separate `/blank.html` file needed (see the Implementation Notes in the integration guide for why).

**Registered URIs:**
- `http://localhost:8383` — Vite dev server
- Add production origin(s) when deploying (e.g. `https://app.yourdomain.com`)

> **Why origin-only?** MSAL uses the redirect URI as a postMessage target. The popup navigates to the origin URL after the Microsoft login completes, and `main.tsx` detects the `code=` parameter in the URL before React mounts, calls `msalInstance.initialize()`, and then closes the popup with `window.close()`. No separate redirect page is required.

**Implicit grant:** leave both checkboxes (Access tokens, ID tokens) **unchecked**. MSAL does not use implicit grant and enabling it weakens security.

### Mobile and desktop applications platform (Electron app — Approach A′)

The Electron main process uses `@azure/msal-node` with a custom URI scheme. Microsoft redirects to `example://auth` after login; the OS routes this back to the running Electron process.

**To add this platform entry:**

1. On the **Authentication** page, scroll to the bottom and click **Add a platform**
2. Select **Mobile and desktop applications**
3. Under **Custom redirect URIs**, enter: `example://auth`
4. Click **Configure**

**Registered URI:**
- `example://auth` — Electron custom URI scheme

This URI must exactly match the `OAUTH_REDIRECT_URI` constant in `app/src/main.ts` (`example://auth`). Microsoft validates it on every token exchange.

You may leave the original **Web** platform entry in place — it does not interfere with the SPA or desktop entries.

## Supported Account Types

The current dev registration uses a single-tenant configuration (the specific `TenantId` above). The production `appsettings.json` uses `"common"`, meaning any work or school Microsoft account.

| Setting | Value | Who can sign in |
|---|---|---|
| Single tenant | `ece394e8-...` (your org) | Only users in your Azure AD tenant |
| Multitenant | `common` | Any work/school account (any org) |
| Multitenant + personal | `consumers` | Any work/school account + Outlook/Hotmail |

For dev, single-tenant is fine — it restricts sign-in to your own org's accounts, which is appropriate for testing. The production app registration should be created separately with the correct multi-tenant setting.

## Environment Variables

Both the web app and the Electron app use the same two vars. They are read differently at runtime:

- **Web app** (`web/`): read by the Vite renderer bundle via `import.meta.env`
- **Electron app** (`app/`): injected into the main process bundle at build time via `vite.main.config.ts` `define`

**Dev values** (already set in `web/.env.development` and `app/.env.development`):

```
VITE_MICROSOFT_CLIENT_ID=8609c8d6-b2aa-4c3b-acd6-3726699dfffe
VITE_MICROSOFT_TENANT_ID=ece394e8-e931-4d2a-815a-52c26aa2c35e
```

For production, set `VITE_MICROSOFT_TENANT_ID=common` (or your chosen account type) and point `VITE_MICROSOFT_CLIENT_ID` to the production registration's client ID.

Both keys are present (with empty values) in `web/.env.example` and `app/.env.example`.

The server no longer needs `Office365Settings.ClientSecret` under Approach A / A′ (MSAL). The `ClientId` and `TenantId` are enough for server-side ID token validation.

## API Permissions

No additional API permissions are needed for basic sign-in. The `openid`, `email`, and `profile` scopes are standard OIDC scopes available to all registrations without admin consent.

When SharePoint/OneDrive integration is added, the following delegated permissions will need to be added to this registration:

| Permission | Scope | Purpose |
|---|---|---|
| `Files.ReadWrite` | Microsoft Graph | Read and write OneDrive files |
| `Sites.Read.All` | Microsoft Graph | Read SharePoint sites |

These do not require admin consent in most tenant configurations.

## Production Registration

Create a **separate** app registration for production rather than reusing the dev one. This keeps redirect URIs clean and allows independent credential rotation. The production registration should:

- Use **multitenant** or **multitenant + personal accounts** depending on your target audience
- Have only production redirect URIs registered (no localhost)
- Store its `ClientId` in your production secrets manager, not in committed config

## Related

- [`microsoft-oauth-integration.md`](microsoft-oauth-integration.md) — full architecture decision, implementation guide, and implementation notes
- [`appsettings.Development.json`](../../../src/server/Base2.Web/src/appsettings.Development.json) — `ExternalAuth` section with dev credentials
