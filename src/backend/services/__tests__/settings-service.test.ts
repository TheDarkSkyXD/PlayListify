import { SettingsService } from '../../src/backend/services/settingsService';
import { FileSystemService } from '../../src/backend/services/file-system-service';
import { DEFAULT_USER_SETTINGS } from '../../src/shared/types/settings-types';
import * as path from 'path';
import * as fs from 'fs-extra';

// Mock electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name: string) => {
      switch (name) {
        case 'userData':
          return '/mock/userData';
        case 'downloads':
          return '/mock/downloads';
        default:
          return '/mock/path';
      }
    }),
  },
}));

// Mock electron-store
jest.mock('electron-store');

describe('SettingsService', () => {
  let settingsService: SettingsService;
  let mockStore: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock Store implementation
    mockStore = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      store: DEFAULT_USER_SETTINGS,
      path: '/mock/config/user-settings.json',
      size: 1,
    };

    const Store = require('electron-store');
    Store.mockImplementation(() => mockStore);

    settingsService = new SettingsService();
  });

  describe('Basic Operations', () => {
    test('should get setting value', () => {
      mockStore.get.mockReturnValue('light');
      
      const theme = settingsService.get('theme');
      
      expect(theme).toBe('light');
      expect(mockStore.get).toHaveBeenCalledWith('theme');
    });

    test('should set setting value', () => {
      settingsService.set('theme', 'dark');
      
      expect(mockStore.set).toHaveBeenCalledWith('theme', 'dark');
    });

    test('should get all settings', () => {
      const allSettings = settingsService.getAll();
      
      expect(allSettings).toEqual(DEFAULT_USER_SETTINGS);
    });

    test('should reset settings', () => {
      settingsService.reset();
      
      expect(mockStore.clear).toHaveBeenCalled();
    });

    test('should check if setting exists', () => {
      mockStore.has.mockReturnValue(true);
      
      const exists = settingsService.has('theme');
      
      expect(exists).toBe(true);
      expect(mockStore.has).toHaveBeenCalledWith('theme');
    });

    test('should delete setting', () => {
      settingsService.delete('theme');
      
      expect(mockStore.delete).toHaveBeenCalledWith('theme');
    });
  });

  describe('Validation', () => {
    test('should validate valid settings', () => {
      mockStore.store = DEFAULT_USER_SETTINGS;
      
      const result = settingsService.validate();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid theme', () => {
      expect(() => {
        settingsService.set('theme', 'invalid' as any);
      }).toThrow();
    });

    test('should reject invalid video quality', () => {
      expect(() => {
        settingsService.set('videoQuality', 'invalid' as any);
      }).toThrow();
    });

    test('should reject invalid concurrent downloads', () => {
      expect(() => {
        settingsService.set('maxConcurrentDownloads', 0);
      }).toThrow();
      
      expect(() => {
        settingsService.set('maxConcurrentDownloads', 15);
      }).toThrow();
    });

    test('should reject invalid window size', () => {
      expect(() => {
        settingsService.set('windowSize', { width: 500, height: 400 });
      }).toThrow();
    });
  });

  describe('Import/Export', () => {
    test('should export settings', () => {
      const exported = settingsService.export();
      
      expect(exported).toHaveProperty('version');
      expect(exported).toHaveProperty('exportDate');
      expect(exported).toHaveProperty('settings');
      expect(exported.settings).toEqual(DEFAULT_USER_SETTINGS);
    });

    test('should import valid settings', () => {
      const importData = {
        version: '1.0.0',
        exportDate: new Date(),
        settings: {
          theme: 'dark' as const,
          language: 'es',
        },
      };

      const result = settingsService.import(importData);
      
      expect(result).toBe(true);
    });

    test('should reject invalid import data', () => {
      const invalidData = {
        version: '1.0.0',
        exportDate: new Date(),
        settings: null,
      };

      expect(() => {
        settingsService.import(invalidData as any);
      }).toThrow();
    });
  });

  describe('Initialization', () => {
    test('should initialize default directories', async () => {
      mockStore.get.mockImplementation((key: string) => {
        if (key === 'downloadLocation') return '';
        if (key === 'tempDirectory') return '';
        return DEFAULT_USER_SETTINGS[key as keyof typeof DEFAULT_USER_SETTINGS];
      });

      await settingsService.initializeDefaults();
      
      expect(mockStore.set).toHaveBeenCalledWith('downloadLocation', '/mock/downloads/Playlistify');
      expect(mockStore.set).toHaveBeenCalledWith('tempDirectory', '/mock/userData/temp');
    });
  });
});

describe('FileSystemService', () => {
  let fileSystemService: FileSystemService;
  let tempDir: string;

  beforeAll(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(__dirname, 'temp-test');
    await fs.ensureDir(tempDir);
  });

  afterAll(async () => {
    // Clean up temporary directory
    await fs.remove(tempDir);
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
    });
  });
});