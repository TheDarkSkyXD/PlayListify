import { contextBridge, ipcRenderer } from 'electron';
import type { Api, AppSettings } from './shared/types/appTypes';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // General message passing
    send: (channel: string, data: any) => {
      // whitelist channels
      const validChannels = ['toMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel: string, func: Function) => {
      const validChannels = ['fromMain', 'download-progress', 'playlist-download-progress'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args);
    },
    on: (channel: string, func: Function) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    off: (channel: string, func: Function) => {
      ipcRenderer.removeListener(channel, func as any);
    },

    // Settings API
    settings: {
      get: <K extends keyof AppSettings>(key: K) => 
        ipcRenderer.invoke('settings:get', key),
      set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => 
        ipcRenderer.invoke('settings:set', key, value),
      getAll: () => 
        ipcRenderer.invoke('settings:getAll'),
      reset: <K extends keyof AppSettings>(key: K) => 
        ipcRenderer.invoke('settings:reset', key),
      resetAll: () => 
        ipcRenderer.invoke('settings:resetAll')
    },

    // File system API
    fs: {
      selectDirectory: () => 
        ipcRenderer.invoke('fs:selectDirectory'),
      createPlaylistDir: (playlistId: string, playlistName: string) => 
        ipcRenderer.invoke('fs:createPlaylistDir', playlistId, playlistName),
      writePlaylistMetadata: (playlistId: string, playlistName: string, metadata: any) => 
        ipcRenderer.invoke('fs:writePlaylistMetadata', playlistId, playlistName, metadata),
      readPlaylistMetadata: (playlistId: string, playlistName: string) => 
        ipcRenderer.invoke('fs:readPlaylistMetadata', playlistId, playlistName),
      getAllPlaylists: () => 
        ipcRenderer.invoke('fs:getAllPlaylists'),
      deletePlaylist: (playlistId: string, playlistName: string) => 
        ipcRenderer.invoke('fs:deletePlaylist', playlistId, playlistName),
      videoExists: (playlistId: string, playlistName: string, videoId: string, format: string) => 
        ipcRenderer.invoke('fs:videoExists', playlistId, playlistName, videoId, format),
      getFileSize: (filePath: string) => 
        ipcRenderer.invoke('fs:getFileSize', filePath),
      getFreeDiskSpace: () => 
        ipcRenderer.invoke('fs:getFreeDiskSpace'),
      validatePath: (dirPath: string) => 
        ipcRenderer.invoke('fs:validatePath', dirPath)
    },
    
    // Image utilities
    images: {
      cacheImage: (url: string) => 
        ipcRenderer.invoke('image:cache', url),
      getLocalPath: (url: string, downloadIfMissing = true) => 
        ipcRenderer.invoke('image:getLocalPath', url, downloadIfMissing),
      clearCache: (maxAgeDays = 30) => 
        ipcRenderer.invoke('image:clearCache', maxAgeDays)
    },
    
    // YouTube API
    youtube: {
      getPlaylistInfo: (playlistUrl: string) => 
        ipcRenderer.invoke('yt:getPlaylistInfo', playlistUrl),
      getPlaylistVideos: (playlistUrl: string) => 
        ipcRenderer.invoke('yt:getPlaylistVideos', playlistUrl),
      importPlaylist: (playlistUrl: string) => 
        ipcRenderer.invoke('yt:importPlaylist', playlistUrl),
      checkVideoStatus: (videoUrl: string) => 
        ipcRenderer.invoke('yt:checkVideoStatus', videoUrl),
      downloadVideo: (videoUrl: string, outputDir: string, videoId: string, options?: any) => 
        ipcRenderer.invoke('yt:downloadVideo', videoUrl, outputDir, videoId, options)
    },
    
    // Playlist management API
    playlists: {
      create: (name: string, description?: string) => 
        ipcRenderer.invoke('playlist:create', name, description),
      getAll: () => 
        ipcRenderer.invoke('playlist:getAll'),
      getById: (playlistId: string) => 
        ipcRenderer.invoke('playlist:getById', playlistId),
      delete: (playlistId: string) => 
        ipcRenderer.invoke('playlist:delete', playlistId),
      update: (playlistId: string, updates: any) => 
        ipcRenderer.invoke('playlist:update', playlistId, updates),
      addVideo: (playlistId: string, videoUrl: string) => 
        ipcRenderer.invoke('playlist:addVideo', playlistId, videoUrl),
      removeVideo: (playlistId: string, videoId: string) => 
        ipcRenderer.invoke('playlist:removeVideo', playlistId, videoId),
      downloadVideo: (playlistId: string, videoId: string, options?: any) => 
        ipcRenderer.invoke('playlist:downloadVideo', playlistId, videoId, options),
      refresh: (playlistId: string) => 
        ipcRenderer.invoke('playlist:refresh', playlistId)
    }
  } as Api
); 