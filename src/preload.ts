/**
 * Secure preload script for IPC communication between main and renderer processes
 * This script creates a controlled API surface with proper security measures and error handling
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '@/shared/types';

// Security validation: Ensure proper context isolation
if (!process.contextIsolated) {
  throw new Error('❌ Context isolation must be enabled for security');
}

// Security validation: Ensure node integration is disabled
if (process.env.NODE_ENV !== 'test' && (globalThis as any).require) {
  throw new Error('❌ Node integration must be disabled for security');
}

/**
 * Create a secure wrapper for IPC invoke calls with error handling
 */
function createSecureInvoke<T extends any[], R>(channel: string) {
  return async (...args: T): Promise<R> => {
    try {
      const response = await ipcRenderer.invoke(channel, ...args);
      
      // Handle standardized IPC responses
      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.error || 'Unknown IPC error');
        }
      }
      
      // Handle legacy responses
      return response;
    } catch (error) {
      console.error(`IPC Error on channel ${channel}:`, error);
      throw error;
    }
  };
}

/**
 * Create a secure wrapper for IPC event listeners with cleanup
 */
function createSecureListener<T extends any[]>(channel: string) {
  return (callback: (event: Electron.IpcRendererEvent, ...args: T) => void) => {
    const wrappedCallback = (event: Electron.IpcRendererEvent, ...args: T) => {
      try {
        callback(event, ...args);
      } catch (error) {
        console.error(`Error in IPC listener for ${channel}:`, error);
      }
    };
    
    ipcRenderer.on(channel, wrappedCallback);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener(channel, wrappedCallback);
    };
  };
}

