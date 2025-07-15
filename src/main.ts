import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { registerSettingsHandlers } from './handlers/settings-handlers';
import { registerFileHandlers } from './handlers/file-handlers';
import { registerPlaylistHandlers } from './handlers/playlist-handlers';
import { settingsService } from './services/settingsService';
import { FileUtils } from './utils/fileUtils';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// if (require('electron-squirrel-startup')) {
//   app.quit();
// }

// Mock data for testing
const mockPlaylists = [
  { id: '1', title: 'My Test Playlist' }
];

// Initialize app services
const initializeApp = async (): Promise<void> => {
  try {
    // Initialize directories
    await FileUtils.initializeDirectories();
    
    // Initialize settings
    await settingsService.initializeDownloadLocation();
    settingsService.validateSettings();
    
    console.log('App services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app services:', error);
  }
};

// IPC handlers (conditionally registered to avoid conflicts with tests)
if (process.env.NODE_ENV !== 'test') {
  // Register all IPC handlers
  registerSettingsHandlers();
  registerFileHandlers();
  registerPlaylistHandlers();
  
  // Legacy handlers for backward compatibility
  ipcMain.handle('getPlaylists', () => {
    return mockPlaylists;
  });

  ipcMain.handle('getPlaylistDetails', (event, playlistId) => {
    // This will be overridden by tests
    return { error: 'Not implemented' };
  });

  ipcMain.handle('playlist:getMetadata', (event, url) => {
    // This will be implemented later
    return { error: 'Not implemented' };
  });

  ipcMain.handle('import:start', (event, url) => {
    // This will be implemented later
    return { error: 'Not implemented' };
  });
}

const createWindow = async (): Promise<void> => {
  // Initialize app services first
  await initializeApp();
  
  // Get window settings
  const windowSize = settingsService.get('windowSize');
  const windowPosition = settingsService.get('windowPosition');
  
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    x: windowPosition.x,
    y: windowPosition.y,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // Save window size and position when changed
  mainWindow.on('resize', () => {
    const [width, height] = mainWindow.getSize();
    settingsService.set('windowSize', { width, height });
  });

  mainWindow.on('move', () => {
    const [x, y] = mainWindow.getPosition();
    settingsService.set('windowPosition', { x, y });
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.