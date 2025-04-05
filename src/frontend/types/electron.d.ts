interface Window {
  api: {
    send: (channel: string, data: any) => void;
    receive: (channel: string, func: (...args: any[]) => void) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    settings: {
      get: (key: string) => Promise<any>;
      set: (key: string, value: any) => Promise<void>;
      getAll: () => Promise<any>;
      reset: (key: string) => Promise<void>;
      resetAll: () => Promise<void>;
    };
    fs: {
      selectDirectory: () => Promise<string>;
      createPlaylistDir: (playlistId: string, playlistName: string) => Promise<string>;
      writePlaylistMetadata: (playlistId: string, playlistName: string, metadata: any) => Promise<void>;
      readPlaylistMetadata: (playlistId: string, playlistName: string) => Promise<any>;
      getAllPlaylists: () => Promise<any[]>;
      deletePlaylist: (playlistId: string, playlistName: string) => Promise<void>;
      videoExists: (playlistId: string, playlistName: string, videoId: string, format: string) => Promise<boolean>;
      getFileSize: (filePath: string) => Promise<number>;
      getFreeDiskSpace: () => Promise<number>;
      validatePath: (dirPath: string) => Promise<boolean>;
    };
    images: {
      cacheImage: (url: string) => Promise<string>;
      getLocalPath: (url: string, downloadIfMissing?: boolean) => Promise<string>;
      clearCache: (maxAgeDays?: number) => Promise<void>;
    };
    youtube: {
      getPlaylistInfo: (playlistUrl: string) => Promise<any>;
      getPlaylistVideos: (playlistUrl: string) => Promise<any[]>;
      importPlaylist: (playlistUrl: string) => Promise<any>;
      checkVideoStatus: (videoUrl: string) => Promise<string>;
      downloadVideo: (videoUrl: string, outputDir: string, videoId: string, options?: any) => Promise<void>;
      onImportProgress: (callback: (data: { status: string, count?: number, total?: number }) => void) => () => void;
    };
    playlists: {
      create: (name: string, description?: string) => Promise<any>;
      getAll: () => Promise<any[]>;
      getById: (playlistId: string) => Promise<any>;
      delete: (playlistId: string) => Promise<void>;
      update: (playlistId: string, updates: any) => Promise<void>;
      addVideo: (playlistId: string, videoUrl: string) => Promise<void>;
      removeVideo: (playlistId: string, videoId: string) => Promise<void>;
      downloadVideo: (playlistId: string, videoId: string, options?: any) => Promise<void>;
      refresh: (playlistId: string) => Promise<void>;
    };
  };
}