import { app, BrowserWindow } from 'electron';
import path from 'path';
import { checkAndInstallYtDlp, isDevelopment } from './services/ytDlpManager';
import { registerIpcHandlers } from './ipc/handlers';

// Will be set to true once everything is ready
let appReady = !isDevelopment();

// Create main window function
async function createWindow() {
  if (!appReady) return;
  
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load app
  if (isDevelopment()) {
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

// When Electron is ready
app.whenReady().then(async () => {
  // Register all IPC handlers
  registerIpcHandlers();
  
  // In development, check for yt-dlp before launching
  if (isDevelopment()) {
    console.log('Development mode: Checking yt-dlp availability...');
    try {
      const installed = await checkAndInstallYtDlp();
      if (installed) {
        console.log('yt-dlp is available, launching app...');
        appReady = true;
        createWindow();
      } else {
        console.error('Failed to verify yt-dlp installation.');
        app.quit();
      }
    } catch (error) {
      console.error('Error checking yt-dlp:', error);
      app.quit();
    }
  } else {
    // In production, just create the window
    createWindow();
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 