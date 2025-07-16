"use strict";
/**
 * Secure preload script for IPC communication between main and renderer processes
 * This script creates a controlled API surface with proper security measures and error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Security validation: Ensure proper context isolation
if (!process.contextIsolated) {
    throw new Error('❌ Context isolation must be enabled for security');
}
// Security validation: Ensure node integration is disabled
if (process.env.NODE_ENV !== 'test' && globalThis.require) {
    throw new Error('❌ Node integration must be disabled for security');
}
/**
 * Create a secure wrapper for IPC invoke calls with error handling
 */
function createSecureInvoke(channel) {
    return async (...args) => {
        try {
            const response = await electron_1.ipcRenderer.invoke(channel, ...args);
            // Handle standardized IPC responses
            if (response && typeof response === 'object' && 'success' in response) {
                if (response.success) {
                    return response.data;
                }
                else {
                    throw new Error(response.error || 'Unknown IPC error');
                }
            }
            // Handle legacy responses
            return response;
        }
        catch (error) {
            console.error(`IPC Error on channel ${channel}:`, error);
            throw error;
        }
    };
}
/**
 * Create a secure wrapper for IPC event listeners with cleanup
 */
function createSecureListener(channel) {
    return (callback) => {
        const wrappedCallback = (event, ...args) => {
            try {
                callback(event, ...args);
            }
            catch (error) {
                console.error(`Error in IPC listener for ${channel}:`, error);
            }
        };
        electron_1.ipcRenderer.on(channel, wrappedCallback);
        // Return cleanup function
        return () => {
            electron_1.ipcRenderer.removeListener(channel, wrappedCallback);
        };
    };
}
// Create the secure API surface with proper error handling
const electronAPI = {
    // Application operations
    app: {
        getVersion: createSecureInvoke('app:getVersion'),
        quit: createSecureInvoke('app:quit'),
        minimize: createSecureInvoke('app:minimize'),
        maximize: createSecureInvoke('app:maximize'),
        isMaximized: createSecureInvoke('app:isMaximized'),
        unmaximize: createSecureInvoke('app:unmaximize'),
        close: createSecureInvoke('app:close'),
        showErrorDialog: createSecureInvoke('app:showErrorDialog'),
        showMessageDialog: createSecureInvoke('app:showMessageDialog'),
        selectDirectory: createSecureInvoke('app:selectDirectory'),
        selectFile: createSecureInvoke('app:selectFile'),
        saveFile: createSecureInvoke('app:saveFile'),
    },
    // File system operations
    fs: {
        exists: createSecureInvoke('fs:exists'),
        readJson: createSecureInvoke('fs:readJson'),
        writeJson: createSecureInvoke('fs:writeJson'),
        readText: createSecureInvoke('fs:readText'),
        writeText: createSecureInvoke('fs:writeText'),
        delete: createSecureInvoke('fs:delete'),
        copy: createSecureInvoke('fs:copy'),
        move: createSecureInvoke('fs:move'),
        getStats: createSecureInvoke('fs:getStats'),
        listFiles: createSecureInvoke('fs:listFiles'),
        listDirectories: createSecureInvoke('fs:listDirectories'),
        ensureDirectory: createSecureInvoke('fs:ensureDirectory'),
        getSize: createSecureInvoke('fs:getSize'),
        formatSize: createSecureInvoke('fs:formatSize'),
        sanitizeFilename: createSecureInvoke('fs:sanitizeFilename'),
        createUniqueFilename: createSecureInvoke('fs:createUniqueFilename'),
        getAppPaths: createSecureInvoke('fs:getAppPaths'),
        initializeDirectories: createSecureInvoke('fs:initializeDirectories'),
        cleanupTempFiles: createSecureInvoke('fs:cleanupTempFiles'),
        selectDirectory: createSecureInvoke('fs:selectDirectory'),
    },
    // Settings management
    settings: {
        get: (key) => createSecureInvoke('settings:get')(key),
        set: (key, value) => createSecureInvoke('settings:set')(key, value),
        getAll: createSecureInvoke('settings:getAll'),
        reset: createSecureInvoke('settings:reset'),
        hasCustomValue: createSecureInvoke('settings:hasCustomValue'),
        getStorePath: createSecureInvoke('settings:getStorePath'),
        validate: createSecureInvoke('settings:validate'),
        export: createSecureInvoke('settings:export'),
        import: createSecureInvoke('settings:import'),
        initializeDownloadLocation: createSecureInvoke('settings:initializeDownloadLocation'),
    },
    // Playlist operations (placeholder implementations for future tasks)
    playlist: {
        getAll: createSecureInvoke('playlist:getAll'),
        getById: createSecureInvoke('playlist:getById'),
        create: createSecureInvoke('playlist:create'),
        update: createSecureInvoke('playlist:update'),
        delete: createSecureInvoke('playlist:delete'),
        searchVideos: createSecureInvoke('playlist:searchVideos'),
        addVideo: createSecureInvoke('playlist:addVideo'),
        removeVideo: createSecureInvoke('playlist:removeVideo'),
        reorderVideos: createSecureInvoke('playlist:reorderVideos'),
        getStats: createSecureInvoke('playlist:getStats'),
    },
    // YouTube operations (placeholder implementations for future tasks)
    youtube: {
        getPlaylistMetadata: createSecureInvoke('youtube:getPlaylistMetadata'),
        importPlaylist: createSecureInvoke('youtube:importPlaylist'),
        getVideoQualities: createSecureInvoke('youtube:getVideoQualities'),
        checkAvailability: createSecureInvoke('youtube:checkAvailability'),
        updateYtDlp: createSecureInvoke('youtube:updateYtDlp'),
        validateUrl: createSecureInvoke('youtube:validateUrl'),
        onImportProgress: createSecureListener('youtube:importProgress'),
    },
    // Dependency management
    dependency: {
        checkStatus: createSecureInvoke('dependency:checkStatus'),
        getStatus: createSecureInvoke('dependency:getStatus'),
        install: createSecureInvoke('dependency:install'),
        validate: createSecureInvoke('dependency:validate'),
        getVersion: createSecureInvoke('dependency:getVersion'),
        getPath: createSecureInvoke('dependency:getPath'),
        cleanup: createSecureInvoke('dependency:cleanup'),
        areAllReady: createSecureInvoke('dependency:areAllReady'),
        isInitialized: createSecureInvoke('dependency:isInitialized'),
        onStatusUpdated: createSecureListener('dependency:statusUpdated'),
        onDownloadProgress: createSecureListener('dependency:downloadProgress'),
        onInstallStarted: createSecureListener('dependency:installStarted'),
        onInstallCompleted: createSecureListener('dependency:installCompleted'),
        onInstallFailed: createSecureListener('dependency:installFailed'),
    },
    // Legacy methods for backward compatibility
    getPlaylistMetadata: createSecureInvoke('playlist:getMetadata'),
    startImport: createSecureInvoke('import:start'),
    onTaskUpdate: createSecureListener('task:update'),
    getPlaylistDetails: createSecureInvoke('getPlaylistDetails'),
    getPlaylists: createSecureInvoke('getPlaylists'),
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