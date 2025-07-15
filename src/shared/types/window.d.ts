/**
 * Window type declarations for Electron API
 */

import { ElectronAPI } from './types';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}