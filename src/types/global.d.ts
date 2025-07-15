// Global type definitions for the Electron renderer process

interface ElectronAPI {
  getPlaylistMetadata: (url: string) => Promise<any>;
  startImport: (url: string) => Promise<any>;
  onTaskUpdate: (callback: (event: any, data: any) => void) => void;
  getPlaylistDetails: (playlistId: string) => Promise<any>;
  getPlaylists: () => Promise<any>;
  settings: {
    get: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
    getAll: () => Promise<{ success: boolean; data?: any; error?: string }>;
    reset: () => Promise<{ success: boolean; error?: string }>;
    hasCustomValue: (key: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
    getStorePath: () => Promise<{ success: boolean; data?: string; error?: string }>;
    validate: () => Promise<{ success: boolean; error?: string }>;
    export: () => Promise<{ success: boolean; data?: string; error?: string }>;
    import: (jsonString: string) => Promise<{ success: boolean; error?: string }>;
    initializeDownloadLocation: () => Promise<{ success: boolean; error?: string }>;
  };
  file: {
    exists: (path: string) => Promise<{ success: boolean; data?: boolean; error?: string }>;
    readJson: (path: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    writeJson: (path: string, data: any) => Promise<{ success: boolean; error?: string }>;
    readText: (path: string, encoding?: BufferEncoding) => Promise<{ success: boolean; data?: string; error?: string }>;
    writeText: (path: string, content: string, encoding?: BufferEncoding) => Promise<{ success: boolean; error?: string }>;
    delete: (path: string) => Promise<{ success: boolean; error?: string }>;
    copy: (src: string, dest: string) => Promise<{ success: boolean; error?: string }>;
    move: (src: string, dest: string) => Promise<{ success: boolean; error?: string }>;
    getStats: (path: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    listFiles: (dirPath: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    listDirectories: (dirPath: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    ensureDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
    getSize: (path: string) => Promise<{ success: boolean; data?: number; error?: string }>;
    formatSize: (bytes: number) => Promise<{ success: boolean; data?: string; error?: string }>;
    sanitizeFilename: (filename: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    createUniqueFilename: (path: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    getAppPaths: () => Promise<{ success: boolean; data?: any; error?: string }>;
    initializeDirectories: () => Promise<{ success: boolean; error?: string }>;
    cleanupTempFiles: () => Promise<{ success: boolean; error?: string }>;
  };
  playlist: {
    getAll: (options?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    getById: (playlistId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    create: (input: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    update: (playlistId: number, updates: any) => Promise<{ success: boolean; data?: any; error?: string }>;
    delete: (playlistId: number) => Promise<{ success: boolean; error?: string }>;
    searchVideos: (options: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
    addVideo: (playlistId: number, videoId: string) => Promise<{ success: boolean; error?: string }>;
    removeVideo: (playlistId: number, videoId: string) => Promise<{ success: boolean; error?: string }>;
    reorderVideos: (playlistId: number, videoOrders: any[]) => Promise<{ success: boolean; error?: string }>;
    getStats: (playlistId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
  };
  youtube: {
    getPlaylistMetadata: (url: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    importPlaylist: (url: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    getVideoQualities: (videoId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    checkAvailability: () => Promise<{ success: boolean; data?: boolean; error?: string }>;
    updateYtDlp: () => Promise<{ success: boolean; error?: string }>;
    validateUrl: (url: string) => Promise<{ success: boolean; data?: { isValid: boolean; sanitizedUrl?: string }; error?: string }>;
    onImportProgress: (callback: (event: any, data: any) => void) => void;
  };
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export {};