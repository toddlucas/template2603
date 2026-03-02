import { PublicClientApplication } from '@azure/msal-browser';
import { broadcastResponseToMainFrame } from '@azure/msal-browser/redirect-bridge';
import { getAppBridge } from '../../../platform/ipc';

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID as string,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID as string}`,
    redirectUri: window.location.origin,
  },
  cache: {
    // localStorage persists the Microsoft session across browser tabs and
    // windows, so returning users and repeated test runs don't trigger MFA.
    cacheLocation: 'localStorage',
  },
  system: {
    // Default is 60 s, which is too short for users on slow connections or
    // going through MFA. 3 minutes covers any realistic login flow.
    popupBridgeTimeout: 180_000,
  },
});

/**
 * Must be called once at app startup before React mounts.
 *
 * If the current window is an MSAL popup redirect (URL contains code= or
 * error=), broadcasts the auth response to the main window via BroadcastChannel
 * and closes the popup. Returns true so the caller can skip mounting React.
 *
 * Otherwise initializes the MSAL cache for the main window and returns false.
 */
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

const LOGIN_SCOPES = ['openid', 'email', 'profile'];

/**
 * Returns an ID token for the current Microsoft session.
 *
 * In Electron (Approach A′): delegates to the main process via IPC. The main
 * process opens the Microsoft login URL in the system browser, waits for the
 * OS to route the example://auth redirect back, and returns the ID token.
 *
 * In the web app (Approach A): tries a silent token acquisition first using
 * any cached MSAL account, then falls back to an interactive popup.
 *
 * Either way the caller receives a raw ID token string to POST to the server.
 */
export const signInWithMicrosoft = async (): Promise<string> => {
  // Electron: the renderer never touches the OAuth code — the main process
  // handles the full Authorization Code + PKCE flow via msal-node.
  const bridge = getAppBridge();
  if (bridge) {
    return bridge.signInWithMicrosoft();
  }

  // Web: use the MSAL browser popup flow.
  const account = msalInstance.getAllAccounts()[0];

  if (account) {
    try {
      const result = await msalInstance.acquireTokenSilent({
        scopes: LOGIN_SCOPES,
        account,
      });
      return result.idToken;
    } catch {
      // Silent acquisition failed (expired, consent required, etc.) —
      // fall through to interactive popup.
    }
  }

  const result = await msalInstance.loginPopup({
    scopes: LOGIN_SCOPES,
    // If the user closed a previous popup before it completed, a stale
    // interaction_in_progress lock may still be set. Override it so the
    // button works immediately rather than waiting for the bridge timeout.
    overrideInteractionInProgress: true,
  });
  return result.idToken;
};

const GRAPH_SCOPES = ['Files.ReadWrite', 'Sites.Read.All'];

/**
 * Acquires a Microsoft Graph access token for SharePoint/OneDrive.
 *
 * In Electron: delegates to the main process via IPC, which handles both
 * silent acquisition from the token cache and the interactive browser flow.
 *
 * In the web app: tries silent acquisition first, then falls back to an
 * interactive popup so the user can consent to the Graph scopes.
 */
export const acquireGraphToken = async (): Promise<{ accessToken: string }> => {
  // Electron: delegate to main process which has the msal-node token cache.
  const bridge = getAppBridge();
  if (bridge) {
    const accessToken = await bridge.acquireGraphToken();
    return { accessToken };
  }

  // Web: try silent first, then interactive popup for first-time consent.
  const account = msalInstance.getAllAccounts()[0];

  if (account) {
    try {
      return await msalInstance.acquireTokenSilent({
        scopes: GRAPH_SCOPES,
        account,
      });
    } catch {
      // Consent not yet granted or token expired — fall through to popup.
    }
  }

  // Interactive popup — this is where the user grants Files.ReadWrite / Sites.Read.All
  // for the first time. After consent the token is cached for silent use.
  return msalInstance.acquireTokenPopup({
    scopes: GRAPH_SCOPES,
    overrideInteractionInProgress: true,
  });
};
