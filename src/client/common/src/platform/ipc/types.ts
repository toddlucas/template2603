/**
 * The API exposed by the Electron preload script on window.product_name.
 *
 * This interface is the single source of truth for the IPC contract between
 * the Electron main process and the renderer. The preload script (app/src/preload.ts)
 * implements this interface; the renderer uses it via window.product_name.
 *
 * In the web app (non-Electron), window.product_name is undefined. Use isElectron()
 * to guard before calling any of these methods.
 */
export interface AppBridge {
  /** Returns the localhost port the .NET sidecar is currently listening on. */
  getSidecarPort(): Promise<number | null>;

  /** Opens the OS file/folder picker dialog. */
  showOpenDialog(options: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    properties?: Array<
      | 'openFile'
      | 'openDirectory'
      | 'multiSelections'
      | 'showHiddenFiles'
      | 'createDirectory'
    >;
  }): Promise<{ canceled: boolean; filePaths: string[] }>;

  /** Opens the OS save-file picker dialog. */
  showSaveDialog(options: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<{ canceled: boolean; filePath?: string }>;

  /** Opens a file in its default application (e.g. .docx opens in Word). */
  openInWord(filePath: string): Promise<string>;

  /** Reveals a file in Windows Explorer / macOS Finder. */
  revealInExplorer(filePath: string): Promise<void>;

  /** Returns the Electron app version string. */
  getVersion(): Promise<string>;

  /**
   * Registers a callback for when the sidecar restarts on a new port.
   * Returns an unsubscribe function.
   */
  onSidecarPortChanged(callback: (port: number) => void): () => void;

  /**
   * Initiates Microsoft OAuth via the system browser (Approach A′).
   *
   * The main process opens the Microsoft login URL with shell.openExternal,
   * waits for the OS to route the example://auth redirect back, exchanges the
   * code for tokens via msal-node, and resolves with the ID token string.
   *
   * Rejects with an Error whose message is one of:
   *   "user_cancelled" — user closed the browser before completing
   *   "timed_out"      — 3-minute timeout elapsed
   *   "msal_error"     — MSAL token exchange failed
   */
  signInWithMicrosoft(): Promise<string>;

  /**
   * Acquires a Microsoft Graph access token for SharePoint/OneDrive.
   *
   * Tries silent acquisition from the cached account first. If the Graph
   * scopes have not been consented yet, opens the system browser for an
   * interactive consent flow and returns the access token.
   *
   * Rejects with the same error codes as signInWithMicrosoft if the
   * interactive flow is cancelled or times out.
   */
  acquireGraphToken(): Promise<string>;
}

declare global {
  interface Window {
    product_name?: AppBridge;
  }
}
