/**
 * Main process entry point for Playlistify Electron application
 * Handles application lifecycle, window management, and IPC communication
 */

import { app, BrowserWindow, screen } from 'electron';
import type { AppConfig } from '@/shared/types';
import { initializeIPCHandlers, cleanupIPCHandlers } from './backend/handlers/index';
import { createLogger } from './backend/services/logger-service';
import { createDevelopmentService } from './backend/services/development-service';
import { ErrorHandlerService } from './backend/services/error-handler-service';
import { initializeErrorHandlers, cleanupErrorHandlers } from './backend/handlers/error-handlers';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

// Initialize logger service
const logger = createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  development: {
    enhanced: process.env.NODE_ENV === 'development',
    stackTrace: process.env.NODE_ENV === 'development'
  }
});

// Initialize development service
const developmentService = createDevelopmentService({
  enabled: process.env.NODE_ENV === 'development',
  performanceMonitoring: true,
  memoryTracking: true
});

// Initialize error handler service
const errorHandler = new ErrorHandlerService(logger);

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

// Application initialization with secure IPC communication
const initializeApp = async (): Promise<void> => {
  try {
    logger.info('App initialization started', 'MainProcess');
    
    // Initialize error handling service first
    await errorHandler.registerShutdownProcedure({
      name: 'logger',
      priority: 1,
      timeout: 5000,
      procedure: async () => {
        await logger.shutdown();
      },
    });

    await errorHandler.registerShutdownProcedure({
      name: 'development-service',
      priority: 2,
      timeout: 3000,
      procedure: async () => {
        if (process.env.NODE_ENV === 'development') {
          developmentService.shutdown();
        }
      },
    });

    await errorHandler.registerShutdownProcedure({
      name: 'ipc-handlers',
      priority: 3,
      timeout: 5000,
      procedure: async () => {
        if (process.env.NODE_ENV !== 'test') {
          cleanupIPCHandlers();
          cleanupErrorHandlers();
        }
      },
    });

    // Initialize secure IPC communication architecture
    if (process.env.NODE_ENV !== 'test') {
      initializeIPCHandlers();
      initializeErrorHandlers(errorHandler);
      logger.info('Secure IPC communication system initialized', 'MainProcess');
    }
    
    logger.info('App services initialized successfully', 'MainProcess');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to initialize app services', 'MainProcess', { error: errorMessage });
    
    // Use error handler for initialization errors
    await errorHandler.handleError(error instanceof Error ? error : new Error(errorMessage), {
      operation: 'initialization',
      component: 'MainProcess',
    });
    
    throw error;
  }
};

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
      
      logger.debug('Main window is ready and shown', 'WindowManager');
    }
  });

  // Basic window state management for Phase 1
  // (Advanced state persistence will be implemented in later tasks)
  mainWindow.on('resize', () => {
    logger.debug('Window resized', 'WindowManager');
  });

  mainWindow.on('move', () => {
    logger.debug('Window moved', 'WindowManager');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    logger.debug('Main window closed', 'WindowManager');
  });

  // Handle window focus/blur for better UX
  mainWindow.on('focus', () => {
    logger.debug('Main window focused', 'WindowManager');
  });

  mainWindow.on('blur', () => {
    logger.debug('Main window blurred', 'WindowManager');
  });

  // Load the app
  try {
    await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    
    // Open DevTools in development
    if (APP_CONFIG.development.devTools) {
      mainWindow.webContents.openDevTools();
    }
    
    logger.debug('Main window loaded successfully', 'WindowManager');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to load main window', 'WindowManager', { error: errorMessage });
    throw error;
  }

  return mainWindow;
};

// Application lifecycle management
const handleAppReady = async (): Promise<void> => {
  try {
    await createWindow();
    
    // Log system information in development mode
    if (process.env.NODE_ENV === 'development') {
      developmentService.logSystemInfo();
    }
    
    logger.info('Application ready and window created', 'AppLifecycle');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to create window on app ready', 'AppLifecycle', { error: errorMessage });
    
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
    logger.debug('All windows closed, quitting application', 'AppLifecycle');
    app.quit();
  }
};

const handleActivate = async (): Promise<void> => {
  // On macOS, re-create window when dock icon is clicked and no windows are open
  if (BrowserWindow.getAllWindows().length === 0) {
    try {
      await createWindow();
      
      logger.debug('Window recreated on activate', 'AppLifecycle');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to recreate window on activate', 'AppLifecycle', { error: errorMessage });
    }
  }
};

const handleBeforeQuit = (event: Electron.Event): void => {
  logger.debug('Application is about to quit', 'AppLifecycle');
  
  // Perform cleanup operations here if needed
  // For now, we'll just log the event
};

const handleWillQuit = async (event: Electron.Event): Promise<void> => {
  logger.debug('Application will quit', 'AppLifecycle');
  
  // Use error handler's graceful shutdown
  try {
    await errorHandler.gracefulShutdown('Application Quit');
  } catch (error) {
    logger.error('Error during graceful shutdown', 'AppLifecycle', {
      error: error instanceof Error ? error.message : error,
    });
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
  logger.warn('Certificate error', 'Security', { error: error, url: url });
  
  // In development, we might want to ignore certificate errors for localhost
  if (process.env.NODE_ENV === 'development' && url.includes('localhost')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Enhanced error handling is now managed by ErrorHandlerService
// The service automatically handles uncaught exceptions and unhandled rejections

// Security: Prevent new window creation from renderer
app.on('web-contents-created', (_event, contents) => {
  // Handle external link attempts
  contents.setWindowOpenHandler(({ url }) => {
    logger.warn('Blocked new window creation', 'Security', { url: url });
    return { action: 'deny' };
  });
  
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Only allow navigation to the same origin or specific allowed domains
    if (parsedUrl.origin !== 'http://localhost:3000' && 
        parsedUrl.origin !== 'https://www.youtube.com' &&
        parsedUrl.origin !== 'https://youtube.com') {
      navigationEvent.preventDefault();
      
      logger.warn('Blocked navigation', 'Security', { url: navigationUrl });
    }
  });
});

logger.debug('Main process initialized with configuration', 'MainProcess', { config: APP_CONFIG });