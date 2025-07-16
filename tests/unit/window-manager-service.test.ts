/**
 * Tests for WindowManagerService
 * Covers window creation, management, state persistence, and multi-window communication
 */

import { BrowserWindow } from 'electron';
import type { LoggerService } from '../../src/backend/services/logger-service';
import {
  WindowManagerService,
  type WindowConfig,
} from '../../src/backend/services/window-manager-service';

// Mock settings service interface
interface MockSettingsService {
  get<T>(key: string): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
}

// Mock Electron modules
jest.mock('electron', () => ({
  app: {
    on: jest.fn(),
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    getBounds: jest.fn(() => ({ x: 100, y: 100, width: 800, height: 600 })),
    setBounds: jest.fn(),
    isMaximized: jest.fn(() => false),
    isMinimized: jest.fn(() => false),
    isFullScreen: jest.fn(() => false),
    isVisible: jest.fn(() => true),
    isFocused: jest.fn(() => false),
    isDestroyed: jest.fn(() => false),
    maximize: jest.fn(),
    minimize: jest.fn(),
    restore: jest.fn(),
    focus: jest.fn(),
    close: jest.fn(),
    show: jest.fn(),
    center: jest.fn(),
    loadURL: jest.fn(),
    once: jest.fn((event, callback) => {
      if (event === 'ready-to-show') {
        setTimeout(callback, 0);
      }
    }),
    on: jest.fn(),
    webContents: {
      send: jest.fn(),
      openDevTools: jest.fn(),
    },
  })),
  screen: {
    getPrimaryDisplay: jest.fn(() => ({
      workAreaSize: { width: 1920, height: 1080 },
    })),
  },
}));

