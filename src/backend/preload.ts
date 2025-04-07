import { contextBridge, ipcRenderer } from 'electron';

// Store original console methods for logging
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// Override console methods to capture output
console.log = function(...args) {
  // Send log to main process
  ipcRenderer.send('console:log', 'INFO', ...args);
  // Call original method
  return originalConsoleLog.apply(console, args);
};

console.info = function(...args) {
  // Send log to main process
  ipcRenderer.send('console:log', 'INFO', ...args);
  // Call original method
  return originalConsoleInfo.apply(console, args);
};

console.warn = function(...args) {
  // Send log to main process
  ipcRenderer.send('console:log', 'WARNING', ...args);
  // Call original method
  return originalConsoleWarn.apply(console, args);
};

console.error = function(...args) {
  // Send log to main process
  ipcRenderer.send('console:log', 'ERROR', ...args);
  // Call original method
  return originalConsoleError.apply(console, args);
};

// Define valid channels for security
const validSendChannels: string[] = ['toMain', 'console:log'];
const validReceiveChannels: string[] = ['fromMain', 'yt:importProgress', 'download-update'];
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

  // Playlist management channels
  'playlist:create',
  'playlist:getAll',
  'playlist:getById',
  'playlist:delete',
  'playlist:update',
  'playlist:addVideo',
  'playlist:removeVideo',
  'playlist:downloadVideo',
  'playlist:refresh',

  // Download management channels
  'download:addToQueue',
  'download:addMultipleToQueue',
  'download:pause',
  'download:resume',
  'download:cancel',
  'download:remove',
  'download:getAll',
  'download:getById',
  'download:getByStatus',
  'download:getByPlaylist',
  'download:getQueueStats'
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
        ipcRenderer.on(channel, (_event, ...args) => func(...args));
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
      },
      onImportProgress: (callback: (data: { status: string, count?: number, total?: number }) => void) => {
        const listener = (_: any, data: any) => callback(data);
        ipcRenderer.on('yt:importProgress', listener);
        return () => {
          ipcRenderer.removeListener('yt:importProgress', listener);
        };
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
    },

    // Download management API shortcuts
    downloads: {
      addToQueue: (videoUrl: string, videoId: string, title: string, outputDir: string, options: any = {}, playlistId?: string, thumbnail?: string) => {
        return ipcRenderer.invoke('download:addToQueue', videoUrl, videoId, title, outputDir, options, playlistId, thumbnail);
      },
      addMultipleToQueue: (videos: Array<{videoId: string, url: string, title: string, thumbnail?: string}>, playlistId: string, playlistName: string, customLocation?: string, createPlaylistFolder: boolean = true) => {
        console.log('PRELOAD: Invoking download:addMultipleToQueue with:', {
          videosCount: videos.length,
          playlistId,
          playlistName,
          customLocation,
          createPlaylistFolder
        });

        // Validate videos array
        if (!Array.isArray(videos) || videos.length === 0) {
          console.error('PRELOAD: Invalid or empty videos array provided to addMultipleToQueue');
          return Promise.resolve([]);
        }

        // Log the first few videos for debugging
        const firstFew = videos.slice(0, Math.min(3, videos.length));
        firstFew.forEach(video => {
          console.log(`PRELOAD: Video to be added to queue: ${video.title} (${video.videoId}) - URL: ${video.url}`);
        });

        // Filter out invalid videos
        const validVideos = videos.filter(video => {
          if (!video.url || !video.videoId || !video.title) {
            console.warn('PRELOAD: Skipping invalid video:', video);
            return false;
          }
          return true;
        });

        if (validVideos.length === 0) {
          console.error('PRELOAD: No valid videos to download');
          return Promise.resolve([]);
        }

        console.log(`PRELOAD: Sending ${validVideos.length} valid videos to download queue`);

        try {
          // Make sure the IPC channel is available
          if (!ipcRenderer) {
            console.error('PRELOAD: ipcRenderer is not available');
            return Promise.reject(new Error('IPC renderer not available'));
          }

          // Make sure the invoke method is available
          if (typeof ipcRenderer.invoke !== 'function') {
            console.error('PRELOAD: ipcRenderer.invoke is not a function');
            return Promise.reject(new Error('IPC invoke method not available'));
          }

          // Call the IPC method
          console.log('PRELOAD: Calling ipcRenderer.invoke with channel: download:addMultipleToQueue');
          return ipcRenderer.invoke('download:addMultipleToQueue', validVideos, playlistId, playlistName, customLocation, createPlaylistFolder)
            .then(result => {
              console.log('PRELOAD: ipcRenderer.invoke returned result:', result);
              return result;
            })
            .catch(error => {
              console.error('PRELOAD: ipcRenderer.invoke failed with error:', error);
              throw error;
            });
        } catch (error) {
          console.error('PRELOAD: Error in addMultipleToQueue:', error);
          return Promise.reject(error);
        }
      },
      pause: (downloadId: string) => {
        return ipcRenderer.invoke('download:pause', downloadId);
      },
      resume: (downloadId: string) => {
        return ipcRenderer.invoke('download:resume', downloadId);
      },
      cancel: (downloadId: string) => {
        return ipcRenderer.invoke('download:cancel', downloadId);
      },
      remove: (downloadId: string) => {
        return ipcRenderer.invoke('download:remove', downloadId);
      },
      getAll: () => {
        return ipcRenderer.invoke('download:getAll');
      },
      getById: (downloadId: string) => {
        return ipcRenderer.invoke('download:getById', downloadId);
      },
      getByStatus: (status: string | string[]) => {
        return ipcRenderer.invoke('download:getByStatus', status);
      },
      getByPlaylist: (playlistId: string) => {
        return ipcRenderer.invoke('download:getByPlaylist', playlistId);
      },
      getQueueStats: () => {
        return ipcRenderer.invoke('download:getQueueStats');
      },
      onDownloadUpdate: (callback: (download: any) => void) => {
        console.log('Setting up download update listener');
        const listener = (_: any, download: any) => {
          console.log('Received download update from main process:', download?.id, download?.status, download?.progress);
          if (download) {
            // Make sure the download object is valid before passing it to the callback
            callback(download);
          } else {
            console.warn('Received invalid download update from main process');
          }
        };
        ipcRenderer.on('download-update', listener);
        return () => {
          console.log('Removing download update listener');
          ipcRenderer.removeListener('download-update', listener);
        };
      }
    }
  }
);