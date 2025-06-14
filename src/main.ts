import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerSettingsHandlers } from './backend/ipc/settingsHandlers';
import { registerFileHandlers } from './backend/ipc/fileHandlers';
import { registerAppHandlers } from './backend/ipc/app-handlers';
import { registerDownloadHandlers } from './backend/ipc/download-handlers';
import { registerPlaylistHandlers } from './backend/ipc/playlist-handlers';
import { registerThumbnailHandlers } from './backend/ipc/thumbnail-handlers';
import { initializeLogging, overrideConsoleMethods } from './backend/backend';

 let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, // Use the global constant
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY); // Use the global constant
  mainWindow.on('closed', () => (mainWindow = null));
}
 
app.on('ready', () => {
  initializeLogging(); // Initialize logging first
  overrideConsoleMethods(); // Then override console methods
  createWindow();
  registerSettingsHandlers();
  registerFileHandlers();
  registerAppHandlers();
  registerDownloadHandlers();
  registerPlaylistHandlers();
  registerThumbnailHandlers();
});
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
app.on('activate', () => mainWindow === null && createWindow());