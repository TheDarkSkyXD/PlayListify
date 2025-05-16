import type { IpcResponse, UserSettings, Playlist, Video, PlaylistVideo, DownloadQueueItem, UpdatePlaylistPayload, PlaylistPreviewData as SharedPlaylistPreviewData, PlaylistCreationDetails } from './index';
import type { VideoPreviewData as SharedVideoPreviewData } from './video';
import type { OpenDialogOptions, OpenDialogReturnValue } from 'electron';

// This allows TypeScript to recognize the global constants injected by Electron Forge's Webpack plugin.
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Type for app.getPath() names (copied from preload.ts for consistency)
type AppPathName =
  | 'home' | 'appData' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module'
  | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
  | 'recent' | 'logs' | 'crashDumps';

// Type for progress data (copied from preload.ts)
type DownloadProgressData = Partial<DownloadQueueItem>;

// Define types for parameters to match preload expectations (copied from playlist-manager.ts as an example)
// These might need to be imported from a shared location if they grow complex or are used in many places.
type AddVideoToPlaylistDetailsType = Pick<Video, 'id' | 'title' | 'thumbnailUrl' | 'url'>;
// Assuming this structure for the itemDetails in downloads.addItem based on preload.ts
type DownloadAddItemDetailsType = Pick<DownloadQueueItem, 'url' | 'id' | 'title' | 'outputPath' | 'playlistId' | 'thumbnailUrl'> & { 
  format?: UserSettings['downloadFormat'], 
  quality?: UserSettings['defaultQuality'] 
};

export interface IElectronAPI {
  app: {
    getVersion: () => Promise<string>;
    getPath: (pathName: AppPathName) => Promise<string | null>;
  };
  settings: {
    get: <K extends keyof UserSettings>(key: K, defaultValue?: UserSettings[K]) => Promise<UserSettings[K] | undefined>;
    set: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
    getAll: () => Promise<UserSettings>;
    resetAll: () => Promise<void>;
  };
  fs: {
    openDialog: (options: OpenDialogOptions) => Promise<OpenDialogReturnValue>;
    createPlaylistDir: (playlistName: string) => Promise<string | null>;
    writePlaylistMetadata: (playlistName: string, playlistData: Playlist) => Promise<void>;
    readPlaylistMetadata: (playlistName: string) => Promise<Playlist | null>;
    deletePlaylistDir: (playlistName: string) => Promise<boolean>;
    getVideoPath: (playlistName: string, videoId: string, format?: string) => Promise<string | null>;
    videoFileExists: (playlistName: string, videoId: string, format?: string) => Promise<boolean>;
    deleteVideoFile: (playlistName: string, videoId: string, format?: string) => Promise<void>;
  };
  downloads: {
    addItem: (itemDetails: DownloadAddItemDetailsType) => Promise<IpcResponse<{ downloadId: string }>>;
    pauseItem: (downloadId: string) => Promise<IpcResponse<void>>;
    resumeItem: (downloadId: string) => Promise<IpcResponse<void>>;
    cancelItem: (downloadId: string) => Promise<IpcResponse<void>>;
    retryItem: (downloadId: string) => Promise<IpcResponse<void>>;
    removeItem: (downloadId: string) => Promise<IpcResponse<void>>;
    getAllItems: () => Promise<IpcResponse<DownloadQueueItem[]>>;
    clearCompleted: () => Promise<IpcResponse<void>>;
    onProgressUpdate: (callback: (progressData: DownloadProgressData) => void) => () => void;
  };
  playlists: {
    getAll: () => Promise<IpcResponse<Playlist[]>>;
    getById: (id: string) => Promise<IpcResponse<Playlist | null>>;
    create: (details: PlaylistCreationDetails) => Promise<IpcResponse<{ playlistId: string }>>;
    updateDetails: (payload: UpdatePlaylistPayload) => Promise<IpcResponse<Playlist | null>>;
    delete: (playlistId: string) => Promise<IpcResponse<void>>;
    addVideo: (playlistId: string, videoDetails: AddVideoToPlaylistDetailsType) => Promise<IpcResponse<void>>;
    getVideos: (playlistId: string) => Promise<IpcResponse<PlaylistVideo[]>>;
    removeVideo: (playlistId: string, videoId: string) => Promise<IpcResponse<void>>;
    reorderVideos: (playlistId: string, videoIdsInOrder: string[]) => Promise<IpcResponse<void>>;
    addVideoToCustomByUrl: (payload: AddVideoToCustomPlaylistPayload) => Promise<IpcResponse<Video | null>>;
    importFromUrl: (url: string) => Promise<IpcResponse<Playlist | null>>;
  };
  thumbnails: {
    getForVideo: (videoId: string, videoUrl?: string) => Promise<IpcResponse<{ thumbnailPathOrUrl: string | null }>>;
    getForPlaylist: (playlistId: string) => Promise<IpcResponse<{ thumbnailPathOrUrl: string | null }>>;
    clearCache: () => Promise<IpcResponse<void>>;
  };
  ytDlp: {
    getPlaylistMetadata: (url: string) => Promise<IpcResponse<SharedPlaylistPreviewData>>;
    getQuickPlaylistPreview: (url: string) => Promise<IpcResponse<SharedPlaylistPreviewData>>;
    downloadVideo: (videoId: string, playlistId?: string, quality?: string) => Promise<IpcResponse<void>>;
    getAvailableQualities: (videoUrl: string) => Promise<IpcResponse<string[]>>;
    ytDlpGetPlaylistMetadata: (url: string, maxItems?: number, attemptRepair?: boolean) => Promise<IpcResponse<YtDlpPlaylistMetadataRaw>>;
    ytDlpGetVideoMetadataForPreview: (url: string) => Promise<IpcResponse<SharedVideoPreviewData | null>>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  // Keep invoke and on for any direct/legacy channel usage if necessary, or remove if fully transitioned
  // invoke: <T = any>(channel: string, ...args: any[]) => Promise<IpcResponse<T>>;
  // on: (channel: string, listener: (event: any, ...args: any[]) => void) => (() => void);
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
} 