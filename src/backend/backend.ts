import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, // Use the Electron Forge Webpack constant
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  // DEV_MODE check for loading URL
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000'); // Webpack dev server URL
  } else {
    // In production, load the index.html file
    // The path will be something like: `file://${path.join(__dirname, '../renderer/main_window/index.html')}`
    // This needs to be adjusted based on your Webpack output for the renderer process.
    // For Electron Forge, it might be MAIN_WINDOW_WEBPACK_ENTRY
    mainWindow.loadFile(path.join(__dirname, '../renderer/main_window/index.html')); // Placeholder
  }

  mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Basic IPC setup example (will be expanded in Phase 1.6)
import './ipc/appHandlers'; // Assuming you will create this for IPC 