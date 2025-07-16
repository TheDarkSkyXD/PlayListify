/**
 * Dependency Manager Service Tests
 * Tests for managing external dependencies (yt-dlp and FFmpeg)
 */

import { DependencyManagerService } from '../../src/backend/services/dependency-manager-service';
import { LoggerService } from '../../src/backend/services/logger-service';
import { createServiceTestEnvironment, MockLogger } from '../utils/service-test-utils';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock Electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name: string) => {
      const paths: Record<string, string> = {
        userData: '/mock/userData',
        downloads: '/mock/downloads',
        temp: '/mock/temp',
      };
      return paths[name] || '/mock/path';
    }),
  },
}));

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
  spawn: jest.fn(),
}));

// Mock fs-extra
jest.mock('fs-extra');

// Mock https for downloads
jest.mock('https', () => ({
  get: jest.fn(),
}));

describe('DependencyManagerService', () => {
  let dependencyManager: DependencyManagerService;
  let mockLogger: MockLogger;
  let testEnv: ReturnType<typeof createServiceTestEnvironment>;

  beforeEach(async () => {
    testEnv = createServiceTestEnvironment();
    await testEnv.setup();
    
    mockLogger = new MockLogger();
    dependencyManager = new DependencyManagerService(mockLogger as unknown as LoggerService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  describe('Dependency Status Checking', () => {
    it('should check if dependencies are installed', async () => {
      // Mock fs.pathExists to return true for both dependencies
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      
      // Mock exec to return version information
      const { exec } = require('child_process');
      exec.mockImplementation((command: string, callback: Function) => {
        if (command.includes('yt-dlp')) {
          callback(null, '2023.01.06', '');
        } else if (command.includes('ffmpeg')) {
          callback(null, 'ffmpeg version 4.4.0', '');
        } else {
          callback(new Error('Command not found'), '', '');
        }
      });

      const status = await dependencyManager.checkDependencies();

      expect(status.ytdlp.installed).toBe(true);
      expect(status.ytdlp.version).toBe('2023.01.06');
      expect(status.ffmpeg.installed).toBe(true);
      expect(status.ffmpeg.version).toBe('4.4.0');
    });

    it('should detect missing dependencies', async () => {
      // Mock fs.pathExists to return false
      (fs.pathExists as jest.Mock).mockResolvedValue(false);

      const status = await dependencyManager.checkDependencies();

      expect(status.ytdlp.installed).toBe(false);
      expect(status.ytdlp.version).toBeUndefined();
      expect(status.ffmpeg.installed).toBe(false);
      expect(status.ffmpeg.version).toBeUndefined();
    });

    it('should handle version check errors gracefully', async () => {
      // Mock fs.pathExists to return true
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      
      // Mock exec to return errors
      const { exec } = require('child_process');
      exec.mockImplementation((command: string, callback: Function) => {
        callback(new Error('Command failed'), '', 'Error output');
      });

      const status = await dependencyManager.checkDependencies();

      expect(status.ytdlp.installed).toBe(false);
      expect(status.ffmpeg.installed).toBe(false);
      expect(mockLogger.hasLog('Failed to get version')).toBe(true);
    });
  });

  describe('Dependency Installation', () => {
    it('should install yt-dlp successfully', async () => {
      // Mock successful download and installation
      (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.chmod as jest.Mock).mockResolvedValue(undefined);

      // Mock https.get for download
      const https = require('https');
      const mockResponse = {
        statusCode: 200,
        pipe: jest.fn().mockReturnValue({
          on: jest.fn().mockImplementation((event, callback) => {
            if (event === 'finish') {
              setTimeout(callback, 10);
            }
          }),
        }),
      };
      https.get.mockImplementation((url: string, callback: Function) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      await dependencyManager.installDependency('ytdlp');

      expect(fs.ensureDir).toHaveBeenCalled();
      expect(mockLogger.hasLog('Installing yt-dlp')).toBe(true);
      expect(mockLogger.hasLog('yt-dlp installed successfully')).toBe(true);
    });

    it('should install ffmpeg successfully', async () => {
      // Mock successful installation
      (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.chmod as jest.Mock).mockResolvedValue(undefined);

      // Mock download
      const https = require('https');
      const mockResponse = {
        statusCode: 200,
        pipe: jest.fn().mockReturnValue({
          on: jest.fn().mockImplementation((event, callback) => {
            if (event === 'finish') {
              setTimeout(callback, 10);
            }
          }),
        }),
      };
      https.get.mockImplementation((url: string, callback: Function) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      await dependencyManager.installDependency('ffmpeg');

      expect(fs.ensureDir).toHaveBeenCalled();
      expect(mockLogger.hasLog('Installing FFmpeg')).toBe(true);
      expect(mockLogger.hasLog('FFmpeg installed successfully')).toBe(true);
    });

    it('should handle download failures', async () => {
      // Mock download failure
      const https = require('https');
      https.get.mockImplementation((url: string, callback: Function) => {
        const mockRequest = { on: jest.fn() };
        mockRequest.on.mockImplementation((event: string, handler: Function) => {
          if (event === 'error') {
            setTimeout(() => handler(new Error('Download failed')), 10);
          }
        });
        return mockRequest;
      });

      await expect(dependencyManager.installDependency('ytdlp')).rejects.toThrow();
      expect(mockLogger.hasLog('Failed to install yt-dlp')).toBe(true);
    });

    it('should handle unsupported dependencies', async () => {
      await expect(dependencyManager.installDependency('unsupported' as any)).rejects.toThrow();
      expect(mockLogger.hasLog('Unsupported dependency')).toBe(true);
    });
  });

  describe('Dependency Path Resolution', () => {
    it('should return correct paths for dependencies', () => {
      const ytdlpPath = dependencyManager.getDependencyPath('ytdlp');
      const ffmpegPath = dependencyManager.getDependencyPath('ffmpeg');

      expect(ytdlpPath).toContain('yt-dlp');
      expect(ffmpegPath).toContain('ffmpeg');
      expect(path.isAbsolute(ytdlpPath)).toBe(true);
      expect(path.isAbsolute(ffmpegPath)).toBe(true);
    });

    it('should handle platform-specific paths', () => {
      const originalPlatform = process.platform;
      
      // Test Windows paths
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const windowsPath = dependencyManager.getDependencyPath('ytdlp');
      expect(windowsPath).toContain('.exe');

      // Test Unix paths
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const linuxPath = dependencyManager.getDependencyPath('ytdlp');
      expect(linuxPath).not.toContain('.exe');

      // Restore original platform
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('Dependency Validation', () => {
    it('should validate working dependencies', async () => {
      // Mock successful validation
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      const { exec } = require('child_process');
      exec.mockImplementation((command: string, callback: Function) => {
        callback(null, 'version info', '');
      });

      const isValid = await dependencyManager.validateDependency('ytdlp');
      expect(isValid).toBe(true);
    });

    it('should detect invalid dependencies', async () => {
      // Mock file exists but command fails
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      const { exec } = require('child_process');
      exec.mockImplementation((command: string, callback: Function) => {
        callback(new Error('Command failed'), '', 'Error');
      });

      const isValid = await dependencyManager.validateDependency('ytdlp');
      expect(isValid).toBe(false);
    });

    it('should handle missing dependency files', async () => {
      // Mock file doesn't exist
      (fs.pathExists as jest.Mock).mockResolvedValue(false);

      const isValid = await dependencyManager.validateDependency('ytdlp');
      expect(isValid).toBe(false);
    });
  });

  describe('Dependency Cleanup', () => {
    it('should clean up dependencies', async () => {
      (fs.remove as jest.Mock).mockResolvedValue(undefined);

      await dependencyManager.cleanupDependencies();

      expect(fs.remove).toHaveBeenCalled();
      expect(mockLogger.hasLog('Cleaning up dependencies')).toBe(true);
    });

    it('should handle cleanup errors gracefully', async () => {
      (fs.remove as jest.Mock).mockRejectedValue(new Error('Cleanup failed'));

      await dependencyManager.cleanupDependencies();

      expect(mockLogger.hasLog('Failed to cleanup dependencies')).toBe(true);
    });
  });

  describe('Auto-Installation', () => {
    it('should auto-install missing dependencies on startup', async () => {
      // Mock missing dependencies
      (fs.pathExists as jest.Mock).mockResolvedValue(false);
      
      // Mock successful installation
      (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.chmod as jest.Mock).mockResolvedValue(undefined);

      // Mock download
      const https = require('https');
      const mockResponse = {
        statusCode: 200,
        pipe: jest.fn().mockReturnValue({
          on: jest.fn().mockImplementation((event, callback) => {
            if (event === 'finish') {
              setTimeout(callback, 10);
            }
          }),
        }),
      };
      https.get.mockImplementation((url: string, callback: Function) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      await dependencyManager.ensureDependencies();

      expect(mockLogger.hasLog('Installing yt-dlp')).toBe(true);
      expect(mockLogger.hasLog('Installing FFmpeg')).toBe(true);
    });

    it('should skip installation if dependencies exist', async () => {
      // Mock existing dependencies
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      const { exec } = require('child_process');
      exec.mockImplementation((command: string, callback: Function) => {
        callback(null, 'version info', '');
      });

      await dependencyManager.ensureDependencies();

      expect(mockLogger.hasLog('All dependencies are already installed')).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    it('should emit progress events during installation', async () => {
      const progressListener = jest.fn();
      dependencyManager.on('installProgress', progressListener);

      // Mock installation with progress
      (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.chmod as jest.Mock).mockResolvedValue(undefined);

      const https = require('https');
      const mockResponse = {
        statusCode: 200,
        pipe: jest.fn().mockReturnValue({
          on: jest.fn().mockImplementation((event, callback) => {
            if (event === 'finish') {
              setTimeout(callback, 10);
            }
          }),
        }),
      };
      https.get.mockImplementation((url: string, callback: Function) => {
        callback(mockResponse);
        return { on: jest.fn() };
      });

      await dependencyManager.installDependency('ytdlp');

      expect(progressListener).toHaveBeenCalledWith(
        expect.objectContaining({
          dependency: 'ytdlp',
          stage: expect.any(String),
          progress: expect.any(Number),
        })
      );
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed installations', async () => {
      let attemptCount = 0;
      const https = require('https');
      
      https.get.mockImplementation((url: string, callback: Function) => {
        attemptCount++;
        if (attemptCount < 3) {
          const mockRequest = { on: jest.fn() };
          mockRequest.on.mockImplementation((event: string, handler: Function) => {
            if (event === 'error') {
              setTimeout(() => handler(new Error('Download failed')), 10);
            }
          });
          return mockRequest;
        } else {
          // Success on third attempt
          const mockResponse = {
            statusCode: 200,
            pipe: jest.fn().mockReturnValue({
              on: jest.fn().mockImplementation((event, callback) => {
                if (event === 'finish') {
                  setTimeout(callback, 10);
                }
              }),
            }),
          };
          callback(mockResponse);
          return { on: jest.fn() };
        }
      });

      (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.chmod as jest.Mock).mockResolvedValue(undefined);

      await dependencyManager.installDependency('ytdlp');

      expect(attemptCount).toBe(3);
      expect(mockLogger.hasLog('Retrying installation')).toBe(true);
    });
  });
});

describe('DependencyManagerService Integration', () => {
  let dependencyManager: DependencyManagerService;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    dependencyManager = new DependencyManagerService(mockLogger as unknown as LoggerService);
    jest.clearAllMocks();
  });

  it('should handle complete dependency lifecycle', async () => {
    // Initial check - no dependencies
    (fs.pathExists as jest.Mock).mockResolvedValue(false);
    
    let status = await dependencyManager.checkDependencies();
    expect(status.ytdlp.installed).toBe(false);
    expect(status.ffmpeg.installed).toBe(false);

    // Mock successful installation
    (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.chmod as jest.Mock).mockResolvedValue(undefined);

    const https = require('https');
    const mockResponse = {
      statusCode: 200,
      pipe: jest.fn().mockReturnValue({
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'finish') {
            setTimeout(callback, 10);
          }
        }),
      }),
    };
    https.get.mockImplementation((url: string, callback: Function) => {
      callback(mockResponse);
      return { on: jest.fn() };
    });

    // Install dependencies
    await dependencyManager.ensureDependencies();

    // Mock dependencies now exist
    (fs.pathExists as jest.Mock).mockResolvedValue(true);
    const { exec } = require('child_process');
    exec.mockImplementation((command: string, callback: Function) => {
      if (command.includes('yt-dlp')) {
        callback(null, '2023.01.06', '');
      } else if (command.includes('ffmpeg')) {
        callback(null, 'ffmpeg version 4.4.0', '');
      }
    });

    // Check status again
    status = await dependencyManager.checkDependencies();
    expect(status.ytdlp.installed).toBe(true);
    expect(status.ffmpeg.installed).toBe(true);

    // Validate dependencies
    const ytdlpValid = await dependencyManager.validateDependency('ytdlp');
    const ffmpegValid = await dependencyManager.validateDependency('ffmpeg');
    expect(ytdlpValid).toBe(true);
    expect(ffmpegValid).toBe(true);

    // Cleanup
    (fs.remove as jest.Mock).mockResolvedValue(undefined);
    await dependencyManager.cleanupDependencies();

    expect(mockLogger.hasLog('Installing yt-dlp')).toBe(true);
    expect(mockLogger.hasLog('Installing FFmpeg')).toBe(true);
    expect(mockLogger.hasLog('Cleaning up dependencies')).toBe(true);
  });
});