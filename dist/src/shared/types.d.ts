/**
 * Shared TypeScript interfaces for secure IPC communication between main and renderer processes
 * This file defines the complete API surface exposed through the preload script with proper error handling
 */
export interface IPCResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}
export interface AppAPI {
    getVersion(): Promise<string>;
    quit(): Promise<void>;
    minimize(): Promise<void>;
    maximize(): Promise<void>;
    isMaximized(): Promise<boolean>;
    unmaximize(): Promise<void>;
    close(): Promise<void>;
    showErrorDialog(title: string, content: string): Promise<void>;
    showMessageDialog(options: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue>;
    selectDirectory(options?: Electron.OpenDialogOptions): Promise<string | null>;
    selectFile(options?: Electron.OpenDialogOptions): Promise<string | null>;
    saveFile(options?: Electron.SaveDialogOptions): Promise<string | null>;
}
export interface FileSystemAPI {
    exists(path: string): Promise<boolean>;
    readJson(path: string): Promise<any>;
    writeJson(path: string, data: any): Promise<void>;
    readText(path: string, encoding?: BufferEncoding): Promise<string>;
    writeText(path: string, content: string, encoding?: BufferEncoding): Promise<void>;
    delete(path: string): Promise<void>;
    copy(src: string, dest: string): Promise<void>;
    move(src: string, dest: string): Promise<void>;
    getStats(path: string): Promise<any>;
    listFiles(dirPath: string): Promise<string[]>;
    listDirectories(dirPath: string): Promise<string[]>;
    ensureDirectory(dirPath: string): Promise<void>;
    getSize(path: string): Promise<number>;
    formatSize(bytes: number): Promise<string>;
    sanitizeFilename(filename: string): Promise<string>;
    createUniqueFilename(path: string): Promise<string>;
    getAppPaths(): Promise<any>;
    initializeDirectories(): Promise<void>;
    cleanupTempFiles(): Promise<void>;
    selectDirectory(): Promise<string | null>;
}
export interface SettingsAPI {
    get<T>(key: string): Promise<T>;
    set<T>(key: string, value: T): Promise<void>;
    getAll(): Promise<any>;
    reset(): Promise<void>;
    hasCustomValue(key: string): Promise<boolean>;
    getStorePath(): Promise<string>;
    validate(): Promise<boolean>;
    export(): Promise<string>;
    import(jsonString: string): Promise<boolean>;
    initializeDownloadLocation(): Promise<void>;
}
export interface PlaylistAPI {
    getAll(options?: any): Promise<any>;
    getById(playlistId: number): Promise<any>;
    create(input: any): Promise<any>;
    update(playlistId: number, updates: any): Promise<any>;
    delete(playlistId: number): Promise<any>;
    searchVideos(options: any): Promise<any>;
    addVideo(playlistId: number, videoId: string): Promise<any>;
    removeVideo(playlistId: number, videoId: string): Promise<any>;
    reorderVideos(playlistId: number, videoOrders: any[]): Promise<any>;
    getStats(playlistId: number): Promise<any>;
}
export interface YouTubeAPI {
    getPlaylistMetadata(url: string): Promise<any>;
    importPlaylist(url: string): Promise<any>;
    getVideoQualities(videoId: string): Promise<any>;
    checkAvailability(): Promise<any>;
    updateYtDlp(): Promise<any>;
    validateUrl(url: string): Promise<any>;
    onImportProgress(callback: (event: any, data: any) => void): void;
}
export interface DependencyAPI {
    checkStatus(): Promise<any>;
    getStatus(): Promise<any>;
    install(dependencyName: 'ytdlp' | 'ffmpeg'): Promise<any>;
    validate(dependencyName: 'ytdlp' | 'ffmpeg'): Promise<boolean>;
    getVersion(dependencyName: 'ytdlp' | 'ffmpeg'): Promise<string | null>;
    getPath(dependencyName: 'ytdlp' | 'ffmpeg'): Promise<string>;
    cleanup(): Promise<any>;
    areAllReady(): Promise<boolean>;
    isInitialized(): Promise<boolean>;
    onStatusUpdated(callback: (event: any, status: any) => void): void;
    onDownloadProgress(callback: (event: any, progress: any) => void): void;
    onInstallStarted(callback: (event: any, dependency: string) => void): void;
    onInstallCompleted(callback: (event: any, dependency: string) => void): void;
    onInstallFailed(callback: (event: any, data: any) => void): void;
}
export interface ElectronAPI {
    app: AppAPI;
    fs: FileSystemAPI;
    settings: SettingsAPI;
    playlist: PlaylistAPI;
    youtube: YouTubeAPI;
    dependency: DependencyAPI;
    getPlaylistMetadata: (url: string) => Promise<any>;
    startImport: (url: string) => Promise<any>;
    onTaskUpdate: (callback: (event: any, data: any) => void) => void;
    getPlaylistDetails: (playlistId: string) => Promise<any>;
    getPlaylists: () => Promise<any>;
}
export interface WindowAPI extends ElectronAPI {
}
export interface AppConfig {
    window: {
        width: number;
        height: number;
        minWidth: number;
        minHeight: number;
        center: boolean;
    };
    security: {
        nodeIntegration: boolean;
        contextIsolation: boolean;
        webSecurity: boolean;
        allowRunningInsecureContent: boolean;
        experimentalFeatures: boolean;
    };
    development: {
        devTools: boolean;
        hotReload: boolean;
        debugLogging: boolean;
    };
}
export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    language: string;
    downloadLocation: string;
    tempDirectory: string;
    startMinimized: boolean;
    closeToTray: boolean;
    autoUpdate: boolean;
    windowSize?: {
        width: number;
        height: number;
    };
    windowPosition?: {
        x: number;
        y: number;
    };
    debugMode?: boolean;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
}
export declare const IPC_CHANNELS: {
    readonly APP_GET_VERSION: "app:getVersion";
    readonly APP_QUIT: "app:quit";
    readonly APP_MINIMIZE: "app:minimize";
    readonly APP_MAXIMIZE: "app:maximize";
    readonly APP_IS_MAXIMIZED: "app:isMaximized";
    readonly APP_UNMAXIMIZE: "app:unmaximize";
    readonly APP_CLOSE: "app:close";
    readonly FS_EXISTS: "fs:exists";
    readonly FS_READ_JSON: "fs:readJson";
    readonly FS_WRITE_JSON: "fs:writeJson";
    readonly FS_READ_TEXT: "fs:readText";
    readonly FS_WRITE_TEXT: "fs:writeText";
    readonly FS_DELETE: "fs:delete";
    readonly FS_COPY: "fs:copy";
    readonly FS_MOVE: "fs:move";
    readonly FS_GET_STATS: "fs:getStats";
    readonly FS_LIST_FILES: "fs:listFiles";
    readonly FS_LIST_DIRECTORIES: "fs:listDirectories";
    readonly FS_ENSURE_DIRECTORY: "fs:ensureDirectory";
    readonly FS_GET_SIZE: "fs:getSize";
    readonly FS_FORMAT_SIZE: "fs:formatSize";
    readonly FS_SANITIZE_FILENAME: "fs:sanitizeFilename";
    readonly FS_CREATE_UNIQUE_FILENAME: "fs:createUniqueFilename";
    readonly FS_GET_APP_PATHS: "fs:getAppPaths";
    readonly FS_INITIALIZE_DIRECTORIES: "fs:initializeDirectories";
    readonly FS_CLEANUP_TEMP_FILES: "fs:cleanupTempFiles";
    readonly FS_SELECT_DIRECTORY: "fs:selectDirectory";
    readonly SETTINGS_GET: "settings:get";
    readonly SETTINGS_SET: "settings:set";
    readonly SETTINGS_GET_ALL: "settings:getAll";
    readonly SETTINGS_RESET: "settings:reset";
    readonly SETTINGS_HAS_CUSTOM_VALUE: "settings:hasCustomValue";
    readonly SETTINGS_GET_STORE_PATH: "settings:getStorePath";
    readonly SETTINGS_VALIDATE: "settings:validate";
    readonly SETTINGS_EXPORT: "settings:export";
    readonly SETTINGS_IMPORT: "settings:import";
    readonly SETTINGS_INITIALIZE_DOWNLOAD_LOCATION: "settings:initializeDownloadLocation";
    readonly DEPENDENCY_CHECK_STATUS: "dependency:checkStatus";
    readonly DEPENDENCY_GET_STATUS: "dependency:getStatus";
    readonly DEPENDENCY_INSTALL: "dependency:install";
    readonly DEPENDENCY_VALIDATE: "dependency:validate";
    readonly DEPENDENCY_GET_VERSION: "dependency:getVersion";
    readonly DEPENDENCY_GET_PATH: "dependency:getPath";
    readonly DEPENDENCY_CLEANUP: "dependency:cleanup";
    readonly DEPENDENCY_ARE_ALL_READY: "dependency:areAllReady";
    readonly DEPENDENCY_IS_INITIALIZED: "dependency:isInitialized";
    readonly DEPENDENCY_STATUS_UPDATED: "dependency:statusUpdated";
    readonly DEPENDENCY_DOWNLOAD_PROGRESS: "dependency:downloadProgress";
    readonly DEPENDENCY_INSTALL_STARTED: "dependency:installStarted";
    readonly DEPENDENCY_INSTALL_COMPLETED: "dependency:installCompleted";
    readonly DEPENDENCY_INSTALL_FAILED: "dependency:installFailed";
    readonly GET_PLAYLIST_METADATA: "playlist:getMetadata";
    readonly START_IMPORT: "import:start";
    readonly TASK_UPDATE: "task:update";
    readonly GET_PLAYLIST_DETAILS: "getPlaylistDetails";
    readonly GET_PLAYLISTS: "getPlaylists";
};
export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
    data?: any;
}
export interface LoggerConfig {
    level: LogLevel;
    file: {
        enabled: boolean;
        path: string;
        maxSize: number;
        maxFiles: number;
    };
    console: {
        enabled: boolean;
        colorize: boolean;
    };
    development: {
        enhanced: boolean;
        stackTrace: boolean;
    };
}
//# sourceMappingURL=types.d.ts.map