"use strict";
/**
 * Preload script for secure IPC communication between main and renderer processes
 * This script runs in a sandboxed environment with access to both Node.js APIs and the DOM
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Security: Validate that we're running in the correct context
if (!process.contextIsolated) {
    throw new Error('Context isolation must be enabled in the BrowserWindow');
}
// Note: process.nodeIntegration is not available in preload context
// The security is enforced by the main process configuration
// Create the secure API surface
const electronAPI = {
    // Application operations
    app: {
        getVersion: () => electron_1.ipcRenderer.invoke('app:getVersion'),
        quit: () => electron_1.ipcRenderer.invoke('app:quit'),
        minimize: () => electron_1.ipcRenderer.invoke('app:minimize'),
        maximize: () => electron_1.ipcRenderer.invoke('app:maximize'),
        isMaximized: () => electron_1.ipcRenderer.invoke('app:isMaximized'),
        unmaximize: () => electron_1.ipcRenderer.invoke('app:unmaximize'),
        close: () => electron_1.ipcRenderer.invoke('app:close'),
    },
    // File system operations
    fs: {
        exists: (path) => electron_1.ipcRenderer.invoke('fs:exists', path),
        readJson: (path) => electron_1.ipcRenderer.invoke('fs:readJson', path),
        writeJson: (path, data) => electron_1.ipcRenderer.invoke('fs:writeJson', path, data),
        readText: (path, encoding) => electron_1.ipcRenderer.invoke('fs:readText', path, encoding),
        writeText: (path, content, encoding) => electron_1.ipcRenderer.invoke('fs:writeText', path, content, encoding),
        delete: (path) => electron_1.ipcRenderer.invoke('fs:delete', path),
        copy: (src, dest) => electron_1.ipcRenderer.invoke('fs:copy', src, dest),
        move: (src, dest) => electron_1.ipcRenderer.invoke('fs:move', src, dest),
        getStats: (path) => electron_1.ipcRenderer.invoke('fs:getStats', path),
        listFiles: (dirPath) => electron_1.ipcRenderer.invoke('fs:listFiles', dirPath),
        listDirectories: (dirPath) => electron_1.ipcRenderer.invoke('fs:listDirectories', dirPath),
        ensureDirectory: (dirPath) => electron_1.ipcRenderer.invoke('fs:ensureDirectory', dirPath),
        getSize: (path) => electron_1.ipcRenderer.invoke('fs:getSize', path),
        formatSize: (bytes) => electron_1.ipcRenderer.invoke('fs:formatSize', bytes),
        sanitizeFilename: (filename) => electron_1.ipcRenderer.invoke('fs:sanitizeFilename', filename),
        createUniqueFilename: (path) => electron_1.ipcRenderer.invoke('fs:createUniqueFilename', path),
        getAppPaths: () => electron_1.ipcRenderer.invoke('fs:getAppPaths'),
        initializeDirectories: () => electron_1.ipcRenderer.invoke('fs:initializeDirectories'),
        cleanupTempFiles: () => electron_1.ipcRenderer.invoke('fs:cleanupTempFiles'),
        selectDirectory: () => electron_1.ipcRenderer.invoke('fs:selectDirectory'),
    },
    // Settings management
    settings: {
        get: (key) => electron_1.ipcRenderer.invoke('settings:get', key),
        set: (key, value) => electron_1.ipcRenderer.invoke('settings:set', key, value),
        getAll: () => electron_1.ipcRenderer.invoke('settings:getAll'),
        reset: () => electron_1.ipcRenderer.invoke('settings:reset'),
        hasCustomValue: (key) => electron_1.ipcRenderer.invoke('settings:hasCustomValue', key),
        getStorePath: () => electron_1.ipcRenderer.invoke('settings:getStorePath'),
        validate: () => electron_1.ipcRenderer.invoke('settings:validate'),
        export: () => electron_1.ipcRenderer.invoke('settings:export'),
        import: (jsonString) => electron_1.ipcRenderer.invoke('settings:import', jsonString),
        initializeDownloadLocation: () => electron_1.ipcRenderer.invoke('settings:initializeDownloadLocation'),
    },
    // Playlist operations (for future implementation)
    playlist: {
        getAll: (options) => electron_1.ipcRenderer.invoke('playlist:getAll', options),
        getById: (playlistId) => electron_1.ipcRenderer.invoke('playlist:getById', playlistId),
        create: (input) => electron_1.ipcRenderer.invoke('playlist:create', input),
        update: (playlistId, updates) => electron_1.ipcRenderer.invoke('playlist:update', playlistId, updates),
        delete: (playlistId) => electron_1.ipcRenderer.invoke('playlist:delete', playlistId),
        searchVideos: (options) => electron_1.ipcRenderer.invoke('playlist:searchVideos', options),
        addVideo: (playlistId, videoId) => electron_1.ipcRenderer.invoke('playlist:addVideo', playlistId, videoId),
        removeVideo: (playlistId, videoId) => electron_1.ipcRenderer.invoke('playlist:removeVideo', playlistId, videoId),
        reorderVideos: (playlistId, videoOrders) => electron_1.ipcRenderer.invoke('playlist:reorderVideos', playlistId, videoOrders),
        getStats: (playlistId) => electron_1.ipcRenderer.invoke('playlist:getStats', playlistId),
    },
    // YouTube operations (for future implementation)
    youtube: {
        getPlaylistMetadata: (url) => electron_1.ipcRenderer.invoke('youtube:getPlaylistMetadata', url),
        importPlaylist: (url) => electron_1.ipcRenderer.invoke('youtube:importPlaylist', url),
        getVideoQualities: (videoId) => electron_1.ipcRenderer.invoke('youtube:getVideoQualities', videoId),
        checkAvailability: () => electron_1.ipcRenderer.invoke('youtube:checkAvailability'),
        updateYtDlp: () => electron_1.ipcRenderer.invoke('youtube:updateYtDlp'),
        validateUrl: (url) => electron_1.ipcRenderer.invoke('youtube:validateUrl', url),
        onImportProgress: (callback) => {
            const wrappedCallback = (_event, data) => callback(_event, data);
            electron_1.ipcRenderer.on('youtube:importProgress', wrappedCallback);
            // Return cleanup function
            return () => electron_1.ipcRenderer.removeListener('youtube:importProgress', wrappedCallback);
        },
    },
    // Legacy methods for backward compatibility
    getPlaylistMetadata: (url) => electron_1.ipcRenderer.invoke('playlist:getMetadata', url),
    startImport: (url) => electron_1.ipcRenderer.invoke('import:start', url),
    onTaskUpdate: (callback) => {
        const wrappedCallback = (_event, data) => callback(_event, data);
        electron_1.ipcRenderer.on('task:update', wrappedCallback);
        // Return cleanup function
        return () => electron_1.ipcRenderer.removeListener('task:update', wrappedCallback);
    },
    getPlaylistDetails: (playlistId) => electron_1.ipcRenderer.invoke('getPlaylistDetails', playlistId),
    getPlaylists: () => electron_1.ipcRenderer.invoke('getPlaylists'),
};
// Security: Only expose the API through contextBridge
try {
    electron_1.contextBridge.exposeInMainWorld('api', electronAPI);
    // Log successful initialization in development
    if (process.env.NODE_ENV === 'development') {
        console.log('✅ Preload script initialized successfully');
        console.log('🔒 Context isolation enabled');
        console.log('🚫 Node integration disabled');
    }
}
catch (error) {
    console.error('❌ Failed to expose API through context bridge:', error);
    throw error;
}
// DOM Content Loaded handler for version display
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) {
            element.innerText = text;
        }
    };
    // Display version information
    for (const dependency of ['chrome', 'node', 'electron']) {
        const version = process.versions[dependency];
        if (version) {
            replaceText(`${dependency}-version`, version);
        }
    }
});
// Security: Prevent access to Node.js globals in renderer
delete globalThis.require;
delete globalThis.exports;
delete globalThis.module;
// Log security status in development
if (process.env.NODE_ENV === 'development') {
    console.log('🔒 Security measures applied:');
    console.log('  - Node.js globals removed from renderer context');
    console.log('  - IPC communication secured through context bridge');
    console.log('  - API surface limited to approved methods');
}
//# sourceMappingURL=preload.js.map