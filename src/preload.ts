// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface for type safety
interface ElectronAPI {
  getPlaylistMetadata: (url: string) => Promise<any>;
  startImport: (url: string) => Promise<any>;
  onTaskUpdate: (callback: (event: any, data: any) => void) => void;
  getPlaylistDetails: (playlistId: string) => Promise<any>;
  getPlaylists: () => Promise<any>;
  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    getAll: () => Promise<any>;
    reset: () => Promise<void>;
    hasCustomValue: (key: string) => Promise<boolean>;
    getStorePath: () => Promise<string>;
    validate: () => Promise<boolean>;
    export: () => Promise<string>;
    import: (jsonString: string) => Promise<boolean>;
    initializeDownloadLocation: () => Promise<void>;
  };
  file: {
    exists: (path: string) => Promise<boolean>;
    readJson: (path: string) => Promise<any>;
    writeJson: (path: string, data: any) => Promise<void>;
    readText: (path: string, encoding?: BufferEncoding) => Promise<any>;
    writeText: (path: string, content: string, encoding?: BufferEncoding) => Promise<any>;
    delete: (path: string) => Promise<any>;
    copy: (src: string, dest: string) => Promise<any>;
    move: (src: string, dest: string) => Promise<any>;
    getStats: (path: string) => Promise<any>;
    listFiles: (dirPath: string) => Promise<any>;
    listDirectories: (dirPath: string) => Promise<any>;
    ensureDirectory: (dirPath: string) => Promise<any>;
    getSize: (path: string) => Promise<any>;
    formatSize: (bytes: number) => Promise<any>;
    sanitizeFilename: (filename: string) => Promise<any>;
    createUniqueFilename: (path: string) => Promise<any>;
    getAppPaths: () => Promise<any>;
    initializeDirectories: () => Promise<any>;
    cleanupTempFiles: () => Promise<any>;
  };
  playlist: {
    getAll: (options?: any) => Promise<any>;
    getById: (playlistId: number) => Promise<any>;
    create: (input: any) => Promise<any>;
    update: (playlistId: number, updates: any) => Promise<any>;
    delete: (playlistId: number) => Promise<any>;
    searchVideos: (options: any) => Promise<any>;
    addVideo: (playlistId: number, videoId: string) => Promise<any>;
    removeVideo: (playlistId: number, videoId: string) => Promise<any>;
    reorderVideos: (playlistId: number, videoOrders: any[]) => Promise<any>;
    getStats: (playlistId: number) => Promise<any>;
  };
  youtube: {
    getPlaylistMetadata: (url: string) => Promise<any>;
    importPlaylist: (url: string) => Promise<any>;
    getVideoQualities: (videoId: string) => Promise<any>;
    checkAvailability: () => Promise<any>;
    updateYtDlp: () => Promise<any>;
    validateUrl: (url: string) => Promise<any>;
    onImportProgress: (callback: (event: any, data: any) => void) => void;
  };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api: ElectronAPI = {
  getPlaylistMetadata: (url: string) => ipcRenderer.invoke('playlist:getMetadata', url),
  startImport: (url: string) => ipcRenderer.invoke('import:start', url),
  onTaskUpdate: (callback: (event: any, data: any) => void) => ipcRenderer.on('task:update', callback),
  getPlaylistDetails: (playlistId: string) => ipcRenderer.invoke('getPlaylistDetails', playlistId),
  getPlaylists: () => ipcRenderer.invoke('getPlaylists'),
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    reset: () => ipcRenderer.invoke('settings:reset'),
    hasCustomValue: (key: string) => ipcRenderer.invoke('settings:hasCustomValue', key),
    getStorePath: () => ipcRenderer.invoke('settings:getStorePath'),
    validate: () => ipcRenderer.invoke('settings:validate'),
    export: () => ipcRenderer.invoke('settings:export'),
    import: (jsonString: string) => ipcRenderer.invoke('settings:import', jsonString),
    initializeDownloadLocation: () => ipcRenderer.invoke('settings:initializeDownloadLocation'),
  },
  file: {
    exists: (path: string) => ipcRenderer.invoke('file:exists', path),
    readJson: (path: string) => ipcRenderer.invoke('file:readJson', path),
    writeJson: (path: string, data: any) => ipcRenderer.invoke('file:writeJson', path, data),
    readText: (path: string, encoding?: BufferEncoding) => ipcRenderer.invoke('file:readText', path, encoding),
    writeText: (path: string, content: string, encoding?: BufferEncoding) => ipcRenderer.invoke('file:writeText', path, content, encoding),
    delete: (path: string) => ipcRenderer.invoke('file:delete', path),
    copy: (src: string, dest: string) => ipcRenderer.invoke('file:copy', src, dest),
    move: (src: string, dest: string) => ipcRenderer.invoke('file:move', src, dest),
    getStats: (path: string) => ipcRenderer.invoke('file:getStats', path),
    listFiles: (dirPath: string) => ipcRenderer.invoke('file:listFiles', dirPath),
    listDirectories: (dirPath: string) => ipcRenderer.invoke('file:listDirectories', dirPath),
    ensureDirectory: (dirPath: string) => ipcRenderer.invoke('file:ensureDirectory', dirPath),
    getSize: (path: string) => ipcRenderer.invoke('file:getSize', path),
    formatSize: (bytes: number) => ipcRenderer.invoke('file:formatSize', bytes),
    sanitizeFilename: (filename: string) => ipcRenderer.invoke('file:sanitizeFilename', filename),
    createUniqueFilename: (path: string) => ipcRenderer.invoke('file:createUniqueFilename', path),
    getAppPaths: () => ipcRenderer.invoke('file:getAppPaths'),
    initializeDirectories: () => ipcRenderer.invoke('file:initializeDirectories'),
    cleanupTempFiles: () => ipcRenderer.invoke('file:cleanupTempFiles'),
  },
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
  youtube: {
    getPlaylistMetadata: (url: string) => ipcRenderer.invoke('youtube:getPlaylistMetadata', url),
    importPlaylist: (url: string) => ipcRenderer.invoke('youtube:importPlaylist', url),
    getVideoQualities: (videoId: string) => ipcRenderer.invoke('youtube:getVideoQualities', videoId),
    checkAvailability: () => ipcRenderer.invoke('youtube:checkAvailability'),
    updateYtDlp: () => ipcRenderer.invoke('youtube:updateYtDlp'),
    validateUrl: (url: string) => ipcRenderer.invoke('youtube:validateUrl', url),
    onImportProgress: (callback: (event: any, data: any) => void) => ipcRenderer.on('youtube:importProgress', callback),
  },
};

contextBridge.exposeInMainWorld('api', api);

// Define the API type for TypeScript
declare global {
  interface Window {
    api: ElectronAPI;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const dependency of ['chrome', 'node', 'electron'] as const) {
    const version = process.versions[dependency];
    if (version) {
      replaceText(`${dependency}-version`, version);
    }
  }
});