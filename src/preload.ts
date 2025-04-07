import { contextBridge, ipcRenderer } from 'electron';
import type { Api, AppSettings } from './shared/types/appTypes';

// Set up a direct listener for import progress events to verify they're being received
ipcRenderer.on('yt:importProgress', (event, data) => {
  console.log('PRELOAD: Received yt:importProgress event', data);
});

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // General message passing
    send: (channel: string, data: any) => {
      // whitelist channels
      const validChannels = ['toMain', 'yt:requestProgressUpdates'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      } else {
        console.warn(`Attempted to send to invalid channel: ${channel}`);
      }
    },
    receive: (channel: string, func: Function) => {
      const validChannels = [
        'fromMain',
        'download-progress',
        'playlist-download-progress',
        'yt:importProgress',
        'download-update',
        'format:progress:*',
        'playlist-db:qualityUpdateProgress'
      ];

      // Check if the channel is valid or matches a wildcard pattern
      const isValid = validChannels.some(validChannel => {
        if (validChannel.endsWith('*')) {
          const prefix = validChannel.slice(0, -1);
          return channel.startsWith(prefix);
        }
        return channel === validChannel;
      });

      if (isValid) {
        console.log(`Registering receiver for channel: ${channel}`);
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => {
          console.log(`PRELOAD: Forwarding ${channel} event to renderer:`, args);
          try {
            func(...args);
          } catch (error) {
            console.error(`Error in ${channel} handler:`, error);
          }
        });
      } else {
        console.warn(`Attempted to register receiver for invalid channel: ${channel}`);
      }
    },
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args);
    },
    on: (channel: string, func: Function) => {
      const validChannels = [
        'fromMain',
        'download-progress',
        'playlist-download-progress',
        'yt:importProgress',
        'download-update',
        'format:progress:*'
      ];

      // Check if the channel is valid or matches a wildcard pattern
      const isValid = validChannels.some(validChannel => {
        if (validChannel.endsWith('*')) {
          const prefix = validChannel.slice(0, -1);
          return channel.startsWith(prefix);
        }
        return channel === validChannel;
      });

      if (isValid) {
        console.log(`Registering listener for channel: ${channel}`);
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      } else {
        console.warn(`Attempted to register listener for invalid channel: ${channel}`);
      }
    },
    off: (channel: string, func: Function) => {
      const validChannels = ['fromMain', 'download-progress', 'playlist-download-progress', 'yt:importProgress'];
      if (validChannels.includes(channel)) {
        console.log(`Removing listener for channel: ${channel}`);
        ipcRenderer.removeListener(channel, func as any);
      } else {
        console.warn(`Attempted to remove listener for invalid channel: ${channel}`);
      }
    },

    // Direct method to listen for progress updates
    listenForProgress: (callback: Function) => {
      const listener = (event: any, data: any) => {
        callback(data);
      };
      ipcRenderer.on('yt:importProgress', listener);
      return () => {
        ipcRenderer.removeListener('yt:importProgress', listener);
      };
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
      importPlaylist: (playlistUrl: string, playlistInfo?: any) =>
        ipcRenderer.invoke('yt:importPlaylist', playlistUrl, playlistInfo),
      checkVideoStatus: (videoUrl: string) =>
        ipcRenderer.invoke('yt:checkVideoStatus', videoUrl),
      downloadVideo: (videoUrl: string, outputDir: string, videoId: string, options?: any) =>
        ipcRenderer.invoke('yt:downloadVideo', videoUrl, outputDir, videoId, options),
      onImportProgress: (callback: (data: { status: string, count?: number, total?: number }) => void) => {
        const listener = (_: any, data: any) => {
          callback(data);
        };
        ipcRenderer.on('yt:importProgress', listener);
        return () => {
          ipcRenderer.removeListener('yt:importProgress', listener);
        };
      }
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
        ipcRenderer.invoke('playlist:refresh', playlistId),
      updateVideoQuality: (playlistId: string, videoId: string) =>
        ipcRenderer.invoke('playlist-db:updateVideoQuality', videoId, playlistId),
      updatePlaylistVideoQualities: (playlistId: string) =>
        ipcRenderer.invoke('playlist-db:updatePlaylistVideoQualities', playlistId),
      updateAllVideoQualities: () =>
        ipcRenderer.invoke('playlist-db:updateAllVideoQualities'),
      onQualityUpdateProgress: (callback: (data: { status: string, count?: number, total?: number }) => void) => {
        const listener = (_: any, data: any) => {
          callback(data);
        };
        ipcRenderer.on('playlist-db:qualityUpdateProgress', listener);
        return () => {
          ipcRenderer.removeListener('playlist-db:qualityUpdateProgress', listener);
        };
      }
    },

    // Database management API
    database: {
      getInfo: () =>
        ipcRenderer.invoke('database:getInfo'),
      backup: () =>
        ipcRenderer.invoke('database:backup'),
      restore: (backupPath: string) =>
        ipcRenderer.invoke('database:restore', backupPath),
      listBackups: () =>
        ipcRenderer.invoke('database:listBackups'),
      optimize: () =>
        ipcRenderer.invoke('database:optimize')
    },

    // Application management API
    app: {
      restart: () =>
        ipcRenderer.invoke('app:restart')
    },

    // Download manager API
    downloads: {
      addToQueue: (videoUrl: string, videoId: string, title: string, outputDir: string, options?: any, playlistId?: string, thumbnail?: string) =>
        ipcRenderer.invoke('download:addToQueue', videoUrl, videoId, title, outputDir, options, playlistId, thumbnail),
      addMultipleToQueue: (videos: Array<{videoId: string, url: string, title: string, thumbnail?: string}>, playlistId: string, playlistName: string) =>
        ipcRenderer.invoke('download:addMultipleToQueue', videos, playlistId, playlistName),
      pause: (downloadId: string) =>
        ipcRenderer.invoke('download:pause', downloadId),
      resume: (downloadId: string) =>
        ipcRenderer.invoke('download:resume', downloadId),
      cancel: (downloadId: string) =>
        ipcRenderer.invoke('download:cancel', downloadId),
      remove: (downloadId: string) =>
        ipcRenderer.invoke('download:remove', downloadId),
      getAll: () =>
        ipcRenderer.invoke('download:getAll'),
      getById: (downloadId: string) =>
        ipcRenderer.invoke('download:getById', downloadId),
      getByPlaylist: (playlistId: string) =>
        ipcRenderer.invoke('download:getByPlaylist', playlistId),
      getByStatus: (status: string) =>
        ipcRenderer.invoke('download:getByStatus', status),
      getQueueStats: () =>
        ipcRenderer.invoke('download:getQueueStats'),
      checkVideoStatus: (videoUrl: string) =>
        ipcRenderer.invoke('download:checkVideoStatus', videoUrl),
      onDownloadUpdate: (callback: Function) => {
        const channel = 'download-update';
        ipcRenderer.on(channel, (event, data) => callback(data));
        return () => {
          ipcRenderer.removeListener(channel, callback as any);
        };
      }
    },

    // Format converter API
    formatConverter: {
      initFFmpeg: () =>
        ipcRenderer.invoke('format:initFFmpeg'),
      convertFile: (inputPath: string, options: any) =>
        ipcRenderer.invoke('format:convertFile', inputPath, options),
      convertDownloadedVideo: (downloadId: string, options: any) =>
        ipcRenderer.invoke('format:convertDownloadedVideo', downloadId, options),
      extractAudio: (inputPath: string, format: string = 'mp3') =>
        ipcRenderer.invoke('format:extractAudio', inputPath, format),
      changeResolution: (inputPath: string, quality: string) =>
        ipcRenderer.invoke('format:changeResolution', inputPath, quality),
      trimVideo: (inputPath: string, startTime: string, endTime: string) =>
        ipcRenderer.invoke('format:trimVideo', inputPath, startTime, endTime),
      getAvailableFormats: () =>
        ipcRenderer.invoke('format:getAvailableFormats'),
      getAvailableQualities: () =>
        ipcRenderer.invoke('format:getAvailableQualities'),
      getVideoDuration: (filePath: string) =>
        ipcRenderer.invoke('format:getVideoDuration', filePath),
      onConversionProgress: (channel: string, callback: Function) => {
        ipcRenderer.on(channel, (event, data) => callback(data));
        return () => {
          ipcRenderer.removeListener(channel, callback as any);
        };
      }
    }
  } as Api
);