/**
 * Unit tests for Dependency Manager Service
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { DependencyManagerService } from '../../src/backend/services/dependency-manager-service';
import {
  DependencyError,
  DependencyInstallationError,
  DependencyValidationError,
} from '../../src/shared/errors';
import * as dependencyConfig from '../../src/backend/config/dependency-config';
import * as dependencyUtils from '../../src/backend/utils/dependency-utils';

// Mock external dependencies
jest.mock('fs-extra');
jest.mock('../../src/backend/config/dependency-config');
jest.mock('../../src/backend/utils/dependency-utils');

const mockFs = fs as any;
const mockDependencyConfig = dependencyConfig as any;
const mockDependencyUtils = dependencyUtils as any;

describe('DependencyManagerService', () => {
  let dependencyManager: DependencyManagerService;
  let mockTempDir: string;
  let mockDepsDir: string;

  beforeEach(() => {
    jest.clearAllMocks();
    
    dependencyManager = new DependencyManagerService();
    mockTempDir = '/tmp/test-deps';
    mockDepsDir = '/app/dependencies';

    // Setup default mocks
    mockDependencyConfig.isPlatformSupported.mockReturnValue(true);
    mockDependencyConfig.getDependenciesDirectory.mockReturnValue(mockDepsDir);
    mockDependencyConfig.getDependencyDirectory.mockImplementation((name: string) => 
      path.join(mockDepsDir, name)
    );
    mockDependencyConfig.getDependencyExecutablePath.mockImplementation((name: string) => 
      path.join(mockDepsDir, name, 'bin', name === 'ytdlp' ? 'yt-dlp' : 'ffmpeg')
    );
    mockDependencyConfig.getDependencyConfig.mockReturnValue({
      ytdlp: {
        downloadUrl: 'https://example.com/yt-dlp',
        filename: 'yt-dlp',
        executable: 'yt-dlp',
      },
      ffmpeg: {
        downloadUrl: 'https://example.com/ffmpeg.zip',
        filename: 'ffmpeg.zip',
        executable: 'ffmpeg',
      },
    });

    mockFs.ensureDir.mockResolvedValue(undefined);
    mockFs.pathExists.mockResolvedValue(true);
    mockDependencyUtils.validateBinary.mockResolvedValue(true);
    mockDependencyUtils.getBinaryVersion.mockResolvedValue('1.0.0');
  });

  describe('initialize', () => {
    it('should initialize successfully on supported platform', async () => {
      await expect(dependencyManager.initialize()).resolves.not.toThrow();
      expect(mockDependencyConfig.isPlatformSupported).toHaveBeenCalled();
      expect(mockFs.ensureDir).toHaveBeenCalledWith(mockDepsDir);
      expect(dependencyManager.isInitialized()).toBe(true);
    });

    it('should throw error on unsupported platform', async () => {
      mockDependencyConfig.isPlatformSupported.mockReturnValue(false);
      
      await expect(dependencyManager.initialize()).rejects.toThrow(DependencyError);
      expect(dependencyManager.isInitialized()).toBe(false);
    });

    it('should handle initialization errors gracefully', async () => {
      mockFs.ensureDir.mockRejectedValue(new Error('Permission denied'));
      
      await expect(dependencyManager.initialize()).rejects.toThrow(DependencyError);
      expect(dependencyManager.isInitialized()).toBe(false);
    });
  });

  describe('checkDependencies', () => {
    beforeEach(async () => {
      await dependencyManager.initialize();
    });

    it('should return status for all dependencies when they are installed', async () => {
      const status = await dependencyManager.checkDependencies();
      
      expect(status).toEqual({
        ytdlp: {
          name: 'ytdlp',
          path: expect.stringContaining('yt-dlp'),
          installed: true,
          isValid: true,
          version: '1.0.0',
        },
        ffmpeg: {
          name: 'ffmpeg',
          path: expect.stringContaining('ffmpeg'),
          installed: true,
          isValid: true,
          version: '1.0.0',
        },
      });
    });

    it('should return error status when dependencies are not installed', async () => {
      mockDependencyUtils.validateBinary.mockResolvedValue(false);
      
      const status = await dependencyManager.checkDependencies();
      
      expect(status.ytdlp.installed).toBe(false);
      expect(status.ytdlp.isValid).toBe(false);
      expect(status.ytdlp.error).toBe('Binary not found or not executable');
    });

    it('should handle validation errors', async () => {
      mockDependencyUtils.validateBinary.mockRejectedValue(new Error('Validation failed'));
      
      const status = await dependencyManager.checkDependencies();
      
      expect(status.ytdlp.installed).toBe(false);
      expect(status.ytdlp.error).toBe('Validation failed');
    });
  });

  describe('installDependency', () => {
    beforeEach(async () => {
      await dependencyManager.initialize();
      
      // Mock successful installation flow
      mockDependencyUtils.checkUrlAccessibility.mockResolvedValue(true);
      mockDependencyUtils.downloadFile.mockResolvedValue(undefined);
      mockDependencyUtils.retryWithBackoff.mockImplementation((fn: any) => fn());
      mockDependencyUtils.extractZip.mockResolvedValue(undefined);
      mockDependencyUtils.makeExecutable.mockResolvedValue(undefined);
      mockDependencyUtils.cleanupTempFiles.mockResolvedValue(undefined);
      mockFs.copy.mockResolvedValue(undefined);
      mockFs.remove.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);
    });

    it('should install yt-dlp successfully', async () => {
      // Set up event spies before calling install
      const installStartedSpy = jest.fn();
      const installCompletedSpy = jest.fn();
      dependencyManager.on('installStarted', installStartedSpy);
      dependencyManager.on('installCompleted', installCompletedSpy);
      
      await dependencyManager.installDependency('ytdlp');
      
      expect(installStartedSpy).toHaveBeenCalledWith('ytdlp');
      expect(installCompletedSpy).toHaveBeenCalledWith('ytdlp');
      expect(mockDependencyUtils.downloadFile).toHaveBeenCalled();
    });

    it('should install ffmpeg successfully', async () => {
      // Mock finding executable in directory
      mockFs.readdir.mockResolvedValue([
        { name: 'ffmpeg', isFile: () => true, isDirectory: () => false }
      ]);
      
      await dependencyManager.installDependency('ffmpeg');
      
      expect(mockDependencyUtils.downloadFile).toHaveBeenCalled();
      expect(mockDependencyUtils.extractZip).toHaveBeenCalled();
    });

    it('should handle download URL accessibility check failure', async () => {
      mockDependencyUtils.checkUrlAccessibility.mockResolvedValue(false);
      
      await expect(dependencyManager.installDependency('ytdlp')).rejects.toThrow(DependencyInstallationError);
    });

    it('should handle download failures', async () => {
      mockDependencyUtils.downloadFile.mockRejectedValue(new Error('Download failed'));
      mockDependencyUtils.retryWithBackoff.mockRejectedValue(new Error('Download failed'));
      
      await expect(dependencyManager.installDependency('ytdlp')).rejects.toThrow(DependencyInstallationError);
    });

    it('should handle validation failures after installation', async () => {
      mockDependencyUtils.validateBinary.mockResolvedValue(false);
      
      await expect(dependencyManager.installDependency('ytdlp')).rejects.toThrow(DependencyInstallationError);
    });

    it('should clean up temp files even on failure', async () => {
      mockDependencyUtils.downloadFile.mockRejectedValue(new Error('Download failed'));
      
      try {
        await dependencyManager.installDependency('ytdlp');
      } catch {
        // Expected to fail
      }
      
      expect(mockDependencyUtils.cleanupTempFiles).toHaveBeenCalled();
    });

    it('should emit installFailed event on error', async () => {
      const installFailedSpy = jest.fn();
      dependencyManager.on('installFailed', installFailedSpy);
      
      mockDependencyUtils.downloadFile.mockRejectedValue(new Error('Download failed'));
      mockDependencyUtils.retryWithBackoff.mockRejectedValue(new Error('Download failed'));
      
      try {
        await dependencyManager.installDependency('ytdlp');
      } catch {
        // Expected to fail
      }
      
      expect(installFailedSpy).toHaveBeenCalledWith('ytdlp', expect.any(Error));
    });
  });

  describe('validateDependency', () => {
    beforeEach(async () => {
      await dependencyManager.initialize();
    });

    it('should return true for valid dependency', async () => {
      mockDependencyUtils.validateBinary.mockResolvedValue(true);
      mockDependencyUtils.getBinaryVersion.mockResolvedValue('1.0.0');
      
      const isValid = await dependencyManager.validateDependency('ytdlp');
      
      expect(isValid).toBe(true);
    });

    it('should return false for invalid binary', async () => {
      mockDependencyUtils.validateBinary.mockResolvedValue(false);
      
      const isValid = await dependencyManager.validateDependency('ytdlp');
      
      expect(isValid).toBe(false);
    });

    it('should return false when version check fails', async () => {
      mockDependencyUtils.validateBinary.mockResolvedValue(true);
      mockDependencyUtils.getBinaryVersion.mockResolvedValue(null);
      
      const isValid = await dependencyManager.validateDependency('ytdlp');
      
      expect(isValid).toBe(false);
    });

    it('should handle validation errors gracefully', async () => {
      mockDependencyUtils.validateBinary.mockRejectedValue(new Error('Validation error'));
      
      const isValid = await dependencyManager.validateDependency('ytdlp');
      
      expect(isValid).toBe(false);
    });
  });

  describe('getDependencyVersion', () => {
    beforeEach(async () => {
      await dependencyManager.initialize();
    });

    it('should return version for valid dependency', async () => {
      mockDependencyUtils.getBinaryVersion.mockResolvedValue('2.1.0');
      
      const version = await dependencyManager.getDependencyVersion('ytdlp');
      
      expect(version).toBe('2.1.0');
    });

    it('should return null for invalid dependency', async () => {
      mockDependencyUtils.getBinaryVersion.mockResolvedValue(null);
      
      const version = await dependencyManager.getDependencyVersion('ytdlp');
      
      expect(version).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockDependencyUtils.getBinaryVersion.mockRejectedValue(new Error('Version check failed'));
      
      const version = await dependencyManager.getDependencyVersion('ytdlp');
      
      expect(version).toBeNull();
    });
  });

  describe('cleanupDependencies', () => {
    beforeEach(async () => {
      await dependencyManager.initialize();
    });

    it('should clean up dependencies directory', async () => {
      await dependencyManager.cleanupDependencies();
      
      expect(mockFs.remove).toHaveBeenCalledWith(mockDepsDir);
    });

    it('should emit cleanup event', async () => {
      const cleanupSpy = jest.fn();
      dependencyManager.on('dependenciesCleanedUp', cleanupSpy);
      
      await dependencyManager.cleanupDependencies();
      
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should handle cleanup errors', async () => {
      mockFs.remove.mockRejectedValue(new Error('Cleanup failed'));
      
      await expect(dependencyManager.cleanupDependencies()).rejects.toThrow(DependencyError);
    });
  });

  describe('areAllDependenciesReady', () => {
    beforeEach(async () => {
      await dependencyManager.initialize();
    });

    it('should return true when all dependencies are ready', async () => {
      await dependencyManager.checkDependencies();
      
      const allReady = dependencyManager.areAllDependenciesReady();
      
      expect(allReady).toBe(true);
    });

    it('should return false when dependencies are not ready', async () => {
      mockDependencyUtils.validateBinary.mockResolvedValue(false);
      await dependencyManager.checkDependencies();
      
      const allReady = dependencyManager.areAllDependenciesReady();
      
      expect(allReady).toBe(false);
    });

    it('should return false when status is not available', () => {
      // Create a new dependency manager without initializing or checking dependencies
      const newDependencyManager = new DependencyManagerService();
      const allReady = newDependencyManager.areAllDependenciesReady();
      
      expect(allReady).toBe(false);
    });
  });

  describe('getDependencyPath', () => {
    it('should return correct path for dependency', () => {
      const path = dependencyManager.getDependencyPath('ytdlp');
      
      expect(path).toBe(mockDependencyConfig.getDependencyExecutablePath('ytdlp'));
    });
  });

  describe('getDependencyStatus', () => {
    it('should return cached status', async () => {
      await dependencyManager.initialize();
      await dependencyManager.checkDependencies();
      
      const status = dependencyManager.getDependencyStatus();
      
      expect(status).toBeTruthy();
      expect(status?.ytdlp).toBeDefined();
      expect(status?.ffmpeg).toBeDefined();
    });

    it('should return null when no status is cached', () => {
      const status = dependencyManager.getDependencyStatus();
      
      expect(status).toBeNull();
    });
  });
});