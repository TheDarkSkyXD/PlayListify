import { contextBridge, ipcRenderer, OpenDialogOptions, OpenDialogReturnValue } from 'electron';
import { IPC_CHANNELS } from '../shared/constants/ipc-channels';
import {
  UserSettings, // Using UserSettings from settings.ts via index.ts
  Playlist,
  Video,
  PlaylistVideo,
  DownloadQueueItem,
  IpcResponse,
  Settings as AppSpecificSettings, // Use this for download item format/quality hints
  VideoQuality as AppSpecificVideoQuality, // If UserSettings.defaultQuality is too broad for specific cases
  UpdatePlaylistPayload,
  PlaylistPreviewData,
  PlaylistCreationDetails,
  AddVideoByUrlPayload,
  AddVideoToCustomPlaylistPayload,
} from '../shared/types';

// Type for progress data
type DownloadProgressData = Partial<DownloadQueueItem>; 

// Type for app.getPath() names
type AppPathName =
  | 'home' | 'appData' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module'
  | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
  | 'recent' | 'logs' | 'crashDumps';

const electronAPI = {
  // App API
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.GET_APP_VERSION),
    getPath: (pathName: AppPathName): Promise<string | null> => 
      ipcRenderer.invoke(IPC_CHANNELS.GET_APP_PATH, pathName),
  },

  // Settings API
  settings: {
    get: (key: string, defaultValue?: any) => ipcRenderer.invoke(IPC_CHANNELS.GET_SETTING, key, defaultValue),
    set: <K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.SET_SETTING, key, value),
    getAll: (): Promise<UserSettings> => ipcRenderer.invoke(IPC_CHANNELS.GET_ALL_SETTINGS),
    resetAll: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.RESET_ALL_SETTINGS),
  },

  // File System API
  fs: {
    openDialog: (options: OpenDialogOptions): Promise<OpenDialogReturnValue> =>
      ipcRenderer.invoke(IPC_CHANNELS.OPEN_DIRECTORY_DIALOG, options),
    createPlaylistDir: (playlistName: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.CREATE_PLAYLIST_DIR, playlistName),
    writePlaylistMetadata: (playlistName: string, playlistData: Playlist): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.WRITE_PLAYLIST_METADATA, playlistName, playlistData),
    readPlaylistMetadata: (playlistName: string): Promise<Playlist | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.READ_PLAYLIST_METADATA, playlistName),
    deletePlaylistDir: (playlistName: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.DELETE_PLAYLIST_DIR, playlistName),
    getVideoPath: (playlistName: string, videoId: string, format?: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.GET_VIDEO_PATH, playlistName, videoId, format),
    videoFileExists: (playlistName: string, videoId: string, format?: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.VIDEO_FILE_EXISTS, playlistName, videoId, format),
    deleteVideoFile: (playlistName: string, videoId: string, format?: string): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.DELETE_VIDEO_FILE, playlistName, videoId, format),
  },

  // Download API
  downloads: {
    addItem: (itemDetails: Pick<DownloadQueueItem, 'url' | 'id' | 'title' | 'outputPath' | 'playlistId' | 'thumbnailUrl'> & { format?: AppSpecificSettings['downloadFormat'], quality?: AppSpecificSettings['defaultQuality'] } ): Promise<IpcResponse<{ downloadId: string }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_ADD_ITEM, itemDetails),
    pauseItem: (downloadId: string): Promise<IpcResponse<void>> => 
      ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_PAUSE_ITEM, downloadId),
    resumeItem: (downloadId: string): Promise<IpcResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_RESUME_ITEM, downloadId),
    cancelItem: (downloadId: string): Promise<IpcResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_CANCEL_ITEM, downloadId),
    retryItem: (downloadId: string): Promise<IpcResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_RETRY_ITEM, downloadId),
    removeItem: (downloadId: string): Promise<IpcResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_REMOVE_ITEM, downloadId),
    getAllItems: (): Promise<IpcResponse<DownloadQueueItem[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_GET_ALL_ITEMS),
    clearCompleted: (): Promise<IpcResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_CLEAR_COMPLETED),
    onProgressUpdate: (callback: (progressData: DownloadProgressData) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: DownloadProgressData) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.DOWNLOAD_PROGRESS_UPDATE, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DOWNLOAD_PROGRESS_UPDATE, handler);
    }
  },

  // Playlist API
  playlists: {
    getAll: (): Promise<IpcResponse<Playlist[]>> => ipcRenderer.invoke(IPC_CHANNELS.PLAYLIST_GET_ALL),
    getById: (id: string): Promise<IpcResponse<Playlist | null>> => ipcRenderer.invoke(IPC_CHANNELS.PLAYLIST_GET_BY_ID, id),
    create: (details: PlaylistCreationDetails): Promise<IpcResponse<{ playlistId: string }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLAYLIST_CREATE, details),
    updateDetails: (payload: UpdatePlaylistPayload): Promise<IpcResponse<Playlist>> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLAYLIST_UPDATE_DETAILS, payload),
    delete: (id: string): Promise<IpcResponse<void>> => ipcRenderer.invoke(IPC_CHANNELS.PLAYLIST_DELETE, id),
    getVideos: (playlistId: string): Promise<IpcResponse<PlaylistVideo[]>> => ipcRenderer.invoke(IPC_CHANNELS.PLAYLIST_GET_ALL_VIDEOS, playlistId),
    reorderVideos: (playlistId: string, videoIdsInOrder: string[]) => ipcRenderer.invoke(IPC_CHANNELS.PLAYLIST_REORDER_VIDEOS, playlistId, videoIdsInOrder),
    addVideoToCustomByUrl: (payload: AddVideoToCustomPlaylistPayload) => ipcRenderer.invoke(IPC_CHANNELS.PLAYLIST_ADD_VIDEO_BY_URL, payload) as Promise<IpcResponse<Video | null>>,
    removeVideo: (playlistId: string, videoId: string): Promise<IpcResponse<void>> => ipcRenderer.invoke(IPC_CHANNELS.PLAYLIST_REMOVE_VIDEO, playlistId, videoId),
    importFromUrl: (url: string): Promise<IpcResponse<Playlist | null>> => ipcRenderer.invoke(IPC_CHANNELS.PLAYLIST_IMPORT_FROM_URL, url),
  },

  // Thumbnail API
  thumbnails: {
    getForVideo: (videoId: string, videoUrl?: string): Promise<IpcResponse<{ thumbnailPathOrUrl: string | null }>> => 
      ipcRenderer.invoke(IPC_CHANNELS.THUMBNAIL_GET_FOR_VIDEO, videoId, videoUrl),
    getForPlaylist: (playlistId: string): Promise<IpcResponse<{ thumbnailPathOrUrl: string | null }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.THUMBNAIL_GET_FOR_PLAYLIST, playlistId),
    clearCache: (): Promise<IpcResponse<void>> => ipcRenderer.invoke(IPC_CHANNELS.THUMBNAIL_CLEAR_CACHE),
  },

  // Add ytDlp API
  ytDlp: {
    getPlaylistMetadata: (url: string): Promise<IpcResponse<PlaylistPreviewData>> =>
      ipcRenderer.invoke(IPC_CHANNELS.YTDLP_GET_PLAYLIST_METADATA, url),
    getQuickPlaylistPreview: (url: string): Promise<IpcResponse<PlaylistPreviewData>> =>
      ipcRenderer.invoke(IPC_CHANNELS.YTDLP_GET_QUICK_PLAYLIST_PREVIEW, url),
    downloadVideo: (videoId: string, playlistId?: string, quality?: string): Promise<IpcResponse<void>> =>
      ipcRenderer.invoke(IPC_CHANNELS.YTDLP_DOWNLOAD_VIDEO, videoId, playlistId, quality),
    getAvailableQualities: (url: string): Promise<IpcResponse<string[]>> => 
      ipcRenderer.invoke(IPC_CHANNELS.YTDLP_GET_AVAILABLE_QUALITIES, url),
    ytDlpGetPlaylistMetadata: (url: string, maxItems?: number, attemptRepair?: boolean) => 
      ipcRenderer.invoke(IPC_CHANNELS.YTDLP_GET_PLAYLIST_METADATA, url, maxItems, attemptRepair),
    ytDlpGetVideoMetadataForPreview: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_VIDEO_METADATA_FOR_PREVIEW, url),
  },

  shell: {
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI);
    console.log('Electron API exposed to renderer world. 🚀');
  } catch (error) {
    console.error('Failed to expose Electron API in preload:', error);
  }
} else {
  // @ts-ignore
  window.electronAPI = electronAPI;
  console.warn('Context Isolation is disabled. Preload script exposed directly. Not recommended for security.');
}

console.log('Preload script executed.'); 