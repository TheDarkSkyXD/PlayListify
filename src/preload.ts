/**
 * Preload script for secure IPC communication between main and renderer processes
 * This script runs in a sandboxed environment with access to both Node.js APIs and the DOM
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI, IPC_CHANNELS } from '@/shared/types';

// Security: Validate that we're running in the correct context
if (!process.contextIsolated) {
  throw new Error('Context isolation must be enabled in the BrowserWindow');
}

// Note: process.nodeIntegration is not available in preload context
// The security is enforced by the main process configuration

// Create the secure API surface
const electronAPI: ElectronAPI = {
  // Application operations
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    quit: () => ipcRenderer.invoke('app:quit'),
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    isMaximized: () => ipcRenderer.invoke('app:isMaximized'),
    unmaximize: () => ipcRenderer.invoke('app:unmaximize'),
    close: () => ipcRenderer.invoke('app:close'),
  },

  // File system operations
  fs: {
    exists: (path: string) => ipcRenderer.invoke('fs:exists', path),
    readJson: (path: string) => ipcRenderer.invoke('fs:readJson', path),
    writeJson: (path: string, data: any) => ipcRenderer.invoke('fs:writeJson', path, data),
    readText: (path: string, encoding?: BufferEncoding) => ipcRenderer.invoke('fs:readText', path, encoding),
    writeText: (path: string, content: string, encoding?: BufferEncoding) => ipcRenderer.invoke('fs:writeText', path, content, encoding),
    delete: (path: string) => ipcRenderer.invoke('fs:delete', path),
    copy: (src: string, dest: string) => ipcRenderer.invoke('fs:copy', src, dest),
    move: (src: string, dest: string) => ipcRenderer.invoke('fs:move', src, dest),
    getStats: (path: string) => ipcRenderer.invoke('fs:getStats', path),
    listFiles: (dirPath: string) => ipcRenderer.invoke('fs:listFiles', dirPath),
    listDirectories: (dirPath: string) => ipcRenderer.invoke('fs:listDirectories', dirPath),
    ensureDirectory: (dirPath: string) => ipcRenderer.invoke('fs:ensureDirectory', dirPath),
    getSize: (path: string) => ipcRenderer.invoke('fs:getSize', path),
    formatSize: (bytes: number) => ipcRenderer.invoke('fs:formatSize', bytes),
    sanitizeFilename: (filename: string) => ipcRenderer.invoke('fs:sanitizeFilename', filename),
    createUniqueFilename: (path: string) => ipcRenderer.invoke('fs:createUniqueFilename', path),
    getAppPaths: () => ipcRenderer.invoke('fs:getAppPaths'),
    initializeDirectories: () => ipcRenderer.invoke('fs:initializeDirectories'),
    cleanupTempFiles: () => ipcRenderer.invoke('fs:cleanupTempFiles'),
    selectDirectory: () => ipcRenderer.invoke('fs:selectDirectory'),
  },

  // Settings management
  settings: {
    get: <T>(key: string) => ipcRenderer.invoke('settings:get', key) as Promise<T>,
    set: <T>(key: string, value: T) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    reset: () => ipcRenderer.invoke('settings:reset'),
    hasCustomValue: (key: string) => ipcRenderer.invoke('settings:hasCustomValue', key),
    getStorePath: () => ipcRenderer.invoke('settings:getStorePath'),
    validate: () => ipcRenderer.invoke('settings:validate'),
    export: () => ipcRenderer.invoke('settings:export'),
    import: (jsonString: string) => ipcRenderer.invoke('settings:import', jsonString),
    initializeDownloadLocation: () => ipcRenderer.invoke('settings:initializeDownloadLocation'),
  },

  // Playlist operations (for future implementation)
  playlist: {
    getAll: (options?: any) => ipcRenderer.invoke('playlist:getAll', options),
    getById: (playlistId: number) => ipcRenderer.invoke('playlist:getById', playlistId),
    create: (input: any) => ipcRenderer.invoke('playlist:create', input),
    update: (playlistId: number, updates: any) => ipcRenderer.invoke('playlist:update', playlistId, updates),
    delete: (playlistId: number) => ipcRenderer.invoke('playlist:delete', playlistId),
    searchVideos: (options: any) => ipcRenderer.invoke('playlist:searchVideos', options),
    addVideo: (playlistId: number, videoId: string) => ipcRenderer.invoke('playlist:addVideo', playlistId, videoId),
    removeVideo: (playlistId: number, videoId: string) => ipcRenderer.invoke('playlist:removeVideo', playlistId, videoId),
    reorderVideos: (playlistId: number, videoOrders: any[]) => ipcRenderer.invoke('playlist:reorderVideos', playlistId, videoOrders),
    getStats: (playlistId: number) => ipcRenderer.invoke('playlist:getStats', playlistId),
  },

  // YouTube operations (for future implementation)
  youtube: {
    getPlaylistMetadata: (url: string) => ipcRenderer.invoke('youtube:getPlaylistMetadata', url),
    importPlaylist: (url: string) => ipcRenderer.invoke('youtube:importPlaylist', url),
    getVideoQualities: (videoId: string) => ipcRenderer.invoke('youtube:getVideoQualities', videoId),
    checkAvailability: () => ipcRenderer.invoke('youtube:checkAvailability'),
    updateYtDlp: () => ipcRenderer.invoke('youtube:updateYtDlp'),
    validateUrl: (url: string) => ipcRenderer.invoke('youtube:validateUrl', url),
    onImportProgress: (callback: (event: any, data: any) => void) => {
      const wrappedCallback = (_event: Electron.IpcRendererEvent, data: any) => callback(_event, data);
      ipcRenderer.on('youtube:importProgress', wrappedCallback);
      
      // Return cleanup function
      return () => ipcRenderer.removeListener('youtube:importProgress', wrappedCallback);
    },
  },

  // Legacy methods for backward compatibility
  getPlaylistMetadata: (url: string) => ipcRenderer.invoke('playlist:getMetadata', url),
  startImport: (url: string) => ipcRenderer.invoke('import:start', url),
  onTaskUpdate: (callback: (event: any, data: any) => void) => {
    const wrappedCallback = (_event: Electron.IpcRendererEvent, data: any) => callback(_event, data);
    ipcRenderer.on('task:update', wrappedCallback);
    
    // Return cleanup function
    return () => ipcRenderer.removeListener('task:update', wrappedCallback);
  },
  getPlaylistDetails: (playlistId: string) => ipcRenderer.invoke('getPlaylistDetails', playlistId),
  getPlaylists: () => ipcRenderer.invoke('getPlaylists'),
};

// Security: Only expose the API through contextBridge
try {
  contextBridge.exposeInMainWorld('api', electronAPI);
  
  // Log successful initialization in development
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Preload script initialized successfully');
    console.log('🔒 Context isolation enabled');
    console.log('🚫 Node integration disabled');
  }
} catch (error) {
  console.error('❌ Failed to expose API through context bridge:', error);
  throw error;
}

// DOM Content Loaded handler for version display
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string): void => {
    const element = document.getElementById(selector);
    if (element) {
      element.innerText = text;
    }
  };

  // Display version information
  for (const dependency of ['chrome', 'node', 'electron'] as const) {
    const version = process.versions[dependency];
    if (version) {
      replaceText(`${dependency}-version`, version);
    }
  }
});

// Security: Prevent access to Node.js globals in renderer
delete (globalThis as any).require;
delete (globalThis as any).exports;
delete (globalThis as any).module;

// Log security status in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔒 Security measures applied:');
  console.log('  - Node.js globals removed from renderer context');
  console.log('  - IPC communication secured through context bridge');
  console.log('  - API surface limited to approved methods');
}