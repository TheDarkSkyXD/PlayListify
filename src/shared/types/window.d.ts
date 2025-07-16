/**
 * Window type declarations for Electron API with enhanced security and versioning
 */

import { ElectronAPI } from '../types';

// Enhanced API interface with versioning and security features
interface VersionedElectronAPI extends ElectronAPI {
  _version: string;
  _validateVersion: (version?: string) => boolean;
}

declare global {
  interface Window {
    // Primary API interface with versioning
    electronAPI: VersionedElectronAPI;
    
    // Legacy API interface for backward compatibility
    api: ElectronAPI;
  }
}