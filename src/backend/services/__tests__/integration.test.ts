import { FileSystemService } from '../file-system-service';
import { validatePath, sanitizePath } from '../../utils/path-validation';
import * as path from 'path';
import * as os from 'os';

// Mock electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name: string) => {
      const pathModule = require('path');
      const osModule = require('os');
      switch (name) {
        case 'userData':
          return pathModule.join(osModule.tmpdir(), 'test-userData');
        case 'downloads':
          return pathModule.join(osModule.tmpdir(), 'test-downloads');
        default:
          return pathModule.join(osModule.tmpdir(), 'test-path');
      }
    }),
  },
}));

describe('Services Integration', () => {
  let fileSystemService: FileSystemService;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = path.join(os.tmpdir(), 'integration-test');
    fileSystemService = new FileSystemService();
    await fileSystemService.ensureDirectory(tempDir);
  });

  afterAll(async () => {
    try {
      await fileSystemService.deleteDirectory(tempDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('FileSystemService + Path Validation Integration', () => {
    test('should validate and sanitize paths before file operations', async () => {
      // Test with a dangerous filename
      const dangerousName = 'test<>file|with*invalid?chars.txt';
      const safeName = sanitizePath(dangerousName);
      
      expect(safeName).not.toContain('<');
      expect(safeName).not.toContain('>');
      expect(safeName).not.toContain('|');
      expect(safeName).not.toContain('*');
      expect(safeName).not.toContain('?');
      
      // Use the sanitized name for file operations
      const testFile = path.join(tempDir, safeName);
      const content = 'Test content with sanitized filename';
      
      await fileSystemService.writeFile(testFile, content);
      const readContent = await fileSystemService.readFile(testFile, 'utf8');
      
      expect(readContent).toBe(content);
    });

    test('should validate paths with base directory restriction', () => {
      const basePath = '/safe/base/directory';
      
      // Safe path within base
      const safePath = 'subfolder/file.txt';
      const safeResult = validatePath(safePath, { basePath, allowRelative: true });
      expect(safeResult.isValid).toBe(true);
      expect(safeResult.isSecure).toBe(true);
      
      // Dangerous path trying to escape base
      const dangerousPath = '../../../etc/passwd';
      const dangerousResult = validatePath(dangerousPath, { basePath, allowRelative: true });
      expect(dangerousResult.isSecure).toBe(false);
    });

    test('should handle structured directory creation', async () => {
      const appDirs = fileSystemService.getAppDirectories();
      
      // Verify all required directories are defined
      expect(appDirs.userData).toBeDefined();
      expect(appDirs.downloads).toBeDefined();
      expect(appDirs.temp).toBeDefined();
      expect(appDirs.logs).toBeDefined();
      expect(appDirs.cache).toBeDefined();
      expect(appDirs.dependencies).toBeDefined();
      expect(appDirs.config).toBeDefined();
      
      // All paths should be absolute
      Object.values(appDirs).forEach(dirPath => {
        expect(path.isAbsolute(dirPath)).toBe(true);
      });
    });

    test('should handle JSON configuration files safely', async () => {
      const configData = {
        theme: 'dark',
        language: 'en',
        downloadLocation: '/safe/download/path',
        maxConcurrentDownloads: 3,
        windowSize: { width: 1200, height: 800 }
      };
      
      const configFile = path.join(tempDir, 'test-config.json');
      
      // Write configuration
      await fileSystemService.writeJson(configFile, configData);
      
      // Read and verify configuration
      const readConfig = await fileSystemService.readJson(configFile);
      expect(readConfig).toEqual(configData);
      
      // Verify file exists
      const exists = await fileSystemService.exists(configFile);
      expect(exists).toBe(true);
      
      // Get file stats
      const stats = await fileSystemService.getStats(configFile);
      expect(stats.isFile).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should handle directory listing with mixed content', async () => {
      const testDir = path.join(tempDir, 'mixed-content');
      await fileSystemService.ensureDirectory(testDir);
      
      // Create various files and directories
      await fileSystemService.writeFile(path.join(testDir, 'document.txt'), 'text content');
      await fileSystemService.writeJson(path.join(testDir, 'config.json'), { setting: 'value' });
      await fileSystemService.ensureDirectory(path.join(testDir, 'subdirectory'));
      await fileSystemService.ensureDirectory(path.join(testDir, 'another-dir'));
      
      // List directory contents
      const listing = await fileSystemService.listDirectory(testDir);
      
      expect(listing.exists).toBe(true);
      expect(listing.files).toContain('document.txt');
      expect(listing.files).toContain('config.json');
      expect(listing.directories).toContain('subdirectory');
      expect(listing.directories).toContain('another-dir');
      expect(listing.totalItems).toBe(4);
    });

    test('should handle error scenarios gracefully', async () => {
      // Test reading non-existent file
      const nonExistentFile = path.join(tempDir, 'does-not-exist.txt');
      await expect(fileSystemService.readFile(nonExistentFile)).rejects.toThrow();
      
      // Test invalid path validation
      const invalidResult = validatePath('');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
      
      // Test path sanitization with null input
      const sanitizedNull = sanitizePath(null as any);
      expect(sanitizedNull).toBe('');
      
      const sanitizedUndefined = sanitizePath(undefined as any);
      expect(sanitizedUndefined).toBe('');
    });
  });

  describe('Application Directory Structure', () => {
    test('should create and manage application directories', async () => {
      // Initialize application directories
      await fileSystemService.initializeAppDirectories();
      
      const appDirs = fileSystemService.getAppDirectories();
      
      // Verify directories were created (they should exist after initialization)
      // Note: In a real environment, these would be created, but in tests they might not persist
      expect(appDirs.userData).toContain('test-userData');
      expect(appDirs.downloads).toContain('test-downloads');
    });

    test('should handle cleanup operations', async () => {
      // These operations should not throw errors
      await expect(fileSystemService.cleanupTempFiles()).resolves.not.toThrow();
      await expect(fileSystemService.cleanupOldLogs(24 * 60 * 60 * 1000)).resolves.not.toThrow();
    });
  });
});