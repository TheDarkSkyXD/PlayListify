"use strict";
/**
 * Main process entry point for Playlistify Electron application
 * Handles application lifecycle, window management, and IPC communication
 */
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const index_1 = require("./backend/handlers/index");
const logger_service_1 = require("./backend/services/logger-service");
const development_service_1 = require("./backend/services/development-service");
// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
    electron_1.app.quit();
}
// Keep a global reference of the window object
let mainWindow = null;
// Initialize logger service
const logger = (0, logger_service_1.createLogger)({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    development: {
        enhanced: process.env.NODE_ENV === 'development',
        stackTrace: process.env.NODE_ENV === 'development'
    }
});
// Initialize development service
const developmentService = (0, development_service_1.createDevelopmentService)({
    enabled: process.env.NODE_ENV === 'development',
    performanceMonitoring: true,
    memoryTracking: true
});
// Application configuration following the design specification
const APP_CONFIG = {
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
const initializeApp = async () => {
    try {
        logger.info('App initialization started', 'MainProcess');
        // Initialize secure IPC communication architecture
        if (process.env.NODE_ENV !== 'test') {
            (0, index_1.initializeIPCHandlers)();
            logger.info('Secure IPC communication system initialized', 'MainProcess');
        }
        logger.info('App services initialized successfully', 'MainProcess');
    }
    catch (error) {
        logger.error('Failed to initialize app services', 'MainProcess', { error: error.message });
        throw error;
    }
};
const createWindow = async () => {
    // Initialize app services first
    await initializeApp();
    // Get primary display dimensions
    const primaryDisplay = electron_1.screen.getPrimaryDisplay();
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
    mainWindow = new electron_1.BrowserWindow({
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
    }
    catch (error) {
        logger.error('Failed to load main window', 'WindowManager', { error: error.message });
        throw error;
    }
    return mainWindow;
};
// Application lifecycle management
const handleAppReady = async () => {
    try {
        await createWindow();
        // Log system information in development mode
        if (process.env.NODE_ENV === 'development') {
            developmentService.logSystemInfo();
        }
        logger.info('Application ready and window created', 'AppLifecycle');
    }
    catch (error) {
        logger.error('Failed to create window on app ready', 'AppLifecycle', { error: error.message });
        // Show error dialog and quit
        const { dialog } = require('electron');
        await dialog.showErrorBox('Startup Error', 'Failed to initialize the application. Please try again or contact support.');
        electron_1.app.quit();
    }
};
const handleWindowAllClosed = () => {
    // On macOS, applications typically stay active until explicitly quit
    if (process.platform !== 'darwin') {
        logger.debug('All windows closed, quitting application', 'AppLifecycle');
        electron_1.app.quit();
    }
};
const handleActivate = async () => {
    // On macOS, re-create window when dock icon is clicked and no windows are open
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        try {
            await createWindow();
            logger.debug('Window recreated on activate', 'AppLifecycle');
        }
        catch (error) {
            logger.error('Failed to recreate window on activate', 'AppLifecycle', { error: error.message });
        }
    }
};
const handleBeforeQuit = (event) => {
    logger.debug('Application is about to quit', 'AppLifecycle');
    // Perform cleanup operations here if needed
    // For now, we'll just log the event
};
const handleWillQuit = (event) => {
    logger.debug('Application will quit', 'AppLifecycle');
    // Final cleanup operations
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.removeAllListeners();
    }
    // Cleanup IPC handlers
    if (process.env.NODE_ENV !== 'test') {
        (0, index_1.cleanupIPCHandlers)();
    }
    // Shutdown development service
    if (process.env.NODE_ENV === 'development') {
        developmentService.shutdown();
    }
    // Shutdown logger
    logger.shutdown().catch(error => {
        console.error('Failed to shutdown logger:', error);
    });
};
// Set up application event listeners
electron_1.app.on('ready', handleAppReady);
electron_1.app.on('window-all-closed', handleWindowAllClosed);
electron_1.app.on('activate', handleActivate);
electron_1.app.on('before-quit', handleBeforeQuit);
electron_1.app.on('will-quit', handleWillQuit);
// Handle certificate errors in development
electron_1.app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    logger.warn('Certificate error', 'Security', { error: error, url: url });
    // In development, we might want to ignore certificate errors for localhost
    if (process.env.NODE_ENV === 'development' && url.includes('localhost')) {
        event.preventDefault();
        callback(true);
    }
    else {
        callback(false);
    }
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', 'ProcessError', { error: error.message, stack: error.stack });
    // In production, we might want to report this error
    if (process.env.NODE_ENV === 'production') {
        // TODO: Implement error reporting
    }
    // Graceful shutdown
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.close();
    }
    electron_1.app.quit();
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', 'ProcessError', { reason: reason, promise: promise });
    // In production, we might want to report this error
    if (process.env.NODE_ENV === 'production') {
        // TODO: Implement error reporting
    }
});
// Security: Prevent new window creation from renderer
electron_1.app.on('web-contents-created', (_event, contents) => {
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
//# sourceMappingURL=main.js.map