import { contextBridge, ipcRenderer } from 'electron';

/**
 * The API exposed to the renderer process via window.product_name.
 *
 * All types here must be serializable (no functions, no class instances).
 * Keep this interface in sync with common/src/platform/ipc/types.ts.
 */
contextBridge.exposeInMainWorld('product_name', {
  /** Returns the localhost port the .NET sidecar is listening on. */
  getSidecarPort: (): Promise<number | null> =>
    ipcRenderer.invoke('sidecar:get-port'),

  /** Opens the OS file/folder picker. */
  showOpenDialog: (
    options: Electron.OpenDialogOptions,
  ): Promise<Electron.OpenDialogReturnValue> =>
    ipcRenderer.invoke('dialog:show-open', options),

  /** Opens the OS save-file picker. */
  showSaveDialog: (
    options: Electron.SaveDialogOptions,
  ): Promise<Electron.SaveDialogReturnValue> =>
    ipcRenderer.invoke('dialog:show-save', options),

  /** Opens a .docx file in the default application (Word). */
  openInWord: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('shell:open-in-word', filePath),

  /** Reveals a file in Windows Explorer / macOS Finder. */
  revealInExplorer: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('shell:reveal', filePath),

  /** Returns the Electron app version string. */
  getVersion: (): Promise<string> =>
    ipcRenderer.invoke('app:get-version'),

  /** Registers a callback for when the sidecar restarts on a new port. */
  onSidecarPortChanged: (callback: (port: number) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, port: number) => callback(port);
    ipcRenderer.on('sidecar:port-changed', handler);
    return () => ipcRenderer.removeListener('sidecar:port-changed', handler);
  },

  /** Initiates Microsoft OAuth via the system browser. Returns an ID token. */
  signInWithMicrosoft: (): Promise<string> =>
    ipcRenderer.invoke('auth:sign-in-microsoft'),

  /** Acquires a Microsoft Graph access token for SharePoint/OneDrive. */
  acquireGraphToken: (): Promise<string> =>
    ipcRenderer.invoke('auth:acquire-graph-token'),
});
