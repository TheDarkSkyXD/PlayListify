/**
 * Integration tests for Dependency IPC Handlers
 */

import { ipcMain, BrowserWindow } from 'electron';
import { initializeDependencyHandlers, cleanupDependencyHandlers, getDependencyManager } from '../../src/backend/handlers/dependency-handlers';
import { DependencyManagerService } from '../../src/backend/services/dependency-manager-service';

// Mock Electron modules
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    removeHandler: jest.fn(),
  },
  BrowserWindow: {
    getAllWindows: jest.fn(() => []),
  },
}));

// Mock DependencyManagerService
jest.mock('../../src/backend/services/dependency-manager-service');

const mockIpcMain = ipcMain as jest.Mocked<typeof ipcMain>;
const mockBrowserWindow = BrowserWindow as jest.Mocked<typeof BrowserWindow>;
const MockDependencyManagerService = DependencyManagerService as jest.MockedClass<typeof DependencyManagerService>;

describe('Dependency IPC Handlers', () => {
  let mockDependencyManager: jest.Mocked<DependencyManagerService>;
  let mockWindow: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock window
    mockWindow = {
      isDestroyed: jest.fn(() => false),
      webContents: {
        send: jest.fn(),
      },
    };
    
    mockBrowserWindow.getAllWindows.mockReturnValue([mockWindow]);
    
    // Create mock dependency manager
    mockDependencyManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      checkDependencies: jest.fn().mockResolvedValue({
        ytdlp: { name: 'ytdlp', path: '/path/to/ytdlp', installed: true, isValid: true, version: '1.0.0' },
        ffmpeg: { name: 'ffmpeg', path: '/path/to/ffmpeg', installed: true, isValid: true, version: '4.4.0' },
      }),
      getDependencyStatus: jest.fn().mockReturnValue(null),
      installDependency: jest.fn().mockResolvedValue(undefined),
      validateDependency: jest.fn().mockResolvedValue(true),
      getDependencyVersion: jest.fn().mockResolvedValue('1.0.0'),
      getDependencyPath: jest.fn().mockReturnValue('/path/to/binary'),
      cleanupDependencies: jest.fn().mockResolvedValue(undefined),
      areAllDependenciesReady: jest.fn().mockReturnValue(true),
      isInitialized: jest.fn().mockReturnValue(true),
      removeAllListeners: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
    } as any;
    
    MockDependencyManagerService.mockImplementation(() => mockDependencyManager);
  });

  afterEach(() => {
    cleanupDependencyHandlers();
  });

  describe('initializeDependencyHandlers', () => {
    it('should initialize dependency manager and register handlers', () => {
      initializeDependencyHandlers();
      
      expect(MockDependencyManagerService).toHaveBeenCalled();
      expect(mockDependencyManager.initialize).toHaveBeenCalled();
      
      // Verify all handlers are registered
      const expectedHandlers = [
        'dependency:checkStatus',
        'dependency:getStatus',
        'dependency:install',
        'dependency:validate',
        'dependency:getVersion',
        'dependency:getPath',
        'dependency:cleanup',
        'dependency:areAllReady',
        'dependency:isInitialized',
      ];
      
      expectedHandlers.forEach(handler => {
        expect(mockIpcMain.handle).toHaveBeenCalledWith(handler, expect.any(Function));
      });
    });

    it('should set up event listeners for dependency manager events', () => {
      initializeDependencyHandlers();
      
      const expectedEvents = [
        'statusUpdated',
        'downloadProgress',
        'installStarted',
        'installCompleted',
        'installFailed',
        'dependenciesCleanedUp',
      ];
      
      expectedEvents.forEach(event => {
        expect(mockDependencyManager.on).toHaveBeenCalledWith(event, expect.any(Function));
      });
    });
  });

  describe('IPC Handler Functions', () => {
    let handlers: { [key: string]: Function };

    beforeEach(() => {
      handlers = {};
      
      // Capture handler functions
      mockIpcMain.handle.mockImplementation((channel, handler) => {
        handlers[channel] = handler;
      });
      
      initializeDependencyHandlers();
    });

    describe('dependency:checkStatus', () => {
      it('should call checkDependencies and return status', async () => {
        const mockStatus = {
          ytdlp: { name: 'ytdlp', path: '/path/to/ytdlp', installed: true, isValid: true, version: '1.0.0' },
          ffmpeg: { name: 'ffmpeg', path: '/path/to/ffmpeg', installed: true, isValid: true, version: '4.4.0' },
        };
        mockDependencyManager.checkDependencies.mockResolvedValue(mockStatus);
        
        const result = await handlers['dependency:checkStatus']();
        
        expect(mockDependencyManager.checkDependencies).toHaveBeenCalled();
        expect(result).toEqual(mockStatus);
      });

      it('should handle errors gracefully', async () => {
        mockDependencyManager.checkDependencies.mockRejectedValue(new Error('Check failed'));
        
        await expect(handlers['dependency:checkStatus']()).rejects.toThrow('Check failed');
      });
    });

    describe('dependency:install', () => {
      it('should install ytdlp dependency', async () => {
        const result = await handlers['dependency:install'](null, 'ytdlp');
        
        expect(mockDependencyManager.installDependency).toHaveBeenCalledWith('ytdlp');
        expect(result).toEqual({ success: true });
      });

      it('should install ffmpeg dependency', async () => {
        const result = await handlers['dependency:install'](null, 'ffmpeg');
        
        expect(mockDependencyManager.installDependency).toHaveBeenCalledWith('ffmpeg');
        expect(result).toEqual({ success: true });
      });

      it('should reject invalid dependency names', async () => {
        await expect(handlers['dependency:install'](null, 'invalid')).rejects.toThrow('Invalid dependency name: invalid');
      });

      it('should handle installation errors', async () => {
        mockDependencyManager.installDependency.mockRejectedValue(new Error('Install failed'));
        
        await expect(handlers['dependency:install'](null, 'ytdlp')).rejects.toThrow('Install failed');
      });
    });

    describe('dependency:validate', () => {
      it('should validate dependency', async () => {
        mockDependencyManager.validateDependency.mockResolvedValue(true);
        
        const result = await handlers['dependency:validate'](null, 'ytdlp');
        
        expect(mockDependencyManager.validateDependency).toHaveBeenCalledWith('ytdlp');
        expect(result).toBe(true);
      });

      it('should reject invalid dependency names', async () => {
        await expect(handlers['dependency:validate'](null, 'invalid')).rejects.toThrow('Invalid dependency name: invalid');
      });
    });

    describe('dependency:getVersion', () => {
      it('should get dependency version', async () => {
        mockDependencyManager.getDependencyVersion.mockResolvedValue('2.1.0');
        
        const result = await handlers['dependency:getVersion'](null, 'ytdlp');
        
        expect(mockDependencyManager.getDependencyVersion).toHaveBeenCalledWith('ytdlp');
        expect(result).toBe('2.1.0');
      });

      it('should reject invalid dependency names', async () => {
        await expect(handlers['dependency:getVersion'](null, 'invalid')).rejects.toThrow('Invalid dependency name: invalid');
      });
    });

    describe('dependency:getPath', () => {
      it('should get dependency path', () => {
        mockDependencyManager.getDependencyPath.mockReturnValue('/path/to/ytdlp');
        
        const result = handlers['dependency:getPath'](null, 'ytdlp');
        
        expect(mockDependencyManager.getDependencyPath).toHaveBeenCalledWith('ytdlp');
        expect(result).toBe('/path/to/ytdlp');
      });

      it('should reject invalid dependency names', () => {
        expect(() => handlers['dependency:getPath'](null, 'invalid')).toThrow('Invalid dependency name: invalid');
      });
    });

    describe('dependency:cleanup', () => {
      it('should cleanup dependencies', async () => {
        const result = await handlers['dependency:cleanup']();
        
        expect(mockDependencyManager.cleanupDependencies).toHaveBeenCalled();
        expect(result).toEqual({ success: true });
      });

      it('should handle cleanup errors', async () => {
        mockDependencyManager.cleanupDependencies.mockRejectedValue(new Error('Cleanup failed'));
        
        await expect(handlers['dependency:cleanup']()).rejects.toThrow('Cleanup failed');
      });
    });

    describe('dependency:areAllReady', () => {
      it('should check if all dependencies are ready', () => {
        mockDependencyManager.areAllDependenciesReady.mockReturnValue(true);
        
        const result = handlers['dependency:areAllReady']();
        
        expect(mockDependencyManager.areAllDependenciesReady).toHaveBeenCalled();
        expect(result).toBe(true);
      });
    });

    describe('dependency:isInitialized', () => {
      it('should check if dependency manager is initialized', () => {
        mockDependencyManager.isInitialized.mockReturnValue(true);
        
        const result = handlers['dependency:isInitialized']();
        
        expect(mockDependencyManager.isInitialized).toHaveBeenCalled();
        expect(result).toBe(true);
      });
    });
  });

  describe('Event Broadcasting', () => {
    let eventHandlers: { [key: string]: Function };

    beforeEach(() => {
      eventHandlers = {};
      
      // Capture event handlers
      mockDependencyManager.on.mockImplementation((event: string | symbol, handler: Function) => {
        eventHandlers[event as string] = handler;
        return mockDependencyManager;
      });
      
      initializeDependencyHandlers();
    });

    it('should broadcast statusUpdated events', () => {
      const mockStatus = { ytdlp: { installed: true }, ffmpeg: { installed: true } };
      
      eventHandlers['statusUpdated'](mockStatus);
      
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('dependency:statusUpdated', mockStatus);
    });

    it('should broadcast downloadProgress events', () => {
      const mockProgress = { dependency: 'ytdlp', progress: 50, status: 'downloading' };
      
      eventHandlers['downloadProgress'](mockProgress);
      
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('dependency:downloadProgress', mockProgress);
    });

    it('should broadcast installStarted events', () => {
      eventHandlers['installStarted']('ytdlp');
      
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('dependency:installStarted', 'ytdlp');
    });

    it('should broadcast installCompleted events', () => {
      eventHandlers['installCompleted']('ytdlp');
      
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('dependency:installCompleted', 'ytdlp');
    });

    it('should broadcast installFailed events', () => {
      const mockError = new Error('Install failed');
      
      eventHandlers['installFailed']('ytdlp', mockError);
      
      expect(mockWindow.webContents.send).toHaveBeenCalledWith('dependency:installFailed', {
        dependency: 'ytdlp',
        error: 'Install failed',
      });
    });

    it('should not send to destroyed windows', () => {
      mockWindow.isDestroyed.mockReturnValue(true);
      
      eventHandlers['statusUpdated']({ test: 'data' });
      
      expect(mockWindow.webContents.send).not.toHaveBeenCalled();
    });
  });

  describe('cleanupDependencyHandlers', () => {
    it('should cleanup dependency manager and remove handlers', () => {
      initializeDependencyHandlers();
      
      cleanupDependencyHandlers();
      
      expect(mockDependencyManager.removeAllListeners).toHaveBeenCalled();
      
      const expectedHandlers = [
        'dependency:checkStatus',
        'dependency:getStatus',
        'dependency:install',
        'dependency:validate',
        'dependency:getVersion',
        'dependency:getPath',
        'dependency:cleanup',
        'dependency:areAllReady',
        'dependency:isInitialized',
      ];
      
      expectedHandlers.forEach(handler => {
        expect(mockIpcMain.removeHandler).toHaveBeenCalledWith(handler);
      });
    });
  });

  describe('getDependencyManager', () => {
    it('should return dependency manager instance after initialization', () => {
      initializeDependencyHandlers();
      
      const manager = getDependencyManager();
      
      expect(manager).toBe(mockDependencyManager);
    });

    it('should return null before initialization', () => {
      const manager = getDependencyManager();
      
      expect(manager).toBeNull();
    });
  });
});