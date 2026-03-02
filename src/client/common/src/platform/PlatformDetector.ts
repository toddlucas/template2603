export type PlatformInfo = {
  type: 'electron' | 'web';
  os: 'windows' | 'mac' | 'linux';
  process: 'renderer' | 'main' | undefined;
}

export type PlatformType = PlatformInfo['type'];
export type OperatingSystem = PlatformInfo['os'];
export type ModifierKey = 'ctrl' | 'cmd' | 'shift' | 'alt';
export type PrimaryModifier = 'ctrl' | 'cmd';

/**
 * Modern platform detection class based on the legacy platform detection code
 * Provides comprehensive platform information for Electron and web environments
 * https://github.com/electron-utils/electron-platform/blob/master/index.js (MIT)
 */
export class PlatformDetector {
  private static instance: PlatformDetector;
  private _isNode: boolean;
  private _isDarwin: boolean;
  private _isWin32: boolean;
  private _isElectron: boolean;
  private _isNative: boolean;
  private _isPureWeb: boolean;
  private _isRendererProcess: boolean;
  private _isMainProcess: boolean;
  private _isDev: boolean | undefined;

  private constructor() {
    this._isNode = !!(typeof process !== 'undefined' && process.versions && process.versions.node);

    if (this._isNode) {
      this._isDarwin = process.platform === 'darwin';
      this._isWin32 = process.platform === 'win32';
      this._isElectron = !!('electron' in process.versions);
    } else {
      // Browser environment
      // http://stackoverflow.com/questions/19877924/what-is-the-list-of-possible-values-for-navigator-platform-as-of-today
      const platform = window.navigator.platform;
      this._isDarwin = platform.substring(0, 3) === 'Mac';
      this._isWin32 = platform.substring(0, 3) === 'Win';
      this._isElectron = window.navigator.userAgent.indexOf('Electron') !== -1;
    }

    this._isNative = this._isElectron;
    this._isPureWeb = !this._isNode && !this._isNative;

    // Handle process type detection with proper typing
    if (typeof process !== 'undefined') {
      const electronProcess = process as any; // Type assertion for Electron-specific properties
      this._isRendererProcess = electronProcess.type === 'renderer';
      this._isMainProcess = electronProcess.type === 'browser';

      // Check if Electron is running in development
      this._isDev = electronProcess.defaultApp ||
                    /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
                    /[\\/]electron[\\/]/.test(process.execPath);
    } else {
      this._isRendererProcess = true; // Browser environment is always renderer
      this._isMainProcess = false;
    }
  }

  static getInstance(): PlatformDetector {
    if (!PlatformDetector.instance) {
      PlatformDetector.instance = new PlatformDetector();
    }
    return PlatformDetector.instance;
  }

  /**
   * Get the current platform type for menu filtering
   */
  static getCurrentPlatform(): 'electron' | 'web' {
    const detector = PlatformDetector.getInstance();
    return detector.isElectron ? 'electron' : 'web';
  }

  // Platform type properties
  get isNode(): boolean { return this._isNode; }
  get isDarwin(): boolean { return this._isDarwin; }
  get isWin32(): boolean { return this._isWin32; }
  get isElectron(): boolean { return this._isElectron; }
  get isNative(): boolean { return this._isNative; }
  get isPureWeb(): boolean { return this._isPureWeb; }
  get isRendererProcess(): boolean { return this._isRendererProcess; }
  get isMainProcess(): boolean { return this._isMainProcess; }
  get isDev(): boolean | undefined { return this._isDev; }

    /**
   * Check if running in retina display (only available in renderer process)
   */
  get isRetina(): boolean {
    return this.isRendererProcess &&
           typeof window !== 'undefined' &&
           typeof window.devicePixelRatio === 'number' &&
           window.devicePixelRatio > 1;
  }

  /**
   * Get the operating system
   */
  get os(): 'windows' | 'mac' | 'linux' {
    if (this.isDarwin) return 'mac';
    if (this.isWin32) return 'windows';
    return 'linux';
  }

  /**
   * Get the platform type
   */
  get type(): 'electron' | 'web' {
    return this.isElectron ? 'electron' : 'web';
  }

  /**
   * Get platform info in the format expected by the menu system
   */
  getPlatform(): PlatformInfo {
    return {
      type: this.type,
      os: this.os,
      process: this.isElectron ? (this.isRendererProcess ? 'renderer' : 'main') : undefined,
    };
  }
}
