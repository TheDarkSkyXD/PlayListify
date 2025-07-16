import * as path from 'path';
import * as fs from 'fs-extra';
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

import { FileSystemService } from '../file-system-service';

describe('FileSystemService', () => {
  let fileSystemService: FileSystemService;
  let tempDir: string;

  beforeAll(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(os.tmpdir(), 'fs-service-test');
    await fs.ensureDir(tempDir);
  });

  afterAll(async () => {
    // Clean up temporary directory
    try {
      await fs.remove(tempDir);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    fileSystemService = new FileSystemService();
  });

  describe('Path Validation', () => {
    test('should validate safe paths', () => {
      const result = fileSystemService.validatePath('/safe/path/file.txt');
      
      expect(result.isValid).toBe(true);
      expect(result.isSecure).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject dangerous paths', () => {
      const result = fileSystemService.validatePath('../../../etc/passwd');
      
      expect(result.isSecure).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should sanitize paths', () => {
      const dangerous = 'file<>name|with*invalid?chars';
      const sanitized = fileSystemService.sanitizePath(dangerous);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('|');
      expect(sanitized).not.toContain('*');
      expect(sanitized).not.toContain('?');
    });

    test('should handle empty paths', () => {
      const result = fileSystemService.validatePath('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Path must be a non-empty string');
    });

    test('should handle null/undefined paths', () => {
      const result1 = fileSystemService.validatePath(null as any);
      const result2 = fileSystemService.validatePath(undefined as any);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
    });
  });

  describe('File Operations', () => {
    test('should check file existence', async () => {
      const testFile = path.join(tempDir, 'test-exists.txt');
      await fs.writeFile(testFile, 'test content');
      
      const exists = await fileSystemService.exists(testFile);
      const notExists = await fileSystemService.exists(path.join(tempDir, 'nonexistent.txt'));
      
      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    test('should read and write files', async () => {
      const testFile = path.join(tempDir, 'test-readwrite.txt');
      const content = 'Hello, World!';
      
      await fileSystemService.writeFile(testFile, content);
      const readContent = await fileSystemService.readFile(testFile, 'utf8');
      
      expect(readContent).toBe(content);
    });

    test('should handle JSON files', async () => {
      const testFile = path.join(tempDir, 'test.json');
      const data = { name: 'test', value: 42 };
      
      await fileSystemService.writeJson(testFile, data);
      const readData = await fileSystemService.readJson(testFile);
      
      expect(readData).toEqual(data);
    });

    test('should copy files', async () => {
      const sourceFile = path.join(tempDir, 'source.txt');
      const destFile = path.join(tempDir, 'destination.txt');
      const content = 'Copy test content';
      
      await fileSystemService.writeFile(sourceFile, content);
      await fileSystemService.copyFile(sourceFile, destFile);
      
      const copiedContent = await fileSystemService.readFile(destFile, 'utf8');
      expect(copiedContent).toBe(content);
    });

    test('should move files', async () => {
      const sourceFile = path.join(tempDir, 'move-source.txt');
      const destFile = path.join(tempDir, 'move-dest.txt');
      const content = 'Move test content';
      
      await fileSystemService.writeFile(sourceFile, content);
      await fileSystemService.moveFile(sourceFile, destFile);
      
      const sourceExists = await fileSystemService.exists(sourceFile);
      const destExists = await fileSystemService.exists(destFile);
      const movedContent = await fileSystemService.readFile(destFile, 'utf8');
      
      expect(sourceExists).toBe(false);
      expect(destExists).toBe(true);
      expect(movedContent).toBe(content);
    });

    test('should delete files', async () => {
      const testFile = path.join(tempDir, 'delete-test.txt');
      
      await fileSystemService.writeFile(testFile, 'Delete me');
      await fileSystemService.deleteFile(testFile);
      
      const exists = await fileSystemService.exists(testFile);
      expect(exists).toBe(false);
    });

    test('should handle file errors gracefully', async () => {
      const invalidPath = '/invalid/path/that/does/not/exist/file.txt';
      
      await expect(fileSystemService.readFile(invalidPath)).rejects.toThrow();
    });
  });

  describe('Directory Operations', () => {
    test('should ensure directories exist', async () => {
      const testDir = path.join(tempDir, 'nested', 'directory', 'structure');
      
      await fileSystemService.ensureDirectory(testDir);
      
      const exists = await fileSystemService.exists(testDir);
      expect(exists).toBe(true);
    });

    test('should list directory contents', async () => {
      const testDir = path.join(tempDir, 'list-test');
      await fileSystemService.ensureDirectory(testDir);
      
      // Create test files and directories
      await fileSystemService.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fileSystemService.writeFile(path.join(testDir, 'file2.txt'), 'content2');
      await fileSystemService.ensureDirectory(path.join(testDir, 'subdir1'));
      await fileSystemService.ensureDirectory(path.join(testDir, 'subdir2'));
      
      const listing = await fileSystemService.listDirectory(testDir);
      
      expect(listing.exists).toBe(true);
      expect(listing.files).toContain('file1.txt');
      expect(listing.files).toContain('file2.txt');
      expect(listing.directories).toContain('subdir1');
      expect(listing.directories).toContain('subdir2');
      expect(listing.totalItems).toBe(4);
    });

    test('should handle non-existent directories', async () => {
      const nonExistentDir = path.join(tempDir, 'does-not-exist');
      
      const listing = await fileSystemService.listDirectory(nonExistentDir);
      
      expect(listing.exists).toBe(false);
      expect(listing.files).toHaveLength(0);
      expect(listing.directories).toHaveLength(0);
      expect(listing.totalItems).toBe(0);
    });

    test('should get file stats', async () => {
      const testFile = path.join(tempDir, 'stats-test.txt');
      const content = 'Stats test content';
      
      await fileSystemService.writeFile(testFile, content);
      const stats = await fileSystemService.getStats(testFile);
      
      expect(stats.isFile).toBe(true);
      expect(stats.isDirectory).toBe(false);
      expect(stats.size).toBe(content.length);
      expect(stats.createdAt).toBeInstanceOf(Date);
      expect(stats.modifiedAt).toBeInstanceOf(Date);
    });

    test('should get directory stats', async () => {
      const testDir = path.join(tempDir, 'stats-dir-test');
      await fileSystemService.ensureDirectory(testDir);
      
      const stats = await fileSystemService.getStats(testDir);
      
      expect(stats.isFile).toBe(false);
      expect(stats.isDirectory).toBe(true);
      expect(stats.createdAt).toBeInstanceOf(Date);
      expect(stats.modifiedAt).toBeInstanceOf(Date);
    });
  });

  describe('Application Directories', () => {
    test('should provide app directories structure', () => {
      const dirs = fileSystemService.getAppDirectories();
      
      expect(dirs).toHaveProperty('userData');
      expect(dirs).toHaveProperty('downloads');
      expect(dirs).toHaveProperty('temp');
      expect(dirs).toHaveProperty('logs');
      expect(dirs).toHaveProperty('cache');
      expect(dirs).toHaveProperty('dependencies');
      expect(dirs).toHaveProperty('config');
      
      // Check that paths are absolute
      expect(path.isAbsolute(dirs.userData)).toBe(true);
      expect(path.isAbsolute(dirs.downloads)).toBe(true);
      expect(path.isAbsolute(dirs.temp)).toBe(true);
    });

    test('should initialize app directories', async () => {
      // This test would create actual directories, so we'll just verify it doesn't throw
      await expect(fileSystemService.initializeAppDirectories()).resolves.not.toThrow();
    });
  });

  describe('Path Resolution', () => {
    test('should resolve paths safely', () => {
      const resolved = fileSystemService.resolvePath('/base', 'relative', 'path');
      
      expect(path.isAbsolute(resolved)).toBe(true);
      expect(resolved).toContain('base');
      expect(resolved).toContain('relative');
      expect(resolved).toContain('path');
    });

    test('should handle path resolution errors', () => {
      // Test with invalid path components
      expect(() => {
        fileSystemService.resolvePath('', null as any, undefined as any);
      }).toThrow();
    });
  });

  describe('Cleanup Operations', () => {
    test('should cleanup temp files without throwing', async () => {
      // This should not throw even if temp directory doesn't exist
      await expect(fileSystemService.cleanupTempFiles()).resolves.not.toThrow();
    });

    test('should cleanup old logs without throwing', async () => {
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      // This should not throw even if logs directory doesn't exist
      await expect(fileSystemService.cleanupOldLogs(maxAge)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should throw FileSystemError for invalid operations', async () => {
      const invalidPath = '\0invalid\0path';
      
      await expect(fileSystemService.readFile(invalidPath)).rejects.toThrow('FileSystemError');
    });

    test('should handle permission errors gracefully', async () => {
      // Try to write to a path that should fail
      const restrictedPath = path.join('/', 'root', 'restricted-file.txt');
      
      await expect(fileSystemService.writeFile(restrictedPath, 'content')).rejects.toThrow();
    });
  });
});