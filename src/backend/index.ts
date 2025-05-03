import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { registerAppHandlers } from './ipc/appHandlers';
import { registerSettingsHandlers } from './ipc/settingsHandlers';
import { registerPlaylistHandlers } from './ipc/playlistHandlers';
import { registerThumbnailHandlers } from './ipc/thumbnailHandlers';
import logger, { setupGlobalErrorLogging } from './services/logService';
import updateService from './services/updateService';
import dependencyService from './services/dependencyService';
import { getDatabase, closeDatabase } from './database';
import registerDownloadHandlers from './ipc/downloadHandlers';
import { registerFileHandlers } from './ipc/fileHandlers';

// Configure development app data directory if specified
if (process.env.PLAYLISTIFY_DEV_APP_DATA) {
  const devAppData = process.env.PLAYLISTIFY_DEV_APP_DATA;
  logger.info(`Using development app data directory: ${devAppData}`);
  
  // Override the userData path before any other code accesses it
  app.setPath('userData', devAppData);
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Set up global error logging
setupGlobalErrorLogging();

// Initialize database connection early
let db: any = null;

// Declare Webpack-injected variables
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const createWindow = async (): Promise<void> => {
  // Initialize database before creating the window
  try {
    logger.info('Initializing database...');
    db = await getDatabase();
    logger.info('Database initialized successfully');
    
    // Create the browser window only after database is ready
    const mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        // Use the webpack-defined preload script path in development,
        // otherwise fall back to the local path
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY || path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true, // Additional security: restrict preload script capabilities
      },
    });

    // Set Content Security Policy to allow loading images from YouTube
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      // In development mode, allow 'unsafe-eval' for webpack hot module replacement
      const scriptSrc = isDevelopment 
        ? "'self' 'unsafe-inline' 'unsafe-eval'" 
        : "'self' 'unsafe-inline'";
      
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            `default-src 'self' 'unsafe-inline' data:; ` +
            `script-src ${scriptSrc}; ` +
            `img-src 'self' data: https://*.youtube.com https://*.ytimg.com; ` +
            `media-src 'self' file: data: blob:;`
          ]
        }
      });
    });

    // Set up update service with the main window
    updateService.setupUpdateService(mainWindow);

    // Check for dependencies (yt-dlp, ffmpeg)
    try {
      await dependencyService.ensureDependencies();
      logger.info('External dependencies verified');
    } catch (error) {
      logger.error('Error checking dependencies:', error);
    }

    // Register IPC handlers AFTER database is initialized
    registerAppHandlers();
    registerSettingsHandlers();
    registerPlaylistHandlers();
    registerThumbnailHandlers();
    registerDownloadHandlers();
    registerFileHandlers();

    // Load the index.html of the app.
    if (MAIN_WINDOW_WEBPACK_ENTRY) {
      mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    }

    // Open external links in the default browser instead of a new Electron window
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // Open the DevTools in development mode
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    throw error;
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow().catch(err => {
    logger.error('Error creating window', err);
  });
});

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
    createWindow().catch(err => {
      logger.error('Error creating window', err);
    });
  }
});

// Allow graceful shutdown with a timeout
let isClosing = false;
let quitAttempted = false;
const MAX_CLOSE_TIMEOUT = 3000; // 3 seconds max to close database

// Listen for app before-quit event
app.on('before-quit', async (event) => {
  // Prevent handling this event multiple times
  if (quitAttempted) {
    logger.debug('Quit already attempted, ignoring duplicate before-quit event');
    return;
  }
  quitAttempted = true;
  
  // Only handle the first quit event
  if (isClosing) {
    logger.debug('App already closing, ignoring duplicate before-quit event');
    return;
  }
  
  // Prevent immediate quit and handle shutdown gracefully
  event.preventDefault();
  isClosing = true;
  
  logger.info('Application is shutting down...');
  
  // Use the centralized database closing function with a timeout
  try {
    // Set a timeout to force quit if closing takes too long
    const timeout = setTimeout(() => {
      logger.warn(`Database close timed out after ${MAX_CLOSE_TIMEOUT}ms, forcing quit`);
      app.exit(0); // Use exit instead of quit to avoid triggering before-quit again
    }, MAX_CLOSE_TIMEOUT);
    
    // Try to close gracefully
    await closeDatabase();
    clearTimeout(timeout);
    
    // Continue with quit
    app.exit(0); // Use exit instead of quit to avoid triggering before-quit again
  } catch (error) {
    logger.error('Error during application shutdown:', error);
    // Continue with quit even if closing fails
    app.exit(0); // Use exit instead of quit to avoid triggering before-quit again
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here. 