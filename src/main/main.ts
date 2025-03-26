import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc/handlers';
import { initializeSettings } from './services/settingsManager';
import { initYtDlp } from './services/ytDlpManager';
import fs from 'fs-extra';

let mainWindow: BrowserWindow | null = null;

// Ensure static assets folder for development
async function ensureDevAssets() {
  if (process.env.NODE_ENV === 'development') {
    // Create assets directory for development server - try multiple possible locations
    const devAssetsDirs = [
      path.join(process.cwd(), 'dist', 'assets', 'images'), 
      path.join(process.cwd(), '.webpack', 'renderer', 'assets', 'images'),
      path.join(process.cwd(), '.webpack', 'main', 'assets', 'images')
    ];
    
    // Copy default playlist image to all potential asset directories
    const srcImage = path.join(process.cwd(), 'public', 'assets', 'images', 'playlist-default.jpg');
    
    for (const dir of devAssetsDirs) {
      await fs.ensureDir(dir);
      const destImage = path.join(dir, 'playlist-default.jpg');
      
      if (await fs.pathExists(srcImage)) {
        await fs.copy(srcImage, destImage, { overwrite: true });
        console.log('Default playlist image copied to:', dir);
      } else {
        console.warn('Could not find default playlist image at:', srcImage);
      }
    }
    
    // Also, create the assets directory directly in the current working directory
    // as the dev server might serve from the root
    const rootAssetsDir = path.join(process.cwd(), 'assets', 'images');
    await fs.ensureDir(rootAssetsDir);
    const rootDestImage = path.join(rootAssetsDir, 'playlist-default.jpg');
    
    if (await fs.pathExists(srcImage)) {
      await fs.copy(srcImage, rootDestImage, { overwrite: true });
      console.log('Default playlist image copied to root assets folder');
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Set Content Security Policy to allow YouTube image domains
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' data:; " +
          "img-src 'self' data: https://* http://* blob:; " +
          "media-src 'self' https://* http://* blob:; " +
          "connect-src 'self' https://* http://* blob:; " +
          "font-src 'self' data:;"
        ]
      }
    });
  });

  // In development, load from the dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize the application
app.whenReady().then(async () => {
  // Initialize settings before creating window
  initializeSettings();
  
  // Ensure development assets
  await ensureDevAssets();
  
  // Initialize yt-dlp
  try {
    await initYtDlp();
    console.log('yt-dlp initialized successfully');
  } catch (error) {
    console.error('Failed to initialize yt-dlp:', error);
    // Still continue with the app, we'll show an error to the user if they try to use YouTube features
  }
  
  // Create the main window
  createWindow();
  
  // Register IPC handlers
  registerIpcHandlers();

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 