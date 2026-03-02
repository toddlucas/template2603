export type { AppBridge } from './types';

/**
 * Returns true when running inside an Electron renderer process.
 * Use this to guard calls to window.product_name.*.
 */
export const isElectron = (): boolean =>
  typeof window !== 'undefined' && 'product_name' in window;

/**
 * Returns the AppBridge if running in Electron, or null in the web app.
 */
export const getAppBridge = (): import('./types').AppBridge | null =>
  isElectron() ? (window.product_name ?? null) : null;
