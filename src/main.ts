import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './main/ipc/handlers';
import { initializeSettings } from './main/services/settingsManager';
import { initYtDlp, isYtDlpAvailable } from './main/services/ytDlpManager';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Global flag for yt-dlp availability
let ytDlpStatus = {
  available: false,
  errorMessage: ''
};

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_WEBPACK_ENTRY) {
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  }

  // Open the DevTools in development.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// Initialize app and register IPC handlers
app.whenReady().then(async () => {
  // Initialize settings
  initializeSettings();
  
  // Try to initialize yt-dlp
  try {
    const initialized = await initYtDlp();
    ytDlpStatus.available = initialized;
    
    if (initialized) {
      console.log('yt-dlp initialized successfully');
    } else {
      ytDlpStatus.errorMessage = 'yt-dlp is not available. YouTube features will be disabled.';
      console.warn(ytDlpStatus.errorMessage);
    }
  } catch (error) {
    ytDlpStatus.available = false;
    ytDlpStatus.errorMessage = 'Error initializing yt-dlp. YouTube features will be disabled.';
    console.error('Failed to initialize yt-dlp:', error);
  }
  
  // Register all IPC handlers
  registerIpcHandlers();
  
  // Create the window
  createWindow();
});

// Quit when all windows are closed, except on macOS.
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