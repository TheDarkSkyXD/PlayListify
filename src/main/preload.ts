import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    // Send a message to the main process and get a response
    invoke: <T = unknown, R = unknown>(channel: string, data?: T): Promise<R> => {
      return ipcRenderer.invoke(channel, data);
    },
    // Listen for messages from the main process
    on: <T = unknown>(channel: string, callback: (data: T) => void) => {
      const subscription = (_event: IpcRendererEvent, ...args: any[]) => 
        callback(args.length > 1 ? args : args[0]);
      
      ipcRenderer.on(channel, subscription);
      
      // Return a function to remove the event listener
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    // Listen for a message once
    once: <T = unknown>(channel: string, callback: (data: T) => void) => {
      ipcRenderer.once(channel, (_event, ...args) => 
        callback(args.length > 1 ? args : args[0])
      );
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