import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import { startSidecarWithRestart } from './sidecar';
import { PublicClientApplication, DistributedCachePlugin, type ICacheClient } from '@azure/msal-node';

// Injected at build time by vite.main.config.ts via define.
declare const __MICROSOFT_CLIENT_ID__: string;
declare const __MICROSOFT_TENANT_ID__: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// ---------------------------------------------------------------------------
// Microsoft OAuth — custom URI scheme (Approach A′)
// Must be registered before app.ready.
// ---------------------------------------------------------------------------

const OAUTH_SCHEME = 'example';
const OAUTH_REDIRECT_URI = `${OAUTH_SCHEME}://auth`;
const OAUTH_TIMEOUT_MS = 180_000;

// Registered before app.ready so the OS associates the scheme with this app.
// In dev mode (electron-forge start), process.execPath is electron.exe itself,
// not the packaged app. We must pass the main script path as an extra argument
// so the OS launches the correct process when the redirect URI fires.
if (app.isPackaged) {
  app.setAsDefaultProtocolClient(OAUTH_SCHEME);
} else {
  app.setAsDefaultProtocolClient(OAUTH_SCHEME, process.execPath, [
    path.resolve(process.argv[1]),
  ]);
}

// Pending sign-in state: resolve/reject set by the ipcMain handler, called by
// handleOAuthRedirect when the OS routes the redirect back to the app.
let pendingOAuthResolve: ((url: string) => void) | null = null;
let pendingOAuthReject: ((err: Error) => void) | null = null;

/**
 * Called when the OS routes a example:// URI back to this process.
 * Resolves the pending OAuth promise so the IPC handler can continue.
 */
function handleOAuthRedirect(url: string): void {
  if (pendingOAuthResolve) {
    pendingOAuthResolve(url);
    pendingOAuthResolve = null;
    pendingOAuthReject = null;
  }
}

// ---------------------------------------------------------------------------
// Set to true to skip the .NET sidecar (renderer-only / no backend mode).
// ---------------------------------------------------------------------------

const SIDECAR_ENABLED = false;

let sidecarPort: number | null = null;
let stopSidecar: (() => Promise<void>) | null = null;
let mainWindow: BrowserWindow | null = null;

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

ipcMain.handle('sidecar:get-port', () => sidecarPort);

ipcMain.handle('dialog:show-open', (_event, options: Electron.OpenDialogOptions) => {
  return dialog.showOpenDialog(mainWindow!, options);
});

ipcMain.handle('dialog:show-save', (_event, options: Electron.SaveDialogOptions) => {
  return dialog.showSaveDialog(mainWindow!, options);
});

ipcMain.handle('shell:open-in-word', (_event, filePath: string) => {
  return shell.openPath(filePath);
});

ipcMain.handle('shell:reveal', (_event, filePath: string) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('app:get-version', () => app.getVersion());

// ---------------------------------------------------------------------------
// MSAL node — shared app instance with file-backed token cache
// ---------------------------------------------------------------------------

const MSAL_SCOPES = ['openid', 'email', 'profile'];
const GRAPH_SCOPES = ['Files.ReadWrite', 'Sites.Read.All'];

// Lazily created on first sign-in so app.getPath('userData') is available.
let msalApp: PublicClientApplication | null = null;

function getMsalApp(): PublicClientApplication {
  if (msalApp) return msalApp;

  const clientId = __MICROSOFT_CLIENT_ID__;
  const tenantId = __MICROSOFT_TENANT_ID__;

  if (!clientId || !tenantId) {
    throw new Error('msal_error: VITE_MICROSOFT_CLIENT_ID or VITE_MICROSOFT_TENANT_ID not set');
  }

  // Persist the MSAL token cache to disk so silent acquisition survives
  // app restarts — matching the web app's localStorage cacheLocation behaviour.
  const cachePath = path.join(app.getPath('userData'), 'msal-token-cache.json');

  const cacheClient: ICacheClient = {
    get: async (_key: string) => {
      try { return fs.readFileSync(cachePath, 'utf8'); } catch { return ''; }
    },
    set: async (_key: string, value: string) => {
      fs.mkdirSync(path.dirname(cachePath), { recursive: true });
      fs.writeFileSync(cachePath, value, 'utf8');
      return value;
    },
  };

  msalApp = new PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
    cache: {
      cachePlugin: new DistributedCachePlugin(cacheClient, /* partitionManager */ {
        getKey: async () => 'example',
        extractKey: async () => 'example',
      }),
    },
  });

  return msalApp;
}

/**
 * Runs the interactive browser OAuth flow for the given scopes.
 * Opens the system browser, waits for the example://auth redirect, and
 * exchanges the code for tokens. Returns the full token response.
 */
