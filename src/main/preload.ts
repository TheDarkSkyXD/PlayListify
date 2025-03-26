import { contextBridge, ipcRenderer } from 'electron';

// Define valid channels for security
const validSendChannels: string[] = ['toMain'];
const validReceiveChannels: string[] = ['fromMain'];
const validInvokeChannels: string[] = [
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
  'image:clearCache',
  
  // YouTube channels
  'yt:getPlaylistInfo',
  'yt:getPlaylistVideos',
  'yt:importPlaylist',
  'yt:checkVideoStatus',
  'yt:downloadVideo',
  
  // yt-dlp management channels
  'ytdlp:getStatus',
  'ytdlp:download',
  'ytdlp:getDownloadProgress',
  
  // Playlist management channels
  'playlist:create',
  'playlist:getAll',
  'playlist:getById',
  'playlist:delete',
  'playlist:update',
  'playlist:addVideo',
  'playlist:removeVideo',
  'playlist:downloadVideo',
  'playlist:refresh'
];

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Send a message to the main process (one-way)
    send: (channel: string, data: any) => {
      if (validSendChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    
    // Receive a message from the main process (one-way)
    receive: (channel: string, func: (...args: any[]) => void) => {
      if (validReceiveChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    
    // Invoke a method in the main process and get a response (two-way)
    invoke: (channel: string, ...args: any[]) => {
      if (validInvokeChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error(`Invalid channel: ${channel}`));
    },
    
    // Settings API shortcuts
    settings: {
      get: (key: string) => {
        return ipcRenderer.invoke('settings:get', key);
      },
      set: (key: string, value: any) => {
        return ipcRenderer.invoke('settings:set', key, value);
      },
      getAll: () => {
        return ipcRenderer.invoke('settings:getAll');
      },
      reset: (key: string) => {
        return ipcRenderer.invoke('settings:reset', key);
      },
      resetAll: () => {
        return ipcRenderer.invoke('settings:resetAll');
      }
    },
    
    // File system API shortcuts
    fs: {
      selectDirectory: () => {
        return ipcRenderer.invoke('fs:selectDirectory');
      },
      createPlaylistDir: (playlistId: string, playlistName: string) => {
        return ipcRenderer.invoke('fs:createPlaylistDir', playlistId, playlistName);
      },
      writePlaylistMetadata: (playlistId: string, playlistName: string, metadata: any) => {
        return ipcRenderer.invoke('fs:writePlaylistMetadata', playlistId, playlistName, metadata);
      },
      readPlaylistMetadata: (playlistId: string, playlistName: string) => {
        return ipcRenderer.invoke('fs:readPlaylistMetadata', playlistId, playlistName);
      },
      getAllPlaylists: () => {
        return ipcRenderer.invoke('fs:getAllPlaylists');
      },
      deletePlaylist: (playlistId: string, playlistName: string) => {
        return ipcRenderer.invoke('fs:deletePlaylist', playlistId, playlistName);
      },
      videoExists: (playlistId: string, playlistName: string, videoId: string, format: string) => {
        return ipcRenderer.invoke('fs:videoExists', playlistId, playlistName, videoId, format);
      },
      getFileSize: (filePath: string) => {
        return ipcRenderer.invoke('fs:getFileSize', filePath);
      },
      getFreeDiskSpace: () => {
        return ipcRenderer.invoke('fs:getFreeDiskSpace');
      },
      validatePath: (dirPath: string) => {
        return ipcRenderer.invoke('fs:validatePath', dirPath);
      }
    },
    
    // Image utilities
    images: {
      cacheImage: (url: string) => {
        return ipcRenderer.invoke('image:cache', url);
      },
      getLocalPath: (url: string, downloadIfMissing: boolean = true) => {
        return ipcRenderer.invoke('image:getLocalPath', url, downloadIfMissing);
      },
      clearCache: (maxAgeDays: number = 30) => {
        return ipcRenderer.invoke('image:clearCache', maxAgeDays);
      }
    },
    
    // YouTube API shortcuts
    youtube: {
      getPlaylistInfo: (playlistUrl: string) => {
        return ipcRenderer.invoke('yt:getPlaylistInfo', playlistUrl);
      },
      getPlaylistVideos: (playlistUrl: string) => {
        return ipcRenderer.invoke('yt:getPlaylistVideos', playlistUrl);
      },
      importPlaylist: (playlistUrl: string) => {
        return ipcRenderer.invoke('yt:importPlaylist', playlistUrl);
      },
      checkVideoStatus: (videoUrl: string) => {
        return ipcRenderer.invoke('yt:checkVideoStatus', videoUrl);
      },
      downloadVideo: (videoUrl: string, outputDir: string, videoId: string, options: any = {}) => {
        return ipcRenderer.invoke('yt:downloadVideo', videoUrl, outputDir, videoId, options);
      }
    },
    
    // yt-dlp management API shortcuts
    ytDlp: {
      getStatus: () => {
        return ipcRenderer.invoke('ytdlp:getStatus');
      },
      download: () => {
        return ipcRenderer.invoke('ytdlp:download');
      },
      getDownloadProgress: () => {
        return ipcRenderer.invoke('ytdlp:getDownloadProgress');
      },
      getVideoInfo: (url: string) => {
        return ipcRenderer.invoke('ytdlp:getVideoInfo', url);
      }
    },
    
    // Playlist management API shortcuts
    playlists: {
      create: (name: string, description?: string) => {
        return ipcRenderer.invoke('playlist:create', name, description);
      },
      getAll: () => {
        return ipcRenderer.invoke('playlist:getAll');
      },
      getById: (playlistId: string) => {
        return ipcRenderer.invoke('playlist:getById', playlistId);
      },
      delete: (playlistId: string) => {
        return ipcRenderer.invoke('playlist:delete', playlistId);
      },
      update: (playlistId: string, updates: any) => {
        return ipcRenderer.invoke('playlist:update', playlistId, updates);
      },
      addVideo: (playlistId: string, videoUrl: string) => {
        return ipcRenderer.invoke('playlist:addVideo', playlistId, videoUrl);
      },
      removeVideo: (playlistId: string, videoId: string) => {
        return ipcRenderer.invoke('playlist:removeVideo', playlistId, videoId);
      },
      downloadVideo: (playlistId: string, videoId: string, options?: any) => {
        return ipcRenderer.invoke('playlist:downloadVideo', playlistId, videoId, options);
      },
      refresh: (playlistId: string) => {
        return ipcRenderer.invoke('playlist:refresh', playlistId);
      }
    }
  }
); 