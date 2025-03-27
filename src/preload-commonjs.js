const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // General message passing
    send: (channel, data) => {
      // whitelist channels
      const validChannels = ['toMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      const validChannels = ['fromMain', 'download-progress', 'playlist-download-progress'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    invoke: (channel, ...args) => {
      return ipcRenderer.invoke(channel, ...args);
    },
    on: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    off: (channel, func) => {
      ipcRenderer.removeListener(channel, func);
    },

    // Settings API
    settings: {
      get: (key) => 
        ipcRenderer.invoke('settings:get', key),
      set: (key, value) => 
        ipcRenderer.invoke('settings:set', key, value),
      getAll: () => 
        ipcRenderer.invoke('settings:getAll'),
      reset: (key) => 
        ipcRenderer.invoke('settings:reset', key),
      resetAll: () => 
        ipcRenderer.invoke('settings:resetAll')
    },

    // File system API
    fs: {
      selectDirectory: () => 
        ipcRenderer.invoke('fs:selectDirectory'),
      createPlaylistDir: (playlistId, playlistName) => 
        ipcRenderer.invoke('fs:createPlaylistDir', playlistId, playlistName),
      writePlaylistMetadata: (playlistId, playlistName, metadata) => 
        ipcRenderer.invoke('fs:writePlaylistMetadata', playlistId, playlistName, metadata),
      readPlaylistMetadata: (playlistId, playlistName) => 
        ipcRenderer.invoke('fs:readPlaylistMetadata', playlistId, playlistName),
      getAllPlaylists: () => 
        ipcRenderer.invoke('fs:getAllPlaylists'),
      deletePlaylist: (playlistId, playlistName) => 
        ipcRenderer.invoke('fs:deletePlaylist', playlistId, playlistName),
      videoExists: (playlistId, playlistName, videoId, format) => 
        ipcRenderer.invoke('fs:videoExists', playlistId, playlistName, videoId, format),
      getFileSize: (filePath) => 
        ipcRenderer.invoke('fs:getFileSize', filePath),
      getFreeDiskSpace: () => 
        ipcRenderer.invoke('fs:getFreeDiskSpace'),
      validatePath: (dirPath) => 
        ipcRenderer.invoke('fs:validatePath', dirPath)
    },
    
    // Image utilities
    images: {
      cacheImage: (url) => 
        ipcRenderer.invoke('image:cache', url),
      getLocalPath: (url, downloadIfMissing = true) => 
        ipcRenderer.invoke('image:getLocalPath', url, downloadIfMissing),
      clearCache: (maxAgeDays = 30) => 
        ipcRenderer.invoke('image:clearCache', maxAgeDays)
    },
    
    // YouTube API
    youtube: {
      getPlaylistInfo: (playlistUrl) => 
        ipcRenderer.invoke('yt:getPlaylistInfo', playlistUrl),
      getPlaylistVideos: (playlistUrl) => 
        ipcRenderer.invoke('yt:getPlaylistVideos', playlistUrl),
      importPlaylist: (playlistUrl) => 
        ipcRenderer.invoke('yt:importPlaylist', playlistUrl),
      checkVideoStatus: (videoUrl) => 
        ipcRenderer.invoke('yt:checkVideoStatus', videoUrl),
      downloadVideo: (videoUrl, outputDir, videoId, options) => 
        ipcRenderer.invoke('yt:downloadVideo', videoUrl, outputDir, videoId, options)
    },
    
    // Playlist management API
    playlists: {
      create: (name, description) => 
        ipcRenderer.invoke('playlist:create', name, description),
      getAll: () => 
        ipcRenderer.invoke('playlist:getAll'),
      getById: (playlistId) => 
        ipcRenderer.invoke('playlist:getById', playlistId),
      delete: (playlistId) => 
        ipcRenderer.invoke('playlist:delete', playlistId),
      update: (playlistId, updates) => 
        ipcRenderer.invoke('playlist:update', playlistId, updates),
      addVideo: (playlistId, videoUrl) => 
        ipcRenderer.invoke('playlist:addVideo', playlistId, videoUrl),
      removeVideo: (playlistId, videoId) => 
        ipcRenderer.invoke('playlist:removeVideo', playlistId, videoId),
      downloadVideo: (playlistId, videoId, options) => 
        ipcRenderer.invoke('playlist:downloadVideo', playlistId, videoId, options),
      refresh: (playlistId) => 
        ipcRenderer.invoke('playlist:refresh', playlistId)
    }
  }
); 