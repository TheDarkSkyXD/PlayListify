/**
 * Main process entry point for Playlistify Electron application
 * Handles application lifecycle, window management, and IPC communication
 */

import { app, BrowserWindow, screen, dialog, ipcMain } from 'electron';
import * as path from 'path';
import type { AppConfig } from '@/shared/types';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

// Application configuration following the design specification
const APP_CONFIG: AppConfig = {
  window: {
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    center: true,
  },
  security: {
    nodeIntegration: false,
    contextIsolation: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
  },
  development: {
    devTools: process.env.NODE_ENV === 'development',
    hotReload: process.env.NODE_ENV === 'development',
    debugLogging: process.env.NODE_ENV === 'development',
  },
};

// Basic initialization for Phase 1 (services will be implemented in later tasks)
const initializeApp = async (): Promise<void> => {
  try {
    if (APP_CONFIG.development.debugLogging) {
      console.log('App initialization started');
    }
    
    // Basic initialization - services will be implemented in later tasks
    // For now, just log that we're ready
    
    if (APP_CONFIG.development.debugLogging) {
      console.log('App services initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize app services:', error);
    throw error;
  }
};

// Basic IPC handlers for Phase 1 (will be expanded in later tasks)
if (process.env.NODE_ENV !== 'test') {
  // Basic app handlers
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:quit', () => {
    app.quit();
  });

  ipcMain.handle('app:minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.handle('app:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('app:isMaximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle('app:close', () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  // Legacy handlers for backward compatibility (will be implemented in later tasks)
  ipcMain.handle('getPlaylists', () => {
    return [{ id: '1', title: 'Sample Playlist' }];
  });

  ipcMain.handle('getPlaylistDetails', (_event, playlistId) => {
    return { error: 'Not implemented yet - will be added in later tasks' };
  });

  ipcMain.handle('playlist:getMetadata', (_event, url) => {
    return { error: 'Not implemented yet - will be added in later tasks' };
  });

  ipcMain.handle('import:start', (_event, url) => {
    return { error: 'Not implemented yet - will be added in later tasks' };
  });
}

const createWindow = async (): Promise<BrowserWindow> => {
  // Initialize app services first
  await initializeApp();
  
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  
  // Use default window settings for Phase 1 (settings service will be implemented in later tasks)
  const windowSize = {
    width: APP_CONFIG.window.width,
    height: APP_CONFIG.window.height,
  };
  
  const windowPosition = {
    x: Math.floor((screenWidth - windowSize.width) / 2),
    y: Math.floor((screenHeight - windowSize.height) / 2),
  };

  // Ensure window fits on screen
  const safeWidth = Math.min(windowSize.width, screenWidth);
  const safeHeight = Math.min(windowSize.height, screenHeight);
  const safeX = Math.max(0, Math.min(windowPosition.x, screenWidth - safeWidth));
  const safeY = Math.max(0, Math.min(windowPosition.y, screenHeight - safeHeight));
  
  // Create the browser window with enhanced configuration
  mainWindow = new BrowserWindow({
    width: safeWidth,
    height: safeHeight,
    x: safeX,
    y: safeY,
    minWidth: APP_CONFIG.window.minWidth,
    minHeight: APP_CONFIG.window.minHeight,
    show: false, // Don't show until ready
    title: 'Playlistify',
    webPreferences: {
      nodeIntegration: APP_CONFIG.security.nodeIntegration,
      contextIsolation: APP_CONFIG.security.contextIsolation,
      webSecurity: APP_CONFIG.security.webSecurity,
      allowRunningInsecureContent: APP_CONFIG.security.allowRunningInsecureContent,
      experimentalFeatures: APP_CONFIG.security.experimentalFeatures,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // Window event handlers
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      
      // Focus the window
      if (process.platform === 'darwin') {
        mainWindow.focus();
      }
      
      if (APP_CONFIG.development.debugLogging) {
        console.log('Main window is ready and shown');
      }
    }
  });

  // Basic window state management for Phase 1
  // (Advanced state persistence will be implemented in later tasks)
  mainWindow.on('resize', () => {
    if (APP_CONFIG.development.debugLogging) {
      console.log('Window resized');
    }
  });

  mainWindow.on('move', () => {
    if (APP_CONFIG.development.debugLogging) {
      console.log('Window moved');
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (APP_CONFIG.development.debugLogging) {
      console.log('Main window closed');
    }
  });

  // Handle window focus/blur for better UX
  mainWindow.on('focus', () => {
    if (APP_CONFIG.development.debugLogging) {
      console.log('Main window focused');
    }
  });

  mainWindow.on('blur', () => {
    if (APP_CONFIG.development.debugLogging) {
      console.log('Main window blurred');
    }
  });

  // Load the app
  try {
    await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    
    // Open DevTools in development
    if (APP_CONFIG.development.devTools) {
      mainWindow.webContents.openDevTools();
    }
    
    if (APP_CONFIG.development.debugLogging) {
      console.log('Main window loaded successfully');
    }
  } catch (error) {
    console.error('Failed to load main window:', error);
    throw error;
  }

  return mainWindow;
};

// Application lifecycle management
const handleAppReady = async (): Promise<void> => {
  try {
    await createWindow();
    
    if (APP_CONFIG.development.debugLogging) {
      console.log('Application ready and window created');
    }
  } catch (error) {
    console.error('Failed to create window on app ready:', error);
    
    // Show error dialog and quit
    const { dialog } = require('electron');
    await dialog.showErrorBox(
      'Startup Error',
      'Failed to initialize the application. Please try again or contact support.'
    );
    
    app.quit();
  }
};

const handleWindowAllClosed = (): void => {
  // On macOS, applications typically stay active until explicitly quit
  if (process.platform !== 'darwin') {
    if (APP_CONFIG.development.debugLogging) {
      console.log('All windows closed, quitting application');
    }
    app.quit();
  }
};

const handleActivate = async (): Promise<void> => {
  // On macOS, re-create window when dock icon is clicked and no windows are open
  if (BrowserWindow.getAllWindows().length === 0) {
    try {
      await createWindow();
      
      if (APP_CONFIG.development.debugLogging) {
        console.log('Window recreated on activate');
      }
    } catch (error) {
      console.error('Failed to recreate window on activate:', error);
    }
  }
};

const handleBeforeQuit = (event: Electron.Event): void => {
  if (APP_CONFIG.development.debugLogging) {
    console.log('Application is about to quit');
  }
  
  // Perform cleanup operations here if needed
  // For now, we'll just log the event
};

const handleWillQuit = (event: Electron.Event): void => {
  if (APP_CONFIG.development.debugLogging) {
    console.log('Application will quit');
  }
  
  // Final cleanup operations
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.removeAllListeners();
  }
};

// Set up application event listeners
app.on('ready', handleAppReady);
app.on('window-all-closed', handleWindowAllClosed);
app.on('activate', handleActivate);
app.on('before-quit', handleBeforeQuit);
app.on('will-quit', handleWillQuit);

// Handle certificate errors in development
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (APP_CONFIG.development.debugLogging) {
    console.warn('Certificate error:', error, 'for URL:', url);
  }
  
  // In development, we might want to ignore certificate errors for localhost
  if (process.env.NODE_ENV === 'development' && url.includes('localhost')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  // In production, we might want to report this error
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement error reporting
  }
  
  // Graceful shutdown
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
  
  app.quit();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // In production, we might want to report this error
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement error reporting
  }
});

// Security: Prevent new window creation from renderer
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationUrl) => {
    navigationEvent.preventDefault();
    
    if (APP_CONFIG.development.debugLogging) {
      console.warn('Blocked new window creation to:', navigationUrl);
    }
  });
  
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Only allow navigation to the same origin or specific allowed domains
    if (parsedUrl.origin !== 'http://localhost:3000' && 
        parsedUrl.origin !== 'https://www.youtube.com' &&
        parsedUrl.origin !== 'https://youtube.com') {
      navigationEvent.preventDefault();
      
      if (APP_CONFIG.development.debugLogging) {
        console.warn('Blocked navigation to:', navigationUrl);
      }
    }
  });
});

if (APP_CONFIG.development.debugLogging) {
  console.log('Main process initialized with configuration:', APP_CONFIG);
}