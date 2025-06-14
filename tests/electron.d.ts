import type { ElectronAPI } from '../../../src/backend/preload';

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

// This ensures the file is treated as a module.
export {};