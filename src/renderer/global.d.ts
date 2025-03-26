interface Window {
  api: {
    // IPC Invocation - used for invoking main process functions from the renderer
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    
    // IPC Send - used for sending messages to the main process
    send: (channel: string, ...args: any[]) => void;
    
    // IPC Receive - used for receiving messages from the main process
    receive: (channel: string, func: (...args: any[]) => void) => void;
    
    // Path utilities
    paths: {
      getAppPath: (name: string) => Promise<string>;
      join: (...paths: string[]) => string;
    },
    
    // Settings API shortcuts
    settings: {
      get: (key: string) => Promise<any>;
      set: (key: string, value: any) => Promise<boolean>;
      getAll: () => Promise<any>;
      reset: (key: string) => Promise<boolean>;
      resetAll: () => Promise<boolean>;
    },
    
    // File system API shortcuts
    fs: {
      selectDirectory: () => Promise<string>;
      createPlaylistDir: (playlistId: string, playlistName: string) => Promise<string>;
      writePlaylistMetadata: (playlistId: string, playlistName: string, metadata: any) => Promise<boolean>;
      readPlaylistMetadata: (playlistId: string, playlistName: string) => Promise<any>;
      getAllPlaylists: () => Promise<any[]>;
      deletePlaylist: (playlistId: string, playlistName: string) => Promise<boolean>;
      videoExists: (playlistId: string, playlistName: string, videoId: string, format: string) => Promise<boolean>;
      getFileSize: (filePath: string) => Promise<number>;
      getFreeDiskSpace: () => Promise<number>;
      validatePath: (dirPath: string) => Promise<{ valid: boolean; error?: string }>;
    },
    
    // Image utilities
    images: {
      cacheImage: (url: string) => Promise<string>;
      getLocalPath: (url: string, downloadIfMissing?: boolean) => Promise<string>;
      clearCache: (maxAgeDays?: number) => Promise<boolean>;
    },
    
    // YouTube API shortcuts
    youtube: {
      getPlaylistInfo: (playlistUrl: string) => Promise<any>;
      getPlaylistVideos: (playlistUrl: string) => Promise<any>;
      importPlaylist: (playlistUrl: string) => Promise<any>;
      checkVideoStatus: (videoUrl: string) => Promise<any>;
      downloadVideo: (videoUrl: string, outputDir: string, videoId: string, options?: any) => Promise<string>;
    },
    
    // yt-dlp management API shortcuts
    ytDlp: {
      getStatus: () => Promise<any>;
      download: () => Promise<any>;
      getDownloadProgress: () => Promise<any>;
      getVideoInfo: (url: string) => Promise<any>;
    },
    
    // Playlist management API shortcuts
    playlists: {
      create: (name: string, description?: string) => Promise<any>;
      getAll: () => Promise<any>;
      getById: (playlistId: string) => Promise<any>;
      delete: (playlistId: string) => Promise<void>;
      update: (playlistId: string, updates: any) => Promise<any>;
      addVideo: (playlistId: string, videoUrl: string) => Promise<any>;
      removeVideo: (playlistId: string, videoId: string) => Promise<any>;
      downloadVideo: (playlistId: string, videoId: string, options?: any) => Promise<string>;
      refresh: (playlistId: string) => Promise<any>;
    }
  };
} 