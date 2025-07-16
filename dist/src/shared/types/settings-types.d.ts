/**
 * TypeScript interfaces for Settings and File System Services
 *
 * This file defines all the types used for persistent storage,
 * settings management, and file system operations.
 */
export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    language: string;
    downloadLocation: string;
    tempDirectory: string;
    startMinimized: boolean;
    closeToTray: boolean;
    autoUpdate: boolean;
    videoQuality: 'best' | 'worst' | '720p' | '1080p';
    maxConcurrentDownloads: number;
    windowSize: {
        width: number;
        height: number;
    };
    windowPosition: {
        x: number;
        y: number;
    };
    notificationsEnabled: boolean;
    debugMode?: boolean;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
}
export interface SettingsValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface SettingsExportData {
    version: string;
    exportDate: Date;
    settings: Partial<UserSettings>;
}
export interface FileSystemStats {
    size: number;
    isFile: boolean;
    isDirectory: boolean;
    createdAt: Date;
    modifiedAt: Date;
    accessedAt: Date;
}
export interface DirectoryStructure {
    path: string;
    exists: boolean;
    files: string[];
    directories: string[];
    totalItems: number;
}
export interface FileOperationResult {
    success: boolean;
    path: string;
    error?: string;
    size?: number;
}
export interface PathValidationResult {
    isValid: boolean;
    isSecure: boolean;
    sanitizedPath: string;
    errors: string[];
}
export interface AppDirectories {
    userData: string;
    downloads: string;
    temp: string;
    logs: string;
    cache: string;
    dependencies: string;
    config: string;
}
export interface ISettingsService {
    get<K extends keyof UserSettings>(key: K): UserSettings[K];
    set<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void;
    getAll(): UserSettings;
    reset(): void;
    has(key: keyof UserSettings): boolean;
    delete(key: keyof UserSettings): void;
    validate(): SettingsValidationResult;
    sanitize(): void;
    export(): SettingsExportData;
    import(data: SettingsExportData): boolean;
    getStorePath(): string;
    initializeDefaults(): Promise<void>;
}
export interface IFileSystemService {
    exists(path: string): Promise<boolean>;
    readFile(path: string, encoding?: BufferEncoding): Promise<string | Buffer>;
    writeFile(path: string, content: string | Buffer, encoding?: BufferEncoding): Promise<void>;
    deleteFile(path: string): Promise<void>;
    copyFile(source: string, destination: string): Promise<void>;
    moveFile(source: string, destination: string): Promise<void>;
    ensureDirectory(path: string): Promise<void>;
    listDirectory(path: string): Promise<DirectoryStructure>;
    deleteDirectory(path: string): Promise<void>;
    readJson<T = any>(path: string): Promise<T>;
    writeJson(path: string, data: any): Promise<void>;
    validatePath(path: string, basePath?: string): PathValidationResult;
    sanitizePath(path: string): string;
    resolvePath(...paths: string[]): string;
    getStats(path: string): Promise<FileSystemStats>;
    getSize(path: string): Promise<number>;
    getAppDirectories(): AppDirectories;
    initializeAppDirectories(): Promise<void>;
    cleanupTempFiles(): Promise<void>;
    cleanupOldLogs(maxAge: number): Promise<void>;
}
export declare class SettingsError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export declare class FileSystemError extends Error {
    code: string;
    path?: string | undefined;
    details?: any | undefined;
    constructor(message: string, code: string, path?: string | undefined, details?: any | undefined);
}
export declare const DEFAULT_USER_SETTINGS: UserSettings;
export declare const SETTINGS_SCHEMA: {
    readonly theme: {
        readonly type: "string";
        readonly enum: readonly ["light", "dark", "system"];
        readonly default: "light";
    };
    readonly language: {
        readonly type: "string";
        readonly default: "en";
    };
    readonly downloadLocation: {
        readonly type: "string";
        readonly default: "";
    };
    readonly tempDirectory: {
        readonly type: "string";
        readonly default: "";
    };
    readonly startMinimized: {
        readonly type: "boolean";
        readonly default: false;
    };
    readonly closeToTray: {
        readonly type: "boolean";
        readonly default: false;
    };
    readonly autoUpdate: {
        readonly type: "boolean";
        readonly default: true;
    };
    readonly videoQuality: {
        readonly type: "string";
        readonly enum: readonly ["best", "worst", "720p", "1080p"];
        readonly default: "best";
    };
    readonly maxConcurrentDownloads: {
        readonly type: "number";
        readonly minimum: 1;
        readonly maximum: 10;
        readonly default: 3;
    };
    readonly windowSize: {
        readonly type: "object";
        readonly properties: {
            readonly width: {
                readonly type: "number";
                readonly minimum: 800;
                readonly default: 1200;
            };
            readonly height: {
                readonly type: "number";
                readonly minimum: 600;
                readonly default: 800;
            };
        };
        readonly default: {
            readonly width: 1200;
            readonly height: 800;
        };
    };
    readonly windowPosition: {
        readonly type: "object";
        readonly properties: {
            readonly x: {
                readonly type: "number";
                readonly default: 100;
            };
            readonly y: {
                readonly type: "number";
                readonly default: 100;
            };
        };
        readonly default: {
            readonly x: 100;
            readonly y: 100;
        };
    };
    readonly notificationsEnabled: {
        readonly type: "boolean";
        readonly default: true;
    };
};
//# sourceMappingURL=settings-types.d.ts.map