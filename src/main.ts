/**
 * Main process entry point for Playlistify Electron application
 * Handles application lifecycle, window management, and IPC communication
 */

import type { AppConfig } from '@/shared/types';
import { app } from 'electron';
import {
  cleanupErrorHandlers,
  initializeErrorHandlers,
} from './backend/handlers/error-handlers';
import {
  cleanupIPCHandlers,
  initializeIPCHandlers,
} from './backend/handlers/index';
import { ApplicationLifecycleService } from './backend/services/application-lifecycle-service';
import { createDevelopmentService } from './backend/services/development-service';
import { ErrorHandlerService } from './backend/services/error-handler-service';
import { createLogger } from './backend/services/logger-service';
import { WindowManagerService } from './backend/services/window-manager-service';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Initialize logger service
const logger = createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  development: {
    enhanced: process.env.NODE_ENV === 'development',
    stackTrace: process.env.NODE_ENV === 'development',
  },
});

// Initialize development service
const developmentService = createDevelopmentService({
  enabled: process.env.NODE_ENV === 'development',
  performanceMonitoring: true,
  memoryTracking: true,
});

// Initialize core services
const errorHandler = new ErrorHandlerService(logger);
const windowManager = new WindowManagerService(logger);
const applicationLifecycle = new ApplicationLifecycleService(
  logger,
  windowManager,
  errorHandler,
);

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

    // Initialize application lifecycle service
    await applicationLifecycle.initialize();

    // Register core shutdown procedures
    errorHandler.registerShutdownProcedure({
      name: 'logger',
      priority: 1,
      timeout: 5000,
      procedure: async () => {
        await logger.shutdown();
      },
    });

    errorHandler.registerShutdownProcedure({
      name: 'development-service',
      priority: 2,
      timeout: 3000,
      procedure: async () => {
        if (process.env.NODE_ENV === 'development') {
          developmentService.shutdown();
        }
      },
    });

    errorHandler.registerShutdownProcedure({
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
    logger.error('Failed to initialize app services', 'MainProcess', {
      error: errorMessage,
    });

    // Use error handler for initialization errors
    await errorHandler.handleError(
      error instanceof Error ? error : new Error(errorMessage),
      {
        operation: 'initialization',
        component: 'MainProcess',
      },
    );

    throw error;
  }
};

// Initialize the application
const initializeApplication = async (): Promise<void> => {
  try {
    // Initialize app services first
    await initializeApp();

    // Log system information in development mode
    if (process.env.NODE_ENV === 'development') {
      developmentService.logSystemInfo();
    }

    logger.info('Application initialization completed', 'MainProcess');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to initialize application', 'MainProcess', {
      error: errorMessage,
    });
    throw error;
  }
};

// Application lifecycle is now managed by ApplicationLifecycleService
// The service handles all app events and window management automatically

// Initialize the application when ready
app.whenReady().then(() => {
  initializeApplication().catch(error => {
    logger.error('Failed to initialize application on ready', 'MainProcess', {
      error: error instanceof Error ? error.message : error,
    });
    app.quit();
  });
});

logger.debug('Main process initialized with configuration', 'MainProcess', {
  config: APP_CONFIG,
});
