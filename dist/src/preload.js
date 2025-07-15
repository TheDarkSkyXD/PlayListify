"use strict";
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api = {
    getPlaylistMetadata: (url) => electron_1.ipcRenderer.invoke('playlist:getMetadata', url),
    startImport: (url) => electron_1.ipcRenderer.invoke('import:start', url),
    onTaskUpdate: (callback) => electron_1.ipcRenderer.on('task:update', callback),
    getPlaylistDetails: (playlistId) => electron_1.ipcRenderer.invoke('getPlaylistDetails', playlistId),
    getPlaylists: () => electron_1.ipcRenderer.invoke('getPlaylists'),
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
    file: {
        exists: (path) => electron_1.ipcRenderer.invoke('file:exists', path),
        readJson: (path) => electron_1.ipcRenderer.invoke('file:readJson', path),
        writeJson: (path, data) => electron_1.ipcRenderer.invoke('file:writeJson', path, data),
        readText: (path, encoding) => electron_1.ipcRenderer.invoke('file:readText', path, encoding),
        writeText: (path, content, encoding) => electron_1.ipcRenderer.invoke('file:writeText', path, content, encoding),
        delete: (path) => electron_1.ipcRenderer.invoke('file:delete', path),
        copy: (src, dest) => electron_1.ipcRenderer.invoke('file:copy', src, dest),
        move: (src, dest) => electron_1.ipcRenderer.invoke('file:move', src, dest),
        getStats: (path) => electron_1.ipcRenderer.invoke('file:getStats', path),
        listFiles: (dirPath) => electron_1.ipcRenderer.invoke('file:listFiles', dirPath),
        listDirectories: (dirPath) => electron_1.ipcRenderer.invoke('file:listDirectories', dirPath),
        ensureDirectory: (dirPath) => electron_1.ipcRenderer.invoke('file:ensureDirectory', dirPath),
        getSize: (path) => electron_1.ipcRenderer.invoke('file:getSize', path),
        formatSize: (bytes) => electron_1.ipcRenderer.invoke('file:formatSize', bytes),
        sanitizeFilename: (filename) => electron_1.ipcRenderer.invoke('file:sanitizeFilename', filename),
        createUniqueFilename: (path) => electron_1.ipcRenderer.invoke('file:createUniqueFilename', path),
        getAppPaths: () => electron_1.ipcRenderer.invoke('file:getAppPaths'),
        initializeDirectories: () => electron_1.ipcRenderer.invoke('file:initializeDirectories'),
        cleanupTempFiles: () => electron_1.ipcRenderer.invoke('file:cleanupTempFiles'),
    },
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
    youtube: {
        getPlaylistMetadata: (url) => electron_1.ipcRenderer.invoke('youtube:getPlaylistMetadata', url),
        importPlaylist: (url) => electron_1.ipcRenderer.invoke('youtube:importPlaylist', url),
        getVideoQualities: (videoId) => electron_1.ipcRenderer.invoke('youtube:getVideoQualities', videoId),
        checkAvailability: () => electron_1.ipcRenderer.invoke('youtube:checkAvailability'),
        updateYtDlp: () => electron_1.ipcRenderer.invoke('youtube:updateYtDlp'),
        validateUrl: (url) => electron_1.ipcRenderer.invoke('youtube:validateUrl', url),
        onImportProgress: (callback) => electron_1.ipcRenderer.on('youtube:importProgress', callback),
    },
};
electron_1.contextBridge.exposeInMainWorld('api', api);
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element)
            element.innerText = text;
    };
    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
});
//# sourceMappingURL=preload.js.map