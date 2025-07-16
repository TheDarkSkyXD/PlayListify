/**
 * Service Testing Utilities
 * 
 * Utilities for testing backend services with proper mocking and setup.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';

/**
 * Creates a temporary directory for testing file operations
 */
export async function createTempTestDirectory(prefix = 'playlistify-test-'): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), prefix));
  return tempDir;
}

/**
 * Cleans up a temporary test directory
 */
export async function cleanupTempTestDirectory(tempDir: string): Promise<void> {
  try {
    await fs.remove(tempDir);
  } catch (error) {
    // Ignore cleanup errors in tests
    console.warn(`Failed to cleanup temp directory ${tempDir}:`, error);
  }
}

/**
 * Creates a test file with specified content
 */
export async function createTestFile(filePath: string, content: string = 'test content'): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

/**
 * Creates a test JSON file with specified data
 */
export async function createTestJSONFile(filePath: string, data: any): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, data, { spaces: 2 });
}

/**
 * Mock for electron-store
 */
export class MockElectronStore {
  private data: Record<string, any> = {};
  public path: string;
  public size: number = 0;

  constructor(options: any = {}) {
    this.path = options.name ? `/mock/config/${options.name}.json` : '/mock/config/store.json';
    if (options.defaults) {
      this.data = { ...options.defaults };
    }
    this.updateSize();
  }

  get(key?: string, defaultValue?: any): any {
    if (key === undefined) {
      return this.data;
    }
    
    const keys = key.split('.');
    let value = this.data;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value !== undefined ? value : defaultValue;
  }

  set(key: string, value: any): void {
    const keys = key.split('.');
    let target = this.data;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    
    target[keys[keys.length - 1]] = value;
    this.updateSize();
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    const keys = key.split('.');
    let target = this.data;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target) || typeof target[k] !== 'object') {
        return;
      }
      target = target[k];
    }
    
    delete target[keys[keys.length - 1]];
    this.updateSize();
  }

  clear(): void {
    this.data = {};
    this.updateSize();
  }

  get store(): Record<string, any> {
    return this.data;
  }

  set store(value: Record<string, any>) {
    this.data = value;
    this.updateSize();
  }

  private updateSize(): void {
    this.size = Object.keys(this.data).length;
  }

  // Test utility methods
  reset(defaults: Record<string, any> = {}): void {
    this.data = { ...defaults };
    this.updateSize();
  }

  getData(): Record<string, any> {
    return { ...this.data };
  }
}

/**
 * Mock for winston logger
 */
export class MockLogger {
  public logs: Array<{ level: string; message: string; meta?: any }> = [];

  error(message: string, meta?: any): void {
    this.logs.push({ level: 'error', message, meta });
  }

  warn(message: string, meta?: any): void {
    this.logs.push({ level: 'warn', message, meta });
  }

  info(message: string, meta?: any): void {
    this.logs.push({ level: 'info', message, meta });
  }

  debug(message: string, meta?: any): void {
    this.logs.push({ level: 'debug', message, meta });
  }

  verbose(message: string, meta?: any): void {
    this.logs.push({ level: 'verbose', message, meta });
  }

  silly(message: string, meta?: any): void {
    this.logs.push({ level: 'silly', message, meta });
  }

  // Test utility methods
  getLogs(level?: string): Array<{ level: string; message: string; meta?: any }> {
    return level ? this.logs.filter(log => log.level === level) : this.logs;
  }

  getLastLog(level?: string): { level: string; message: string; meta?: any } | undefined {
    const logs = this.getLogs(level);
    return logs[logs.length - 1];
  }

  clearLogs(): void {
    this.logs = [];
  }

  hasLog(message: string, level?: string): boolean {
    return this.getLogs(level).some(log => log.message.includes(message));
  }
}

/**
 * Creates mock dependencies for service testing
 */
export function createServiceMocks() {
  return {
    electronStore: MockElectronStore,
    logger: new MockLogger(),
    
    // Mock fs-extra
    fs: {
      ensureDir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockResolvedValue('mock content'),
      writeJson: jest.fn().mockResolvedValue(undefined),
      readJson: jest.fn().mockResolvedValue({}),
      copy: jest.fn().mockResolvedValue(undefined),
      move: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      pathExists: jest.fn().mockResolvedValue(true),
      stat: jest.fn().mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date(),
        ctime: new Date(),
      }),
      readdir: jest.fn().mockResolvedValue(['file1.txt', 'file2.txt']),
    },

    // Mock path utilities
    path: {
      join: path.join,
      resolve: path.resolve,
      dirname: path.dirname,
      basename: path.basename,
      extname: path.extname,
    },

    // Mock child_process
    childProcess: {
      exec: jest.fn().mockImplementation((command, callback) => {
        callback(null, 'mock output', '');
      }),
      spawn: jest.fn().mockReturnValue({
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
      }),
    },
  };
}

/**
 * Helper to create a test environment for service testing
 */
export function createServiceTestEnvironment() {
  const mocks = createServiceMocks();
  let tempDir: string;

  return {
    mocks,
    
    async setup() {
      tempDir = await createTempTestDirectory();
      return tempDir;
    },

    async cleanup() {
      if (tempDir) {
        await cleanupTempTestDirectory(tempDir);
      }
      jest.clearAllMocks();
    },

    getTempDir() {
      return tempDir;
    },
  };
}

/**
 * Helper to wait for async operations in tests
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper to wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await waitFor(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Helper to create mock settings data
 */
export function createMockSettings(overrides: Record<string, any> = {}) {
  return {
    theme: 'light',
    language: 'en',
    downloadLocation: '/mock/downloads',
    tempDirectory: '/mock/temp',
    videoQuality: 'best',
    audioQuality: 'best',
    maxConcurrentDownloads: 3,
    autoUpdate: true,
    startMinimized: false,
    closeToTray: false,
    windowSize: { width: 1200, height: 800 },
    windowPosition: { x: 100, y: 100 },
    ...overrides,
  };
}

/**
 * Helper to create mock dependency status
 */
export function createMockDependencyStatus(overrides: Record<string, any> = {}) {
  return {
    ytdlp: {
      installed: true,
      version: '2023.01.06',
      path: '/mock/dependencies/yt-dlp/bin/yt-dlp',
      ...overrides.ytdlp,
    },
    ffmpeg: {
      installed: true,
      version: '4.4.0',
      path: '/mock/dependencies/ffmpeg/bin/ffmpeg',
      ...overrides.ffmpeg,
    },
  };
}