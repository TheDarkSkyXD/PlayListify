import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './main/ipc/handlers';
import { initializeSettings } from './main/services/settingsManager';
import { initYtDlp } from './main/services/ytDlpManager';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Initialize application services
const initializeApp = async () => {
  try {
    // Initialize settings first (creates necessary directories)
    initializeSettings();
    
    // Initialize yt-dlp
    await initYtDlp();
    
    console.log('Application services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application services:', error);
  }
};

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      // Use the CommonJS preload script instead of the webpack-bundled one
      preload: path.join(app.getAppPath(), 'src', 'preload-commonjs.js'),
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

// Register all IPC handlers
registerIpcHandlers();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  // Initialize application services before creating the window
  await initializeApp();
  
  // Create the main window
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