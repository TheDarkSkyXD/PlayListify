// src/backend/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import type {
  AppStatus,
  DownloadItem,
  DownloadRequest,
  IpcResponse,
  PaginatedResponse,
  Playlist,
  PlaylistCreateInput,
  PlaylistUpdateInput,
  QueryParams,
  Settings,
  Video,
} from '../shared/types';

export interface ElectronAPI {
  // App Handlers
  getAppStatus: () => Promise<IpcResponse<AppStatus>>;
  getAppPath: (pathName: string) => Promise<IpcResponse<string>>;

  // Settings Handlers
  getSettings: () => Promise<IpcResponse<Settings>>;
  saveSettings: (settings: Partial<Settings>) => Promise<IpcResponse<Settings>>;
  getSetting: <K extends keyof Settings>(key: K) => Promise<IpcResponse<Settings[K]>>;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<IpcResponse<Settings[K]>>;
  openDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;


  // File Handlers
  checkFileExists: (filePath: string) => Promise<IpcResponse<boolean>>;
  createDirectory: (dirPath: string) => Promise<IpcResponse<boolean>>;
  // Add other file handlers as needed, e.g., readFile, writeFile, deleteFile

  // Download Handlers
  downloadVideo: (request: DownloadRequest) => Promise<IpcResponse<DownloadItem>>;
  getDownloadQueue: () => Promise<IpcResponse<DownloadItem[]>>;
  pauseDownload: (downloadId: string) => Promise<IpcResponse<boolean>>;
  resumeDownload: (downloadId: string) => Promise<IpcResponse<boolean>>;
  cancelDownload: (downloadId: string) => Promise<IpcResponse<boolean>>;
  clearFinishedDownloads: () => Promise<IpcResponse<boolean>>;

  // Playlist Handlers
  getAllPlaylists: (params?: QueryParams) => Promise<IpcResponse<PaginatedResponse<Playlist>>>;
  getPlaylistById: (id: string) => Promise<IpcResponse<Playlist | null>>;
  createPlaylist: (playlistInput: PlaylistCreateInput) => Promise<IpcResponse<Playlist>>;
  updatePlaylist: (id: string, playlistUpdate: PlaylistUpdateInput) => Promise<IpcResponse<Playlist>>;
  deletePlaylist: (id: string) => Promise<IpcResponse<boolean>>;
  addVideoToPlaylist: (playlistId: string, video: Video) => Promise<IpcResponse<Playlist>>;
  removeVideoFromPlaylist: (playlistId: string, videoId: string) => Promise<IpcResponse<Playlist>>;
  importYouTubePlaylist: (youtubePlaylistUrl: string) => Promise<IpcResponse<Playlist>>;
  
  // Thumbnail Handlers
  getThumbnail: (videoId: string) => Promise<IpcResponse<string | null>>;
  cacheThumbnail: (videoId: string, thumbnailUrl: string) => Promise<IpcResponse<string>>;

  // Listener for IPC messages sent from main to renderer (if any)
  on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => Electron.IpcRenderer;
  // Remove listener
  removeListener: (channel: string, listener: (...args: any[]) => void) => Electron.IpcRenderer;
  // Remove all listeners for a channel
  removeAllListeners: (channel: string) => Electron.IpcRenderer;

}

const exposedApi: ElectronAPI = {
  // App Handlers
  getAppStatus: () => ipcRenderer.invoke('get-app-status'),
  getAppPath: (pathName) => ipcRenderer.invoke('get-app-path', pathName),
  
  // Settings Handlers
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getSetting: (key) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  openDialog: (options) => ipcRenderer.invoke('dialog:open', options),

  // File Handlers
  checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),

  // Download Handlers
  downloadVideo: (request) => ipcRenderer.invoke('download-video', request),
  getDownloadQueue: () => ipcRenderer.invoke('get-download-queue'),
  pauseDownload: (downloadId) => ipcRenderer.invoke('pause-download', downloadId),
  resumeDownload: (downloadId) => ipcRenderer.invoke('resume-download', downloadId),
  cancelDownload: (downloadId) => ipcRenderer.invoke('cancel-download', downloadId),
  clearFinishedDownloads: () => ipcRenderer.invoke('clear-finished-downloads'),

  // Playlist Handlers
  getAllPlaylists: (params) => ipcRenderer.invoke('get-all-playlists', params),
  getPlaylistById: (id) => ipcRenderer.invoke('get-playlist-by-id', id),
  createPlaylist: (playlistInput) => ipcRenderer.invoke('create-playlist', playlistInput),
  updatePlaylist: (id, playlistUpdate) => ipcRenderer.invoke('update-playlist', id, playlistUpdate),
  deletePlaylist: (id) => ipcRenderer.invoke('delete-playlist', id),
  addVideoToPlaylist: (playlistId, video) => ipcRenderer.invoke('add-video-to-playlist', playlistId, video),
  removeVideoFromPlaylist: (playlistId, videoId) => ipcRenderer.invoke('remove-video-from-playlist', playlistId, videoId),
  importYouTubePlaylist: (youtubePlaylistUrl) => ipcRenderer.invoke('import-youtube-playlist', youtubePlaylistUrl),

  // Thumbnail Handlers
  getThumbnail: (videoId) => ipcRenderer.invoke('get-thumbnail', videoId),
  cacheThumbnail: (videoId, thumbnailUrl) => ipcRenderer.invoke('cache-thumbnail', videoId, thumbnailUrl),

  // IPC listeners
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
};

try {
  contextBridge.exposeInMainWorld('api', exposedApi);
  console.log('Electron API exposed to renderer process via contextBridge.');
} catch (error) {
  console.error('Failed to expose Electron API via contextBridge:', error);
}

// It's good practice to also declare the API on the window object for TypeScript intellisense in the renderer.
// This is typically done in a .d.ts file in the frontend/src directory.
// e.g., src/frontend/electron.d.ts
/*
declare global {
  interface Window {
    api: ElectronAPI;
  }
}
*/