// Create the secure API surface with proper error handling
const electronAPI: ElectronAPI = {
  // Application operations
  app: {
    getVersion: createSecureInvoke<[], string>('app:getVersion'),
    quit: createSecureInvoke<[], void>('app:quit'),
    minimize: createSecureInvoke<[], void>('app:minimize'),
    maximize: createSecureInvoke<[], void>('app:maximize'),
    isMaximized: createSecureInvoke<[], boolean>('app:isMaximized'),
    unmaximize: createSecureInvoke<[], void>('app:unmaximize'),
    close: createSecureInvoke<[], void>('app:close'),
    showErrorDialog: createSecureInvoke<[string, string], void>('app:showErrorDialog'),
    showMessageDialog: createSecureInvoke<[Electron.MessageBoxOptions], Electron.MessageBoxReturnValue>('app:showMessageDialog'),
    selectDirectory: createSecureInvoke<[Electron.OpenDialogOptions?], string | null>('app:selectDirectory'),
    selectFile: createSecureInvoke<[Electron.OpenDialogOptions?], string | null>('app:selectFile'),
    saveFile: createSecureInvoke<[Electron.SaveDialogOptions?], string | null>('app:saveFile'),
  },

  // File system operations
  fs: {
    exists: createSecureInvoke<[string], boolean>('fs:exists'),
    readJson: createSecureInvoke<[string], any>('fs:readJson'),
    writeJson: createSecureInvoke<[string, any], void>('fs:writeJson'),
    readText: createSecureInvoke<[string, BufferEncoding?], string>('fs:readText'),
    writeText: createSecureInvoke<[string, string, BufferEncoding?], void>('fs:writeText'),
    delete: createSecureInvoke<[string], void>('fs:delete'),
    copy: createSecureInvoke<[string, string], void>('fs:copy'),
    move: createSecureInvoke<[string, string], void>('fs:move'),
    getStats: createSecureInvoke<[string], any>('fs:getStats'),
    listFiles: createSecureInvoke<[string], string[]>('fs:listFiles'),
    listDirectories: createSecureInvoke<[string], string[]>('fs:listDirectories'),
    ensureDirectory: createSecureInvoke<[string], void>('fs:ensureDirectory'),
    getSize: createSecureInvoke<[string], number>('fs:getSize'),
    formatSize: createSecureInvoke<[number], string>('fs:formatSize'),
    sanitizeFilename: createSecureInvoke<[string], string>('fs:sanitizeFilename'),
    createUniqueFilename: createSecureInvoke<[string], string>('fs:createUniqueFilename'),
    getAppPaths: createSecureInvoke<[], any>('fs:getAppPaths'),
    initializeDirectories: createSecureInvoke<[], void>('fs:initializeDirectories'),
    cleanupTempFiles: createSecureInvoke<[], void>('fs:cleanupTempFiles'),
    selectDirectory: createSecureInvoke<[], string | null>('fs:selectDirectory'),
  },

  // Settings management
  settings: {
    get: <T>(key: string) => createSecureInvoke<[string], T>('settings:get')(key),
    set: <T>(key: string, value: T) => createSecureInvoke<[string, T], void>('settings:set')(key, value),
    getAll: createSecureInvoke<[], any>('settings:getAll'),
    reset: createSecureInvoke<[], void>('settings:reset'),
    hasCustomValue: createSecureInvoke<[string], boolean>('settings:hasCustomValue'),
    getStorePath: createSecureInvoke<[], string>('settings:getStorePath'),
    validate: createSecureInvoke<[], boolean>('settings:validate'),
    export: createSecureInvoke<[], string>('settings:export'),
    import: createSecureInvoke<[string], boolean>('settings:import'),
    initializeDownloadLocation: createSecureInvoke<[], void>('settings:initializeDownloadLocation'),
  },

  // Playlist operations (placeholder implementations for future tasks)
  playlist: {
    getAll: createSecureInvoke<[any?], any[]>('playlist:getAll'),
    getById: createSecureInvoke<[number], any>('playlist:getById'),
    create: createSecureInvoke<[any], any>('playlist:create'),
    update: createSecureInvoke<[number, any], any>('playlist:update'),
    delete: createSecureInvoke<[number], void>('playlist:delete'),
    searchVideos: createSecureInvoke<[any], any[]>('playlist:searchVideos'),
    addVideo: createSecureInvoke<[number, string], void>('playlist:addVideo'),
    removeVideo: createSecureInvoke<[number, string], void>('playlist:removeVideo'),
    reorderVideos: createSecureInvoke<[number, any[]], void>('playlist:reorderVideos'),
    getStats: createSecureInvoke<[number], any>('playlist:getStats'),
  },

  // YouTube operations (placeholder implementations for future tasks)
  youtube: {
    getPlaylistMetadata: createSecureInvoke<[string], any>('youtube:getPlaylistMetadata'),
    importPlaylist: createSecureInvoke<[string], any>('youtube:importPlaylist'),
    getVideoQualities: createSecureInvoke<[string], string[]>('youtube:getVideoQualities'),
    checkAvailability: createSecureInvoke<[], any>('youtube:checkAvailability'),
    updateYtDlp: createSecureInvoke<[], any>('youtube:updateYtDlp'),
    validateUrl: createSecureInvoke<[string], any>('youtube:validateUrl'),
    onImportProgress: createSecureListener<[any]>('youtube:importProgress'),
  },

  // Dependency management
  dependency: {
    checkStatus: createSecureInvoke<[], any>('dependency:checkStatus'),
    getStatus: createSecureInvoke<[], any>('dependency:getStatus'),
    install: createSecureInvoke<['ytdlp' | 'ffmpeg'], any>('dependency:install'),
    validate: createSecureInvoke<['ytdlp' | 'ffmpeg'], boolean>('dependency:validate'),
    getVersion: createSecureInvoke<['ytdlp' | 'ffmpeg'], string | null>('dependency:getVersion'),
    getPath: createSecureInvoke<['ytdlp' | 'ffmpeg'], string>('dependency:getPath'),
    cleanup: createSecureInvoke<[], any>('dependency:cleanup'),
    areAllReady: createSecureInvoke<[], boolean>('dependency:areAllReady'),
    isInitialized: createSecureInvoke<[], boolean>('dependency:isInitialized'),
    onStatusUpdated: createSecureListener<[any]>('dependency:statusUpdated'),
    onDownloadProgress: createSecureListener<[any]>('dependency:downloadProgress'),
    onInstallStarted: createSecureListener<[string]>('dependency:installStarted'),
    onInstallCompleted: createSecureListener<[string]>('dependency:installCompleted'),
    onInstallFailed: createSecureListener<[any]>('dependency:installFailed'),
  },

  // Legacy methods for backward compatibility
  getPlaylistMetadata: createSecureInvoke<[string], any>('playlist:getMetadata'),
  startImport: createSecureInvoke<[string], any>('import:start'),
  onTaskUpdate: createSecureListener<[any]>('task:update'),
  getPlaylistDetails: createSecureInvoke<[string], any>('getPlaylistDetails'),
  getPlaylists: createSecureInvoke<[], any[]>('getPlaylists'),
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