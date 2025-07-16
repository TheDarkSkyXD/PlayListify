"use strict";
/**
 * Shared TypeScript interfaces for secure IPC communication between main and renderer processes
 * This file defines the complete API surface exposed through the preload script with proper error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = void 0;
// IPC channel names (for type safety)
exports.IPC_CHANNELS = {
    // App channels
    APP_GET_VERSION: 'app:getVersion',
    APP_QUIT: 'app:quit',
    APP_MINIMIZE: 'app:minimize',
    APP_MAXIMIZE: 'app:maximize',
    APP_IS_MAXIMIZED: 'app:isMaximized',
    APP_UNMAXIMIZE: 'app:unmaximize',
    APP_CLOSE: 'app:close',
    // File system channels
    FS_EXISTS: 'fs:exists',
    FS_READ_JSON: 'fs:readJson',
    FS_WRITE_JSON: 'fs:writeJson',
    FS_READ_TEXT: 'fs:readText',
    FS_WRITE_TEXT: 'fs:writeText',
    FS_DELETE: 'fs:delete',
    FS_COPY: 'fs:copy',
    FS_MOVE: 'fs:move',
    FS_GET_STATS: 'fs:getStats',
    FS_LIST_FILES: 'fs:listFiles',
    FS_LIST_DIRECTORIES: 'fs:listDirectories',
    FS_ENSURE_DIRECTORY: 'fs:ensureDirectory',
    FS_GET_SIZE: 'fs:getSize',
    FS_FORMAT_SIZE: 'fs:formatSize',
    FS_SANITIZE_FILENAME: 'fs:sanitizeFilename',
    FS_CREATE_UNIQUE_FILENAME: 'fs:createUniqueFilename',
    FS_GET_APP_PATHS: 'fs:getAppPaths',
    FS_INITIALIZE_DIRECTORIES: 'fs:initializeDirectories',
    FS_CLEANUP_TEMP_FILES: 'fs:cleanupTempFiles',
    FS_SELECT_DIRECTORY: 'fs:selectDirectory',
    // Settings channels
    SETTINGS_GET: 'settings:get',
    SETTINGS_SET: 'settings:set',
    SETTINGS_GET_ALL: 'settings:getAll',
    SETTINGS_RESET: 'settings:reset',
    SETTINGS_HAS_CUSTOM_VALUE: 'settings:hasCustomValue',
    SETTINGS_GET_STORE_PATH: 'settings:getStorePath',
    SETTINGS_VALIDATE: 'settings:validate',
    SETTINGS_EXPORT: 'settings:export',
    SETTINGS_IMPORT: 'settings:import',
    SETTINGS_INITIALIZE_DOWNLOAD_LOCATION: 'settings:initializeDownloadLocation',
    // Dependency channels
    DEPENDENCY_CHECK_STATUS: 'dependency:checkStatus',
    DEPENDENCY_GET_STATUS: 'dependency:getStatus',
    DEPENDENCY_INSTALL: 'dependency:install',
    DEPENDENCY_VALIDATE: 'dependency:validate',
    DEPENDENCY_GET_VERSION: 'dependency:getVersion',
    DEPENDENCY_GET_PATH: 'dependency:getPath',
    DEPENDENCY_CLEANUP: 'dependency:cleanup',
    DEPENDENCY_ARE_ALL_READY: 'dependency:areAllReady',
    DEPENDENCY_IS_INITIALIZED: 'dependency:isInitialized',
    DEPENDENCY_STATUS_UPDATED: 'dependency:statusUpdated',
    DEPENDENCY_DOWNLOAD_PROGRESS: 'dependency:downloadProgress',
    DEPENDENCY_INSTALL_STARTED: 'dependency:installStarted',
    DEPENDENCY_INSTALL_COMPLETED: 'dependency:installCompleted',
    DEPENDENCY_INSTALL_FAILED: 'dependency:installFailed',
    // Legacy channels (for backward compatibility)
    GET_PLAYLIST_METADATA: 'playlist:getMetadata',
    START_IMPORT: 'import:start',
    TASK_UPDATE: 'task:update',
    GET_PLAYLIST_DETAILS: 'getPlaylistDetails',
    GET_PLAYLISTS: 'getPlaylists',
};
//# sourceMappingURL=types.js.map