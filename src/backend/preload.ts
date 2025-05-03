import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// List of valid IPC channels to expose to the renderer process
const validChannels = [
  // App channels
  'app:close',
  'app:minimize',
  'app:maximize',
  'app:unmaximize',
  'app:is-maximized',
  'app:get-app-info',
  'app:check-for-updates',
  'app:install-update',
  'app:info',
  'ping',
  'app:download-update',
  
  // Settings channels
  'settings:get',
  'settings:set',
  'settings:get-all',
  'settings:reset',
  
  // Playlist channels
  'playlist:get-all',
  'playlist:get-by-id',
  'playlist:create',
  'playlist:update',
  'playlist:delete',
  'playlist:add-video',
  'playlist:remove-video',
  'playlist:import',
  'playlist:export',
  'playlist:get',
  'playlist:import-json',
  'playlist:refresh',
  'playlist:get-youtube-info',
  'playlist:export-video',
  
  // Video channels
  'video:get',
  'video:update',
  'video:delete',
  'video:add',
  'video:remove',
  'video:update-position',
  'video:check-status',
  
  // Thumbnail channels
  'thumbnail:get',
  'thumbnail:get-all-by-ids',
  'thumbnail:prefetch',
  'thumbnail:get-local-path',
  'thumbnail:sync-failed-ids',
  'thumbnail:fetch',
  
  // Download channels
  'download:get-formats',
  'download:start-video',
  'download:start-playlist',
  'download:get-queue',
  'download:get-queue-status',
  'download:cancel',
  'download:retry',
  'download:select-directory',
  'download:clear-completed',
  'download:progress',
  'download:complete',
  'download:queue-update',
  'download:add',
  'download:pause',
  'download:resume',
  'download:get-status',
  'download:get-all',
  
  // File operations
  'file:open',
  'file:show-in-folder',
  
  // History
  'history:get',
  'history:add',
  'history:clear',
  'history:get-all',
  
  // Events (from main to renderer)
  'event:download-progress',
  'event:download-complete',
  'event:download-error',
  'event:app-update-available',
  
  // Format conversion channels
  'format-converter:get-formats',
  'format-converter:get-qualities',
  'format-converter:get-audio-bitrates',
  'format-converter:get-video-info',
  'format-converter:convert-file',
  'format-converter:extract-audio',
  'format-converter:change-quality',
  'format-converter:select-file',
  'format-converter:select-output-directory',
  'format-converter:progress',
  'format-converter:complete'
];

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    // Send a message to the main process and get a response
    invoke: <T = unknown, R = unknown>(channel: string, data?: T): Promise<R> => {
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
      throw new Error(`Unauthorized IPC channel: ${channel}`);
    },
    // Listen for messages from the main process
    on: <T = unknown>(channel: string, callback: (data: T) => void) => {
      if (validChannels.includes(channel)) {
        const subscription = (_event: IpcRendererEvent, ...args: any[]) => 
          callback(args.length > 1 ? args : args[0]);
        
        ipcRenderer.on(channel, subscription);
        
        // Return a function to remove the event listener
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }
      throw new Error(`Unauthorized IPC channel: ${channel}`);
    },
    // Listen for a message once
    once: <T = unknown>(channel: string, callback: (data: T) => void) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, (_event, ...args) => 
          callback(args.length > 1 ? args : args[0])
        );
      } else {
        throw new Error(`Unauthorized IPC channel: ${channel}`);
      }
    },
  },
});

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency] as string);
  }
}); 