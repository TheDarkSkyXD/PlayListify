import type { IpcResponse } from './index';

// This allows TypeScript to recognize the global constants injected by Electron Forge's Webpack plugin.
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// You can add other global type declarations relevant to your Electron app here.

// Extend the Window interface to include the electronAPI exposed via contextBridge
export interface IElectronAPI {
  invoke: <T = any>(channel: string, ...args: any[]) => Promise<IpcResponse<T>>;
  on: (channel: string, listener: (event: any, ...args: any[]) => void) => (() => void); // Returns a cleanup function
  // Add other methods exposed by your preload script here
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
} 