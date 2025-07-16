/**
 * Application Lifecycle Service
 * Manages application startup, shutdown, and lifecycle events
 */

import { app, BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import type { ErrorHandlerService } from './error-handler-service';
import type { LoggerService } from './logger-service';
import type { WindowManagerService } from './window-manager-service';

export interface StartupProcedure {
  name: string;
  priority: number;
  timeout: number;
  procedure: () => Promise<void>;
  required: boolean;
}

export interface LifecycleEvents {
  'startup-started': void;
  'startup-completed': void;
  'startup-failed': { error: Error };
  'shutdown-started': { reason: string };
  'shutdown-completed': void;
  'before-quit': { event: Electron.Event };
  'will-quit': { event: Electron.Event };
  'window-all-closed': void;
  activate: void;
  ready: void;
}

export interface ApplicationState {
  isStarting: boolean;
  isReady: boolean;
  isShuttingDown: boolean;
  startupTime: number | null;
  readyTime: number | null;
  shutdownTime: number | null;
  lastError: Error | null;
  resourcesCleanedUp: boolean;
  eventListenersRemoved: boolean;
  windowsManaged: number;
  activeConnections: number;
}

export class ApplicationLifecycleService extends EventEmitter {
  private logger: LoggerService;
  private windowManager: WindowManagerService;
  private errorHandler: ErrorHandlerService;
  private startupProcedures: Map<string, StartupProcedure> = new Map();
  private state: ApplicationState = {
    isStarting: false,
    isReady: false,
    isShuttingDown: false,
    startupTime: null,
    readyTime: null,
    shutdownTime: null,
    lastError: null,
    resourcesCleanedUp: false,
    eventListenersRemoved: false,
    windowsManaged: 0,
    activeConnections: 0,
  };
  private startupTimeout = 60000; // 60 seconds
  private quitPrevented = false;
  private resourceCleanupTasks: Array<() => Promise<void>> = [];
  private eventListenerCleanupTasks: Array<() => void> = [];
  private activeTimers: Set<NodeJS.Timeout> = new Set();
  private activeIntervals: Set<NodeJS.Timeout> = new Set();

  constructor(
    logger: LoggerService,
    windowManager: WindowManagerService,
    errorHandler: ErrorHandlerService,
  ) {
    super();
    this.logger = logger;
    this.windowManager = windowManager;
    this.errorHandler = errorHandler;
    this.setupEventHandlers();
  }

  /**
   * Initialize the application lifecycle
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing application lifecycle', 'AppLifecycle');

    // Register default startup procedures
    this.registerDefaultStartupProcedures();

    // Register shutdown procedures with error handler
    await this.registerShutdownProcedures();

    this.logger.info('Application lifecycle initialized', 'AppLifecycle');
  }

  /**
   * Register a startup procedure
   */
  registerStartupProcedure(procedure: StartupProcedure): void {
    this.startupProcedures.set(procedure.name, procedure);
    this.logger.debug(
      `Startup procedure registered: ${procedure.name}`,
      'AppLifecycle',
    );
  }

  /**
   * Execute application startup sequence
   */
  async startup(): Promise<void> {
    if (this.state.isStarting || this.state.isReady) {
      this.logger.warn(
        'Startup already in progress or completed',
        'AppLifecycle',
      );
      return;
    }

    this.state.isStarting = true;
    this.state.startupTime = Date.now();
    this.emit('startup-started');

    this.logger.info('Starting application startup sequence', 'AppLifecycle');

    try {
      // Execute startup procedures in priority order
      const procedures = Array.from(this.startupProcedures.values()).sort(
        (a, b) => b.priority - a.priority,
      );

      for (const procedure of procedures) {
        try {
          this.logger.info(
            `Executing startup procedure: ${procedure.name}`,
            'AppLifecycle',
          );

          await Promise.race([
            procedure.procedure(),
            this.createTimeoutPromise(
              procedure.timeout,
              `Startup procedure ${procedure.name} timed out`,
            ),
          ]);

          this.logger.info(
            `Startup procedure completed: ${procedure.name}`,
            'AppLifecycle',
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Startup procedure failed: ${procedure.name}`,
            'AppLifecycle',
            {
              error: errorMessage,
            },
          );

          if (procedure.required) {
            throw new Error(
              `Required startup procedure failed: ${procedure.name} - ${errorMessage}`,
            );
          }
        }
      }

      this.state.isStarting = false;
      this.state.isReady = true;
      this.state.readyTime = Date.now();

      const startupDuration = this.state.readyTime - this.state.startupTime!;
      this.logger.info(
        `Application startup completed in ${startupDuration}ms`,
        'AppLifecycle',
      );

      this.emit('startup-completed');
    } catch (error) {
      this.state.isStarting = false;
      this.state.lastError =
        error instanceof Error ? error : new Error(String(error));

      this.logger.error('Application startup failed', 'AppLifecycle', {
        error: this.state.lastError.message,
      });

      this.emit('startup-failed', { error: this.state.lastError });
      throw this.state.lastError;
    }
  }

  /**
   * Execute application shutdown sequence
   */
  async shutdown(reason: string = 'Unknown'): Promise<void> {
    if (this.state.isShuttingDown) {
      this.logger.warn('Shutdown already in progress', 'AppLifecycle');
      return;
    }

    this.state.isShuttingDown = true;
    this.state.shutdownTime = Date.now();
    this.emit('shutdown-started', { reason });

    this.logger.info(
      `Starting application shutdown: ${reason}`,
      'AppLifecycle',
    );

    try {
      // Use error handler's graceful shutdown
      await this.errorHandler.gracefulShutdown(reason);

      this.logger.info('Application shutdown completed', 'AppLifecycle');
      this.emit('shutdown-completed');
    } catch (error) {
      this.logger.error('Error during application shutdown', 'AppLifecycle', {
        error: error instanceof Error ? error.message : error,
        reason,
      });
    }
  }

  /**
   * Get current application state
   */
  getState(): ApplicationState {
    return { ...this.state };
  }

  /**
   * Check if application is ready
   */
  isReady(): boolean {
    return this.state.isReady;
  }

  /**
   * Check if application is shutting down
   */
  isShuttingDown(): boolean {
    return this.state.isShuttingDown;
  }

  /**
   * Register a resource cleanup task
   */
  registerResourceCleanup(cleanupTask: () => Promise<void>): void {
    this.resourceCleanupTasks.push(cleanupTask);
    this.logger.debug('Resource cleanup task registered', 'AppLifecycle');
  }

  /**
   * Register an event listener cleanup task
   */
  registerEventListenerCleanup(cleanupTask: () => void): void {
    this.eventListenerCleanupTasks.push(cleanupTask);
    this.logger.debug('Event listener cleanup task registered', 'AppLifecycle');
  }

  /**
   * Register a timer for automatic cleanup
   */
  registerTimer(timer: NodeJS.Timeout): void {
    this.activeTimers.add(timer);
  }

  /**
   * Register an interval for automatic cleanup
   */
  registerInterval(interval: NodeJS.Timeout): void {
    this.activeIntervals.add(interval);
  }

  /**
   * Clean up all resources
   */
  async cleanupResources(): Promise<void> {
    if (this.state.resourcesCleanedUp) {
      this.logger.debug('Resources already cleaned up', 'AppLifecycle');
      return;
    }

    this.logger.info('Starting resource cleanup', 'AppLifecycle');

    try {
      // Clear all timers
      for (const timer of this.activeTimers) {
        clearTimeout(timer);
      }
      this.activeTimers.clear();

      // Clear all intervals
      for (const interval of this.activeIntervals) {
        clearInterval(interval);
      }
      this.activeIntervals.clear();

      // Execute resource cleanup tasks
      const cleanupPromises = this.resourceCleanupTasks.map(
        async (task, index) => {
          try {
            await task();
            this.logger.debug(
              `Resource cleanup task ${index} completed`,
              'AppLifecycle',
            );
          } catch (error) {
            this.logger.error(
              `Resource cleanup task ${index} failed`,
              'AppLifecycle',
              {
                error: error instanceof Error ? error.message : error,
              },
            );
          }
        },
      );

      await Promise.allSettled(cleanupPromises);

      this.state.resourcesCleanedUp = true;
      this.logger.info('Resource cleanup completed', 'AppLifecycle');
    } catch (error) {
      this.logger.error('Error during resource cleanup', 'AppLifecycle', {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Clean up all event listeners
   */
  cleanupEventListeners(): void {
    if (this.state.eventListenersRemoved) {
      this.logger.debug('Event listeners already cleaned up', 'AppLifecycle');
      return;
    }

    this.logger.info('Starting event listener cleanup', 'AppLifecycle');

    try {
      // Execute event listener cleanup tasks
      this.eventListenerCleanupTasks.forEach((task, index) => {
        try {
          task();
          this.logger.debug(
            `Event listener cleanup task ${index} completed`,
            'AppLifecycle',
          );
        } catch (error) {
          this.logger.error(
            `Event listener cleanup task ${index} failed`,
            'AppLifecycle',
            {
              error: error instanceof Error ? error.message : error,
            },
          );
        }
      });

      // Remove all listeners from this EventEmitter
      this.removeAllListeners();

      this.state.eventListenersRemoved = true;
      this.logger.info('Event listener cleanup completed', 'AppLifecycle');
    } catch (error) {
      this.logger.error('Error during event listener cleanup', 'AppLifecycle', {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Update window management statistics
   */
  updateWindowStats(windowCount: number): void {
    this.state.windowsManaged = windowCount;
    this.logger.debug(`Window count updated: ${windowCount}`, 'AppLifecycle');
  }

  /**
   * Update active connections count
   */
  updateConnectionStats(connectionCount: number): void {
    this.state.activeConnections = connectionCount;
    this.logger.debug(
      `Active connections updated: ${connectionCount}`,
      'AppLifecycle',
    );
  }

  /**
   * Register default startup procedures
   */
  private registerDefaultStartupProcedures(): void {
    // Window manager initialization
    this.registerStartupProcedure({
      name: 'window-manager',
      priority: 10,
      timeout: 10000,
      required: true,
      procedure: async () => {
        // Window manager should already be initialized
        this.logger.debug('Window manager startup procedure', 'AppLifecycle');
      },
    });

    // Main window creation
    this.registerStartupProcedure({
      name: 'main-window',
      priority: 5,
      timeout: 15000,
      required: true,
      procedure: async () => {
        await this.createMainWindow();
      },
    });

    // Post-startup cleanup
    this.registerStartupProcedure({
      name: 'post-startup-cleanup',
      priority: 1,
      timeout: 5000,
      required: false,
      procedure: async () => {
        // Perform any post-startup cleanup tasks
        this.logger.debug('Post-startup cleanup completed', 'AppLifecycle');
      },
    });
  }

  /**
   * Register shutdown procedures with error handler
   */
  private async registerShutdownProcedures(): Promise<void> {
    // Register resource cleanup
    this.errorHandler.registerShutdownProcedure({
      name: 'resource-cleanup',
      priority: 15,
      timeout: 10000,
      procedure: async () => {
        await this.cleanupResources();
      },
    });

    // Register window manager shutdown
    this.errorHandler.registerShutdownProcedure({
      name: 'window-manager',
      priority: 10,
      timeout: 10000,
      procedure: async () => {
        await this.windowManager.shutdown();
      },
    });

    // Register event listener cleanup
    this.errorHandler.registerShutdownProcedure({
      name: 'event-listener-cleanup',
      priority: 5,
      timeout: 5000,
      procedure: async () => {
        this.cleanupEventListeners();
      },
    });

    // Register application lifecycle shutdown
    this.errorHandler.registerShutdownProcedure({
      name: 'application-lifecycle',
      priority: 1,
      timeout: 5000,
      procedure: async () => {
        await this.shutdownService();
      },
    });
  }

  /**
   * Create the main application window
   */
  private async createMainWindow(): Promise<void> {
    try {
      const mainWindow = await this.windowManager.createWindow(
        {
          id: 'main',
          width: 800,
          height: 600,
          minWidth: 600,
          minHeight: 400,
          center: true,
          title: 'Playlistify',
          webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
          },
        },
        MAIN_WINDOW_WEBPACK_ENTRY,
      );

      // Open DevTools in development
      if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
      }

      this.logger.info('Main window created successfully', 'AppLifecycle');
    } catch (error) {
      this.logger.error('Failed to create main window', 'AppLifecycle', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Set up application event handlers
   */
  private setupEventHandlers(): void {
    // App ready event
    app.on('ready', async () => {
      this.emit('ready');
      try {
        await this.startup();
      } catch (error) {
        this.logger.error('Startup failed on app ready', 'AppLifecycle', {
          error: error instanceof Error ? error.message : error,
        });

        // Show error dialog and quit
        const { dialog } = require('electron');
        await dialog.showErrorBox(
          'Startup Error',
          'Failed to initialize the application. Please try again or contact support.',
        );

        app.quit();
      }
    });

    // Before quit event
    app.on('before-quit', event => {
      this.emit('before-quit', { event });

      if (!this.state.isShuttingDown && !this.quitPrevented) {
        this.quitPrevented = true;
        event.preventDefault();

        this.shutdown('Application Quit')
          .then(() => {
            this.quitPrevented = false;
            app.quit();
          })
          .catch(error => {
            this.logger.error(
              'Error during shutdown on before-quit',
              'AppLifecycle',
              {
                error: error instanceof Error ? error.message : error,
              },
            );
            this.quitPrevented = false;
            app.quit();
          });
      }
    });

    // Will quit event
    app.on('will-quit', event => {
      this.emit('will-quit', { event });
      this.logger.info('Application will quit', 'AppLifecycle');
    });

    // Window all closed event
    app.on('window-all-closed', () => {
      this.emit('window-all-closed');

      // On macOS, applications typically stay active until explicitly quit
      if (process.platform !== 'darwin') {
        this.logger.debug(
          'All windows closed, quitting application',
          'AppLifecycle',
        );
        app.quit();
      }
    });

    // Activate event (macOS)
    app.on('activate', () => {
      this.emit('activate');

      // On macOS, re-create window when dock icon is clicked and no windows are open
      if (BrowserWindow.getAllWindows().length === 0 && this.state.isReady) {
        this.createMainWindow().catch(error => {
          this.logger.error(
            'Failed to recreate main window on activate',
            'AppLifecycle',
            {
              error: error instanceof Error ? error.message : error,
            },
          );
        });
      }
    });

    // Window manager events
    this.windowManager.on('request-main-window', () => {
      if (this.state.isReady && !this.state.isShuttingDown) {
        this.createMainWindow().catch(error => {
          this.logger.error(
            'Failed to create main window on request',
            'AppLifecycle',
            {
              error: error instanceof Error ? error.message : error,
            },
          );
        });
      }
    });

    this.windowManager.on('all-windows-closed', () => {
      this.updateWindowStats(0);
      if (process.platform !== 'darwin' && !this.state.isShuttingDown) {
        app.quit();
      }
    });

    // Update window statistics when windows are created or closed
    this.windowManager.on('window-created', () => {
      const stats = this.windowManager.getWindowStats();
      this.updateWindowStats(stats.activeWindows);
    });

    this.windowManager.on('window-closed', () => {
      const stats = this.windowManager.getWindowStats();
      this.updateWindowStats(stats.activeWindows);
    });

    // Register window manager cleanup tasks
    this.registerEventListenerCleanup(() => {
      this.windowManager.removeAllListeners();
    });

    this.registerResourceCleanup(async () => {
      // Save all window states before shutdown
      const windowIds = this.windowManager.getAllWindowIds();
      this.logger.debug(
        `Saving state for ${windowIds.length} windows`,
        'AppLifecycle',
      );
    });

    // Certificate error handling
    app.on(
      'certificate-error',
      (event, webContents, url, error, certificate, callback) => {
        this.logger.warn('Certificate error', 'AppLifecycle', { error, url });

        // In development, we might want to ignore certificate errors for localhost
        if (
          process.env.NODE_ENV === 'development' &&
          url.includes('localhost')
        ) {
          event.preventDefault();
          callback(true);
        } else {
          callback(false);
        }
      },
    );

    // Security: Prevent new window creation from renderer
    app.on('web-contents-created', (_event, contents) => {
      // Handle external link attempts
      contents.setWindowOpenHandler(({ url }) => {
        this.logger.warn('Blocked new window creation', 'AppLifecycle', {
          url,
        });
        return { action: 'deny' };
      });

      contents.on('will-navigate', (navigationEvent, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        // Only allow navigation to the same origin or specific allowed domains
        if (
          parsedUrl.origin !== 'http://localhost:3000' &&
          parsedUrl.origin !== 'https://www.youtube.com' &&
          parsedUrl.origin !== 'https://youtube.com'
        ) {
          navigationEvent.preventDefault();
          this.logger.warn('Blocked navigation', 'AppLifecycle', {
            url: navigationUrl,
          });
        }
      });
    });
  }

  /**
   * Create a timeout promise for procedure timeouts
   */
  private createTimeoutPromise(
    timeout: number,
    message: string,
  ): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeout);
    });
  }

  /**
   * Shutdown the lifecycle service
   */
  async shutdownService(): Promise<void> {
    this.logger.info(
      'Application lifecycle service shutting down',
      'AppLifecycle',
    );
    this.removeAllListeners();
    this.logger.info(
      'Application lifecycle service shutdown complete',
      'AppLifecycle',
    );
  }
}
