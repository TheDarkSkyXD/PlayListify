/**
 * Tests for ApplicationLifecycleService
 * Covers application startup, shutdown, resource cleanup, and event handling
 */

import {
  ApplicationLifecycleService,
  type StartupProcedure,
} from '../../src/backend/services/application-lifecycle-service';
import type { ErrorHandlerService } from '../../src/backend/services/error-handler-service';
import type { LoggerService } from '../../src/backend/services/logger-service';
import type { WindowManagerService } from '../../src/backend/services/window-manager-service';

// Mock Electron modules
jest.mock('electron', () => ({
  app: {
    on: jest.fn(),
    whenReady: jest.fn(),
    quit: jest.fn(),
  },
  BrowserWindow: {
    getAllWindows: jest.fn(() => []),
  },
}));

// Mock webpack entry constants
(global as any).MAIN_WINDOW_WEBPACK_ENTRY = 'http://localhost:3000';
(global as any).MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY = '/path/to/preload.js';

describe('ApplicationLifecycleService', () => {
  let lifecycleService: ApplicationLifecycleService;
  let mockLogger: jest.Mocked<LoggerService>;
  let mockWindowManager: jest.Mocked<WindowManagerService>;
  let mockErrorHandler: jest.Mocked<ErrorHandlerService>;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      shutdown: jest.fn(),
    } as any;

    // Create mock window manager
    mockWindowManager = {
      createWindow: jest.fn(),
      shutdown: jest.fn(),
      getWindowStats: jest.fn(() => ({
        totalWindows: 1,
        activeWindows: 1,
        focusedWindow: 'main',
        mainWindow: 'main',
        windowStates: {},
      })),
      getAllWindowIds: jest.fn(() => ['main']),
      on: jest.fn(),
      removeAllListeners: jest.fn(),
    } as any;

    // Create mock error handler
    mockErrorHandler = {
      registerShutdownProcedure: jest.fn(),
      gracefulShutdown: jest.fn(),
    } as any;

    lifecycleService = new ApplicationLifecycleService(
      mockLogger,
      mockWindowManager,
      mockErrorHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await lifecycleService.initialize();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Initializing application lifecycle',
        'AppLifecycle',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Application lifecycle initialized',
        'AppLifecycle',
      );
      expect(mockErrorHandler.registerShutdownProcedure).toHaveBeenCalledTimes(
        4,
      );
    });

    it('should register default startup procedures', async () => {
      await lifecycleService.initialize();

      // Check that startup procedures were registered
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Startup procedure registered: window-manager',
        'AppLifecycle',
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Startup procedure registered: main-window',
        'AppLifecycle',
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Startup procedure registered: post-startup-cleanup',
        'AppLifecycle',
      );
    });
  });

  describe('Startup Process', () => {
    beforeEach(async () => {
      await lifecycleService.initialize();
    });

    it('should execute startup sequence successfully', async () => {
      // Mock window creation
      mockWindowManager.createWindow.mockResolvedValue({} as any);

      await lifecycleService.startup();

      const state = lifecycleService.getState();
      expect(state.isReady).toBe(true);
      expect(state.isStarting).toBe(false);
      expect(state.startupTime).toBeDefined();
      expect(state.readyTime).toBeDefined();
    });

    it('should handle startup procedure failures gracefully', async () => {
      // Register a failing procedure
      const failingProcedure: StartupProcedure = {
        name: 'failing-procedure',
        priority: 8,
        timeout: 1000,
        required: false,
        procedure: async () => {
          throw new Error('Test failure');
        },
      };

      lifecycleService.registerStartupProcedure(failingProcedure);

      // Mock window creation
      mockWindowManager.createWindow.mockResolvedValue({} as any);

      await lifecycleService.startup();

      // Should still complete startup despite non-required procedure failure
      expect(lifecycleService.isReady()).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Startup procedure failed: failing-procedure',
        'AppLifecycle',
        { error: 'Test failure' },
      );
    });

    it('should fail startup if required procedure fails', async () => {
      // Register a failing required procedure
      const failingProcedure: StartupProcedure = {
        name: 'required-failing-procedure',
        priority: 8,
        timeout: 1000,
        required: true,
        procedure: async () => {
          throw new Error('Required failure');
        },
      };

      lifecycleService.registerStartupProcedure(failingProcedure);

      await expect(lifecycleService.startup()).rejects.toThrow(
        'Required startup procedure failed: required-failing-procedure - Required failure',
      );

      expect(lifecycleService.isReady()).toBe(false);
    });

    it('should prevent multiple startup attempts', async () => {
      mockWindowManager.createWindow.mockResolvedValue({} as any);

      await lifecycleService.startup();
      await lifecycleService.startup(); // Second attempt

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Startup already in progress or completed',
        'AppLifecycle',
      );
    });
  });

  describe('Shutdown Process', () => {
    beforeEach(async () => {
      await lifecycleService.initialize();
      mockWindowManager.createWindow.mockResolvedValue({} as any);
      await lifecycleService.startup();
    });

    it('should execute shutdown sequence successfully', async () => {
      await lifecycleService.shutdown('Test shutdown');

      expect(mockErrorHandler.gracefulShutdown).toHaveBeenCalledWith(
        'Test shutdown',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting application shutdown: Test shutdown',
        'AppLifecycle',
      );
    });

    it('should prevent multiple shutdown attempts', async () => {
      await lifecycleService.shutdown('First shutdown');
      await lifecycleService.shutdown('Second shutdown');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Shutdown already in progress',
        'AppLifecycle',
      );
    });
  });

  describe('Resource Management', () => {
    beforeEach(async () => {
      await lifecycleService.initialize();
    });

    it('should register and execute resource cleanup tasks', async () => {
      const cleanupTask = jest.fn().mockResolvedValue(undefined);
      lifecycleService.registerResourceCleanup(cleanupTask);

      await lifecycleService.cleanupResources();

      expect(cleanupTask).toHaveBeenCalled();
      expect(lifecycleService.getState().resourcesCleanedUp).toBe(true);
    });

    it('should handle resource cleanup failures gracefully', async () => {
      const failingCleanupTask = jest
        .fn()
        .mockRejectedValue(new Error('Cleanup failed'));
      lifecycleService.registerResourceCleanup(failingCleanupTask);

      await lifecycleService.cleanupResources();

      expect(failingCleanupTask).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Resource cleanup task'),
        'AppLifecycle',
        { error: 'Cleanup failed' },
      );
    });

    it('should clean up timers and intervals', async () => {
      const timer = setTimeout(() => {}, 1000);
      const interval = setInterval(() => {}, 1000);

      lifecycleService.registerTimer(timer);
      lifecycleService.registerInterval(interval);

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      await lifecycleService.cleanupResources();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(timer);
      expect(clearIntervalSpy).toHaveBeenCalledWith(interval);

      clearTimeoutSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Event Listener Management', () => {
    beforeEach(async () => {
      await lifecycleService.initialize();
    });

    it('should register and execute event listener cleanup tasks', () => {
      const cleanupTask = jest.fn();
      lifecycleService.registerEventListenerCleanup(cleanupTask);

      lifecycleService.cleanupEventListeners();

      expect(cleanupTask).toHaveBeenCalled();
      expect(lifecycleService.getState().eventListenersRemoved).toBe(true);
    });

    it('should handle event listener cleanup failures gracefully', () => {
      const failingCleanupTask = jest.fn().mockImplementation(() => {
        throw new Error('Event cleanup failed');
      });
      lifecycleService.registerEventListenerCleanup(failingCleanupTask);

      lifecycleService.cleanupEventListeners();

      expect(failingCleanupTask).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Event listener cleanup task'),
        'AppLifecycle',
        { error: 'Event cleanup failed' },
      );
    });
  });

  describe('Statistics Management', () => {
    it('should update window statistics', () => {
      lifecycleService.updateWindowStats(3);

      const state = lifecycleService.getState();
      expect(state.windowsManaged).toBe(3);
    });

    it('should update connection statistics', () => {
      lifecycleService.updateConnectionStats(5);

      const state = lifecycleService.getState();
      expect(state.activeConnections).toBe(5);
    });
  });

  describe('State Management', () => {
    it('should return current application state', () => {
      const state = lifecycleService.getState();

      expect(state).toHaveProperty('isStarting');
      expect(state).toHaveProperty('isReady');
      expect(state).toHaveProperty('isShuttingDown');
      expect(state).toHaveProperty('resourcesCleanedUp');
      expect(state).toHaveProperty('eventListenersRemoved');
      expect(state).toHaveProperty('windowsManaged');
      expect(state).toHaveProperty('activeConnections');
    });

    it('should report ready status correctly', async () => {
      expect(lifecycleService.isReady()).toBe(false);

      await lifecycleService.initialize();
      mockWindowManager.createWindow.mockResolvedValue({} as any);
      await lifecycleService.startup();

      expect(lifecycleService.isReady()).toBe(true);
    });

    it('should report shutdown status correctly', async () => {
      await lifecycleService.initialize();
      mockWindowManager.createWindow.mockResolvedValue({} as any);
      await lifecycleService.startup();

      expect(lifecycleService.isShuttingDown()).toBe(false);

      // Start shutdown but don't await it
      const shutdownPromise = lifecycleService.shutdown('Test');
      expect(lifecycleService.isShuttingDown()).toBe(true);

      await shutdownPromise;
    });
  });
});