describe('WindowManagerService', () => {
  let windowManager: WindowManagerService;
  let mockLogger: jest.Mocked<LoggerService>;
  let mockSettings: jest.Mocked<MockSettingsService>;
  let mockWindow: any;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    // Create mock settings
    mockSettings = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    // Reset BrowserWindow mock
    mockWindow = {
      getBounds: jest.fn(() => ({ x: 100, y: 100, width: 800, height: 600 })),
      setBounds: jest.fn(),
      isMaximized: jest.fn(() => false),
      isMinimized: jest.fn(() => false),
      isFullScreen: jest.fn(() => false),
      isVisible: jest.fn(() => true),
      isFocused: jest.fn(() => false),
      isDestroyed: jest.fn(() => false),
      maximize: jest.fn(),
      minimize: jest.fn(),
      restore: jest.fn(),
      focus: jest.fn(),
      close: jest.fn(),
      show: jest.fn(),
      center: jest.fn(),
      loadURL: jest.fn(),
      once: jest.fn((event, callback) => {
        if (event === 'ready-to-show') {
          setTimeout(callback, 0);
        }
      }),
      on: jest.fn(),
      webContents: {
        send: jest.fn(),
        openDevTools: jest.fn(),
      },
    };

    (
      BrowserWindow as jest.MockedClass<typeof BrowserWindow>
    ).mockImplementation(() => mockWindow);

    windowManager = new WindowManagerService(mockLogger, mockSettings);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Window Creation', () => {
    const testConfig: WindowConfig = {
      id: 'test-window',
      width: 800,
      height: 600,
      minWidth: 400,
      minHeight: 300,
      center: true,
      title: 'Test Window',
    };

    it('should create a new window successfully', async () => {
      const window = await windowManager.createWindow(
        testConfig,
        'http://localhost:3000',
      );

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 800,
          height: 600,
          minWidth: 400,
          minHeight: 300,
          title: 'Test Window',
          webPreferences: expect.objectContaining({
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
          }),
        }),
      );

      expect(mockWindow.loadURL).toHaveBeenCalledWith('http://localhost:3000');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating window: test-window',
        'WindowManager',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Window created successfully: test-window',
        'WindowManager',
      );
    });

    it('should return existing window if already created', async () => {
      const firstWindow = await windowManager.createWindow(testConfig);
      const secondWindow = await windowManager.createWindow(testConfig);

      expect(firstWindow).toBe(secondWindow);
      expect(mockWindow.focus).toHaveBeenCalled();
    });

    it('should handle window creation errors', async () => {
      (
        BrowserWindow as jest.MockedClass<typeof BrowserWindow>
      ).mockImplementation(() => {
        throw new Error('Window creation failed');
      });

      await expect(windowManager.createWindow(testConfig)).rejects.toThrow(
        'Window creation failed',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create window: test-window',
        'WindowManager',
        { error: 'Window creation failed' },
      );
    });
  });

  describe('Window Management', () => {
    const testConfig: WindowConfig = {
      id: 'test-window',
      width: 800,
      height: 600,
      minWidth: 400,
      minHeight: 300,
    };

    beforeEach(async () => {
      await windowManager.createWindow(testConfig);
    });

    it('should get window by ID', () => {
      const window = windowManager.getWindow('test-window');
      expect(window).toBe(mockWindow);
    });

    it('should return null for non-existent window', () => {
      const window = windowManager.getWindow('non-existent');
      expect(window).toBeNull();
    });

    it('should get all active windows', () => {
      const windows = windowManager.getAllWindows();
      expect(windows).toHaveLength(1);
      expect(windows[0]).toBe(mockWindow);
    });

    it('should focus a window', () => {
      const result = windowManager.focusWindow('test-window');
      expect(result).toBe(true);
      expect(mockWindow.focus).toHaveBeenCalled();
    });

    it('should restore minimized window when focusing', () => {
      mockWindow.isMinimized.mockReturnValue(true);

      const result = windowManager.focusWindow('test-window');
      expect(result).toBe(true);
      expect(mockWindow.restore).toHaveBeenCalled();
      expect(mockWindow.focus).toHaveBeenCalled();
    });

    it('should close a window', async () => {
      const result = await windowManager.closeWindow('test-window');
      expect(result).toBe(true);
      expect(mockWindow.close).toHaveBeenCalled();
    });
  });

  describe('Multi-Window Communication', () => {
    const config1: WindowConfig = {
      id: 'window-1',
      width: 800,
      height: 600,
      minWidth: 400,
      minHeight: 300,
    };

    const config2: WindowConfig = {
      id: 'window-2',
      width: 800,
      height: 600,
      minWidth: 400,
      minHeight: 300,
    };

    let mockWindow1: any;
    let mockWindow2: any;

    beforeEach(async () => {
      // Create first window
      mockWindow1 = { ...mockWindow };
      (
        BrowserWindow as jest.MockedClass<typeof BrowserWindow>
      ).mockImplementationOnce(() => mockWindow1);
      await windowManager.createWindow(config1);

      // Create second window
      mockWindow2 = { ...mockWindow };
      (
        BrowserWindow as jest.MockedClass<typeof BrowserWindow>
      ).mockImplementationOnce(() => mockWindow2);
      await windowManager.createWindow(config2);
    });

    it('should send message between specific windows', () => {
      const result = windowManager.sendWindowToWindow(
        'window-1',
        'window-2',
        'test-channel',
        { data: 'test' },
      );

      expect(result).toBe(true);
      expect(mockWindow2.webContents.send).toHaveBeenCalledWith(
        'test-channel',
        {
          fromWindowId: 'window-1',
          toWindowId: 'window-2',
          message: { data: 'test' },
          timestamp: expect.any(Number),
        },
      );
    });

    it('should fail to send message if source window does not exist', () => {
      const result = windowManager.sendWindowToWindow(
        'non-existent',
        'window-2',
        'test-channel',
        { data: 'test' },
      );

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to send message between windows: non-existent -> window-2',
        'WindowManager',
      );
    });

    it('should broadcast message from one window to all others', () => {
      windowManager.broadcastFromWindow('window-1', 'broadcast-channel', {
        data: 'broadcast',
      });

      expect(mockWindow2.webContents.send).toHaveBeenCalledWith(
        'broadcast-channel',
        {
          fromWindowId: 'window-1',
          message: { data: 'broadcast' },
          timestamp: expect.any(Number),
        },
      );

      // Should not send to the source window
      expect(mockWindow1.webContents.send).not.toHaveBeenCalled();
    });

    it('should send message to all windows', () => {
      windowManager.sendToAllWindows('global-channel', { data: 'global' });

      expect(mockWindow1.webContents.send).toHaveBeenCalledWith(
        'global-channel',
        { data: 'global' },
      );
      expect(mockWindow2.webContents.send).toHaveBeenCalledWith(
        'global-channel',
        { data: 'global' },
      );
    });
  });

  describe('Window State Management', () => {
    const testConfig: WindowConfig = {
      id: 'test-window',
      width: 800,
      height: 600,
      minWidth: 400,
      minHeight: 300,
    };

    beforeEach(async () => {
      await windowManager.createWindow(testConfig);
    });

    it('should get window state', () => {
      const state = windowManager.getWindowState('test-window');

      expect(state).toEqual(
        expect.objectContaining({
          id: 'test-window',
          bounds: { x: 100, y: 100, width: 800, height: 600 },
          isMaximized: false,
          isMinimized: false,
          isFullScreen: false,
          isVisible: true,
          isFocused: false,
        }),
      );
    });

    it('should return null for non-existent window state', () => {
      const state = windowManager.getWindowState('non-existent');
      expect(state).toBeNull();
    });

    it('should get window statistics', () => {
      const stats = windowManager.getWindowStats();

      expect(stats).toEqual({
        totalWindows: 1,
        activeWindows: 1,
        focusedWindow: null,
        mainWindow: 'test-window',
        windowStates: {
          'test-window': expect.objectContaining({
            isMaximized: false,
            isMinimized: false,
            isVisible: true,
            isFocused: false,
          }),
        },
      });
    });
  });

  describe('Window Bounds Calculation', () => {
    it('should center window when center option is true', async () => {
      const config: WindowConfig = {
        id: 'centered-window',
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 300,
        center: true,
      };

      await windowManager.createWindow(config);

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          x: 560, // (1920 - 800) / 2
          y: 240, // (1080 - 600) / 2
        }),
      );
    });

    it('should use provided coordinates when specified', async () => {
      const config: WindowConfig = {
        id: 'positioned-window',
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 300,
        x: 200,
        y: 150,
      };

      await windowManager.createWindow(config);

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          x: 200,
          y: 150,
        }),
      );
    });

    it('should constrain window to screen bounds', async () => {
      const config: WindowConfig = {
        id: 'large-window',
        width: 2500, // Larger than screen
        height: 1500, // Larger than screen
        minWidth: 400,
        minHeight: 300,
        x: -100, // Negative position
        y: -50,
      };

      await windowManager.createWindow(config);

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1920, // Constrained to screen width
          height: 1080, // Constrained to screen height
          x: 0, // Constrained to positive
          y: 0, // Constrained to positive
        }),
      );
    });
  });

  describe('Shutdown and Cleanup', () => {
    const testConfig: WindowConfig = {
      id: 'test-window',
      width: 800,
      height: 600,
      minWidth: 400,
      minHeight: 300,
    };

    beforeEach(async () => {
      await windowManager.createWindow(testConfig);
    });

    it('should close all windows during shutdown', async () => {
      await windowManager.shutdown();

      expect(mockWindow.close).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Closing all windows',
        'WindowManager',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Window manager shutdown complete',
        'WindowManager',
      );
    });

    it('should remove all event listeners during shutdown', async () => {
      const removeAllListenersSpy = jest.spyOn(
        windowManager,
        'removeAllListeners',
      );

      await windowManager.shutdown();

      expect(removeAllListenersSpy).toHaveBeenCalled();
    });
  });

  describe('Window ID Management', () => {
    const testConfig: WindowConfig = {
      id: 'test-window',
      width: 800,
      height: 600,
      minWidth: 400,
      minHeight: 300,
    };

    beforeEach(async () => {
      await windowManager.createWindow(testConfig);
    });

    it('should get window ID by BrowserWindow instance', () => {
      const windowId = windowManager.getWindowIdByWindow(mockWindow);
      expect(windowId).toBe('test-window');
    });

    it('should return null for unknown BrowserWindow instance', () => {
      const unknownWindow = { ...mockWindow };
      const windowId = windowManager.getWindowIdByWindow(unknownWindow);
      expect(windowId).toBeNull();
    });

    it('should get all window IDs', () => {
      const windowIds = windowManager.getAllWindowIds();
      expect(windowIds).toEqual(['test-window']);
    });
  });
});
