import { contextBridge, ipcRenderer } from 'electron';

// Define valid channels for security
const validSendChannels: string[] = ['toMain'];
const validReceiveChannels: string[] = ['fromMain', 'download-progress-'];
const validInvokeChannels: string[] = [
  // Playlist channels
  'playlist:getAll',
  'playlist:getById',
  'playlist:create',
  'playlist:update',
  'playlist:delete',
  'playlist:addVideo',
  'playlist:removeVideo',
  'playlist:downloadVideo',
  'playlist:refresh',
  
  // YouTube channels
  'yt:getPlaylistInfo',
  'yt:getPlaylistVideos',
  'yt:importPlaylist',
  'yt:checkVideoStatus',
  'yt:downloadVideo',
  'yt:getStatus',
  'yt:download',
  'yt:downloadProgress',
  
  // Settings channels
  'settings:get',
  'settings:set',
  'settings:getAll',
  'settings:reset',
  'settings:resetAll',
  
  // File system channels
  'fs:selectDirectory',
  'fs:createPlaylistDir',
  'fs:writePlaylistMetadata',
  'fs:readPlaylistMetadata',
  'fs:getAllPlaylists',
  'fs:deletePlaylist',
  'fs:videoExists',
  'fs:getFileSize',
  'fs:getFreeDiskSpace',
  'fs:validatePath',
  
  // Image utilities
  'image:cache',
  'image:getLocalPath',
  'image:clearCache'
];

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    send: (channel: string, data: any) => {
      // whitelist channels
      if (validSendChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel: string, func: Function) => {
      // Check if channel is valid or starts with a valid prefix (for dynamic channels)
      const isValid = validReceiveChannels.some(validChannel => 
        channel === validChannel || channel.startsWith(validChannel)
      );
      
      if (isValid) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    
    // Add invoke method for two-way communication
    invoke: (channel: string, ...args: any[]) => {
      if (validInvokeChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error(`Invalid channel: ${channel}`));
    },
    
    // Add the playlists API
    playlists: {
      getAll: () => ipcRenderer.invoke('playlist:getAll'),
      getById: (id: string) => ipcRenderer.invoke('playlist:getById', id),
      create: (name: string, description?: string) => 
        ipcRenderer.invoke('playlist:create', name, description),
      update: (id: string, updates: any) => 
        ipcRenderer.invoke('playlist:update', id, updates),
      delete: (id: string) => ipcRenderer.invoke('playlist:delete', id),
      addVideo: (playlistId: string, videoUrl: string) => 
        ipcRenderer.invoke('playlist:addVideo', playlistId, videoUrl),
      removeVideo: (playlistId: string, videoId: string) => 
        ipcRenderer.invoke('playlist:removeVideo', playlistId, videoId),
      downloadVideo: (playlistId: string, videoId: string, options?: any) => 
        ipcRenderer.invoke('playlist:downloadVideo', playlistId, videoId, options),
      refresh: (playlistId: string) => ipcRenderer.invoke('playlist:refresh', playlistId)
    },
    
    // Add YouTube API
    youtube: {
      getPlaylistInfo: (playlistUrl: string) => 
        ipcRenderer.invoke('yt:getPlaylistInfo', playlistUrl),
      getPlaylistVideos: (playlistUrl: string) => 
        ipcRenderer.invoke('yt:getPlaylistVideos', playlistUrl),
      importPlaylist: (url: string) => 
        ipcRenderer.invoke('yt:importPlaylist', url),
      checkVideoStatus: (videoUrl: string) => 
        ipcRenderer.invoke('yt:checkVideoStatus', videoUrl),
      downloadVideo: (videoUrl: string, outputDir: string, videoId: string, options: any = {}) => 
        ipcRenderer.invoke('yt:downloadVideo', videoUrl, outputDir, videoId, options),
      getStatus: () => 
        ipcRenderer.invoke('yt:getStatus'),
      download: () => 
        ipcRenderer.invoke('yt:download'),
      getDownloadProgress: () => 
        ipcRenderer.invoke('yt:downloadProgress')
    },
    
    // Settings API
    settings: {
      get: (key: string) => ipcRenderer.invoke('settings:get', key),
      set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
      getAll: () => ipcRenderer.invoke('settings:getAll'),
      reset: (key: string) => ipcRenderer.invoke('settings:reset', key),
      resetAll: () => ipcRenderer.invoke('settings:resetAll')
    },
    
    // File system API
    fs: {
      selectDirectory: () => ipcRenderer.invoke('fs:selectDirectory'),
      validatePath: (dirPath: string) => 
        ipcRenderer.invoke('fs:validatePath', dirPath)
    },
    
    // Image utils
    images: {
      cacheImage: (url: string) => 
        ipcRenderer.invoke('image:cache', url),
      getLocalPath: (url: string, downloadIfMissing: boolean = true) => 
        ipcRenderer.invoke('image:getLocalPath', url, downloadIfMissing)
    }
  }
); 