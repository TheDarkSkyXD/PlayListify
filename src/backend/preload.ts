import { contextBridge, ipcRenderer } from 'electron';

// Naming a generic API key for all exposed IPC functions
const apiKey = 'api';

// Whitelist of channels to expose to the renderer process
// Example: exposing a function to send a message and receive a response
const api = {
  // Example: send a message to main and get a response
  sendMessage: (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },
  // Example: receive messages from main
  receive: (channel: string, func: (...args: any[]) => void) => {
    // Deliberately strip event as it includes `sender`
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  // Example: remove a listener
  removeListener: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, func);
  }
  // Add other main process functions you want to expose here
  // For example:
  // settings: {
  //   get: (key: string) => ipcRenderer.invoke('settings:get', key),
  //   set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
  // },
  // fs: {
  //   readDir: (path: string) => ipcRenderer.invoke('fs:readDir', path),
  // }
};

// Expose the API to the renderer process under the specified key
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld(apiKey, api);
  } catch (error) {
    console.error('Failed to expose API in preload:', error);
  }
} else {
  // @ts-ignore (define a global property for non-contextIsolated environments, though not recommended for security)
  window[apiKey] = api;
  console.warn('Context Isolation is disabled. Preload script is exposed directly to window object. This is not recommended for security.');
}

console.log('Preload script loaded successfully.'); 