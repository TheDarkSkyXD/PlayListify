// src/frontend/electron.d.ts
import { ElectronAPI } from '../../backend/preload'; // Adjust path as necessary

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

export {}; // Ensure this file is treated as a module