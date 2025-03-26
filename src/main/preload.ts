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
  'fs:validatePath'
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
    }
  }
); 