async function acquireTokenInteractive(scopes: string[]) {
  const msal = getMsalApp();

  let authCodeUrl: string;
  try {
    authCodeUrl = await msal.getAuthCodeUrl({
      scopes,
      redirectUri: OAUTH_REDIRECT_URI,
    });
  } catch (err) {
    throw new Error(`msal_error: ${String(err)}`);
  }

  const redirectUrlPromise = new Promise<string>((resolve, reject) => {
    pendingOAuthResolve = resolve;
    pendingOAuthReject = reject;

    setTimeout(() => {
      if (pendingOAuthReject) {
        pendingOAuthReject(new Error('timed_out'));
        pendingOAuthResolve = null;
        pendingOAuthReject = null;
      }
    }, OAUTH_TIMEOUT_MS);
  });

  await shell.openExternal(authCodeUrl);

  let redirectUrl: string;
  try {
    redirectUrl = await redirectUrlPromise;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(msg);
  }

  const url = new URL(redirectUrl);
  const code = url.searchParams.get('code');
  const errorParam = url.searchParams.get('error');

  if (errorParam) {
    const desc = url.searchParams.get('error_description') ?? errorParam;
    if (errorParam === 'access_denied') throw new Error('user_cancelled');
    throw new Error(`msal_error: ${desc}`);
  }

  if (!code) {
    throw new Error('msal_error: no code in redirect URI');
  }

  try {
    return await msal.acquireTokenByCode({
      code,
      scopes,
      redirectUri: OAUTH_REDIRECT_URI,
    });
  } catch (err) {
    throw new Error(`msal_error: ${String(err)}`);
  }
}

ipcMain.handle('auth:sign-in-microsoft', async (): Promise<string> => {
  const msal = getMsalApp();

  // Try silent acquisition first using any cached account.
  const accounts = await msal.getTokenCache().getAllAccounts();
  if (accounts.length > 0) {
    try {
      const silent = await msal.acquireTokenSilent({
        scopes: MSAL_SCOPES,
        account: accounts[0],
      });
      if (silent?.idToken) return silent.idToken;
    } catch {
      // Cache miss, expired, or consent required — fall through to browser flow.
    }
  }

  const tokenResponse = await acquireTokenInteractive(MSAL_SCOPES);
  return tokenResponse.idToken;
});

ipcMain.handle('auth:acquire-graph-token', async (): Promise<string> => {
  const msal = getMsalApp();

  // Try silent acquisition first — Graph scopes may already be cached.
  const accounts = await msal.getTokenCache().getAllAccounts();
  if (accounts.length > 0) {
    try {
      const silent = await msal.acquireTokenSilent({
        scopes: GRAPH_SCOPES,
        account: accounts[0],
      });
      if (silent?.accessToken) return silent.accessToken;
    } catch {
      // Consent not yet granted or token expired — fall through to interactive.
    }
  }

  // Interactive consent flow for Graph scopes.
  const tokenResponse = await acquireTokenInteractive(GRAPH_SCOPES);
  return tokenResponse.accessToken;
});

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (process.env.NODE_ENV === 'development') {
      mainWindow?.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

// macOS: the OS delivers the custom-scheme redirect as an open-url event.
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleOAuthRedirect(url);
});

// Windows / Linux: the OS launches a second instance with the redirect URL as
// a command-line argument. Pass the URL to the first instance via additionalData
// so it is delivered before the second instance does anything else, then quit.
const oauthUrlFromArgs = process.argv.find(arg => arg.startsWith(`${OAUTH_SCHEME}://`));
const gotLock = app.requestSingleInstanceLock({ oauthUrl: oauthUrlFromArgs ?? null });

if (!gotLock) {
  // This is the second instance — quit immediately before any window is created.
  app.quit();
} else {
  app.on('second-instance', (_event, argv, _cwd, additionalData) => {
    // Prefer additionalData (set above) — argv is also checked as a fallback.
    const data = additionalData as { oauthUrl?: string | null } | undefined;
    const url = data?.oauthUrl ?? argv.find(arg => arg.startsWith(`${OAUTH_SCHEME}://`));
    if (url) handleOAuthRedirect(url);
    // Focus the existing window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.on('ready', () => {
  if (SIDECAR_ENABLED) {
    stopSidecar = startSidecarWithRestart(
      (port) => {
        sidecarPort = port;
        if (!mainWindow) {
          createWindow();
        } else {
          // Notify renderer of new port after a restart.
          mainWindow.webContents.send('sidecar:port-changed', port);
        }
      },
      (err) => {
        console.error('[main] sidecar fatal error:', err);
        dialog.showErrorBox(
          'Product Name failed to start',
          `The document engine could not be started.\n\n${err.message}\n\nPlease reinstall the application.`,
        );
        app.quit();
      },
    );
  } else {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async (event) => {
  if (stopSidecar) {
    event.preventDefault();
    await stopSidecar();
    stopSidecar = null;
    app.quit();
  }
});
