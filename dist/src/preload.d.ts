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
declare global {
    interface Window {
        api: ElectronAPI;
    }
}
export {};
//# sourceMappingURL=preload.d.ts.map