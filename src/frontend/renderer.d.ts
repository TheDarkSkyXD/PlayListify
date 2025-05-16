import { OpenDialogOptions, OpenDialogReturnValue } from 'electron';
import {
  UserSettings,
  Playlist,
  Video,
  PlaylistVideo,
  DownloadQueueItem,
  IpcResponse,
  Settings as AppSpecificSettings,
  PlaylistPreviewData,
} from '../shared/types'; // Adjust path as necessary

// Type for progress data
type DownloadProgressData = Partial<DownloadQueueItem>;

// Type for app.getPath() names
type AppPathName =
  | 'home' | 'appData' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module'
  | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
  | 'recent' | 'logs' | 'crashDumps';

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
    addItem: (itemDetails: Pick<DownloadQueueItem, 'url' | 'id' | 'title' | 'outputPath' | 'playlistId' | 'thumbnailUrl'> & { format?: AppSpecificSettings['downloadFormat'], quality?: AppSpecificSettings['defaultQuality'] }) => Promise<IpcResponse<{ downloadId: string }>>;
    pauseItem: (downloadId: string) => Promise<IpcResponse<void>>;
    resumeItem: (downloadId: string) => Promise<IpcResponse<void>>;
    cancelItem: (downloadId: string) => Promise<IpcResponse<void>>;
    retryItem: (downloadId: string) => Promise<IpcResponse<void>>;
    removeItem: (downloadId: string) => Promise<IpcResponse<void>>;
    getAllItems: () => Promise<IpcResponse<DownloadQueueItem[]>>;
    clearCompleted: () => Promise<IpcResponse<void>>;
    onProgressUpdate: (callback: (progressData: DownloadProgressData) => void) => (() => void);
  };
  playlists: {
    getAll: () => Promise<IpcResponse<Playlist[]>>;
    getById: (id: string) => Promise<IpcResponse<Playlist | null>>;
    create: (details: Pick<Playlist, 'name' | 'description' | 'source' | 'youtubePlaylistId'>) => Promise<IpcResponse<{ playlistId: string }>>;
    updateDetails: (id: string, details: Partial<Pick<Playlist, 'name' | 'description'>>) => Promise<IpcResponse<void>>;
    delete: (id: string) => Promise<IpcResponse<void>>;
    addVideo: (playlistId: string, videoDetails: Pick<Video, 'id' | 'title' | 'thumbnailUrl' | 'url'>) => Promise<IpcResponse<void>>;
    getVideos: (playlistId: string) => Promise<IpcResponse<PlaylistVideo[]>>;
    removeVideo: (playlistId: string, videoId: string) => Promise<IpcResponse<void>>;
    reorderVideos: (playlistId: string, videoIdsInOrder: string[]) => Promise<IpcResponse<void>>;
    importFromUrl: (url: string) => Promise<IpcResponse<{ playlistId: string }>>;
  };
  thumbnails: {
    getForVideo: (videoId: string, videoUrl?: string) => Promise<IpcResponse<{ thumbnailPathOrUrl: string | null }>>;
    getForPlaylist: (playlistId: string) => Promise<IpcResponse<{ thumbnailPathOrUrl: string | null }>>;
    clearCache: () => Promise<IpcResponse<void>>;
  };
  ytDlp: {
    getPlaylistMetadata: (url: string) => Promise<PlaylistPreviewData>;
  };
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
} 