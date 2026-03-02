# Electron Microsoft OAuth (Approach A′)

**Date:** 2026-02-28
**Scope:** Client-only — Electron app (`app/`) and shared `common/`
**Status:** Not started

See [`guides/server/oauth-flow-comparison.md`](../../guides/server/oauth-flow-comparison.md) for the full flow description. The server endpoint (`POST /api/auth/external/token`) is already implemented and requires no changes.

## Flow summary

```
Renderer ──IPC──► Main process ──shell.openExternal──► System browser
                                                              │
                  Main process ◄──OS routes example://auth──►│
                       │
                  msal-node exchanges code for tokens
                       │
Renderer ◄──IPC──  Main process returns idToken
    │
Renderer POSTs idToken to POST /api/auth/external/token  (same as web)
```

The renderer never sees the OAuth code. It sends one IPC request and receives one ID token back.

---

## Files to change

### 1. `app/package.json` — add `@azure/msal-node`

`@azure/msal-node` is a production dependency of the Electron main process. It must be in `dependencies` (not `devDependencies`) so it is bundled into the asar.

```json
"@azure/msal-node": "^2.x"
```

Also add the env vars `VITE_MICROSOFT_CLIENT_ID` and `VITE_MICROSOFT_TENANT_ID` to `app/.env.example`, `app/env.development.template`, and `app/.env.development` (matching the web app convention).

### 2. `app/src/main.ts` — URI scheme + IPC handler

**Register the custom URI scheme** (must be called before `app.ready`):

```typescript
app.setAsDefaultProtocolClient('example');
```

**Handle the OS redirect** on Windows/Linux via `second-instance`, on macOS via `open-url`:

```typescript
// macOS: redirect arrives as open-url
app.on('open-url', (_event, url) => {
  handleOAuthRedirect(url);
});

// Windows / Linux: redirect arrives as a second-instance launch argument
app.on('second-instance', (_event, argv) => {
  const url = argv.find(arg => arg.startsWith('example://'));
  if (url) handleOAuthRedirect(url);
});
```

**`handleOAuthRedirect(url)`** resolves the pending `ipcMain.handle` promise by storing the URL in a module-level variable that the MSAL node flow reads.

**`ipcMain.handle('auth:sign-in-microsoft', ...)`** — creates an `msal-node` `PublicClientApplication`, calls `getAuthCodeUrl`, opens the URL with `shell.openExternal`, waits for the redirect (via a `Promise` that `handleOAuthRedirect` resolves), calls `acquireTokenByCode`, and returns `result.idToken`.

Key MSAL node config:
- `auth.clientId` — from `process.env.VITE_MICROSOFT_CLIENT_ID` (available at build time via Vite; or pass via `app.commandLine` / a separate env mechanism)
- `auth.authority` — `https://login.microsoftonline.com/${tenantId}`
- `auth.redirectUri` — `example://auth`
- `cache` — use `DistributedCachePlugin` with a file-based cache in `app.getPath('userData')` so the MSAL token cache survives restarts

Timeout: reject the pending redirect promise after 3 minutes (matching the web app's `popupBridgeTimeout`).

### 3. `app/src/preload.ts` — expose `signInWithMicrosoft`

Add to the `contextBridge.exposeInMainWorld('example', { ... })` object:

```typescript
signInWithMicrosoft: (): Promise<string> =>
  ipcRenderer.invoke('auth:sign-in-microsoft'),
```

### 4. `common/src/platform/ipc/types.ts` — extend `AppBridge`

Add to the `AppBridge` interface:

```typescript
/** Initiates Microsoft OAuth via the system browser. Returns an ID token. */
signInWithMicrosoft(): Promise<string>;
```

### 5. `common/src/features/auth/providers/microsoftProvider.ts` — Electron branch

`signInWithMicrosoft` is called by `authStore.loginWithMicrosoft`. It currently always uses `@azure/msal-browser`. Add a runtime branch:

```typescript
export const signInWithMicrosoft = async (): Promise<string> => {
  // Electron: delegate to the main process via IPC.
  const bridge = getAppBridge();
  if (bridge) {
    return bridge.signInWithMicrosoft();
  }

  // Web: existing MSAL browser popup flow.
  const account = msalInstance.getAllAccounts()[0];
  if (account) {
    try {
      return (await msalInstance.acquireTokenSilent({ scopes: LOGIN_SCOPES, account })).idToken;
    } catch { }
  }
  return (await msalInstance.loginPopup({ scopes: LOGIN_SCOPES, overrideInteractionInProgress: true })).idToken;
};
```

`getAppBridge` is already exported from `$/platform/ipc`. The `msalInstance` and `handleMsalStartup` exports are unchanged — they are only called in the web app.

`handleMsalStartup` is **not** called from `app/src/renderer.tsx`. The renderer is never an OAuth redirect target in Approach A′.

---

## Azure AD app registration change

Add `example://auth` as a **Mobile and desktop applications** redirect URI in the Azure AD app registration. The existing `http://localhost:8383` SPA redirect URI stays for the web app.

See [`guides/server/azure-ad-app-registration.md`](../../guides/server/azure-ad-app-registration.md).

---

## Environment variables

The main process reads env vars differently from the renderer (no `import.meta.env`). Options:

- **Option A (simplest):** Pass `MICROSOFT_CLIENT_ID` and `MICROSOFT_TENANT_ID` as regular `process.env` vars via a `.env` file loaded by `electron-forge` / `dotenv` in `main.ts`. These are separate from the `VITE_*` vars used by the renderer.
- **Option B:** Read from the renderer config service and pass the values to the main process via a dedicated IPC call at startup.

Option A is simpler and keeps the main process self-contained. The `.env` file already exists at `app/.env` and `app/.env.development`.

---

## Error handling

The `ipcMain` handler should reject with a typed error so the renderer can distinguish:

| Scenario | Error code |
|---|---|
| User closed browser before completing | `user_cancelled` |
| 3-minute timeout elapsed | `timed_out` |
| MSAL token exchange failed | `msal_error` |

`authStore.loginWithMicrosoft` already silences `user_cancelled` and `timed_out` (from the web MSAL error codes). The same codes will work for Electron if the main process uses the same strings.

---

## What does NOT change

- `app/src/renderer.tsx` — no `handleMsalStartup()` call needed; the renderer is never an OAuth redirect target
- `common/src/features/auth/stores/authStore.ts` — `loginWithMicrosoft` calls `signInWithMicrosoft()` which now branches internally; no store changes needed
- `common/src/features/auth/components/AuthCard.tsx` — no changes; the "Continue with Microsoft" button already calls `loginWithMicrosoft`
- Server — no changes; `POST /api/auth/external/token` already accepts Microsoft ID tokens

---

## Implementation order

1. Add `@azure/msal-node` to `app/package.json` and install
2. Add env vars to `app/.env*` files
3. Add `signInWithMicrosoft` to `AppBridge` in `ipc/types.ts`
4. Add `signInWithMicrosoft` to `preload.ts`
5. Implement the IPC handler and URI scheme in `main.ts`
6. Branch `signInWithMicrosoft` in `microsoftProvider.ts`
7. Register `example://auth` redirect URI in Azure AD
8. Smoke-test end-to-end in dev (`electron-forge start`)
