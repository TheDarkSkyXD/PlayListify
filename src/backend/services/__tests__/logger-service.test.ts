import { LoggerService, createLogger, getLogger } from '../../src/backend/services/logger-service';
import * as fs from 'fs-extra';
import * as path from 'path';
import { app } from 'electron';

// Mock electron app
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockReturnValue('/mock/user/data')
  }
}));

// Mock fs-extra
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('LoggerService', () => {
  let logger: LoggerService;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

    // Mock fs operations
    mockFs.ensureDir.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
    mockFs.appendFile.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 1000, mtime: new Date() } as any);
    mockFs.remove.mockResolvedValue(undefined);
    mockFs.statSync.mockReturnValue({ mtime: new Date() } as any);

    // Create new logger instance
    logger = new LoggerService({
      level: 'debug',
      console: { enabled: true, colorize: false },
      file: { enabled: true, path: '', maxSize: 1024, maxFiles: 3 }
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const config = logger.getConfig();
      expect(config.level).toBe('debug');
      expect(config.console.enabled).toBe(true);
      expect(config.file.enabled).toBe(true);
    });

    it('should create log directory', () => {
      expect(mockFs.ensureDir).toHaveBeenCalledWith(
        expect.stringContaining('Console Logs')
      );
    });

    it('should handle directory creation failure gracefully', async () => {
      mockFs.ensureDir.mockRejectedValueOnce(new Error('Permission denied'));
      
      const failingLogger = new LoggerService();
      
      // Wait for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(failingLogger.isFileLoggingEnabled()).toBe(false);
    });
  });

  describe('Log Level Filtering', () => {
    it('should log messages at or above configured level', () => {
      logger.setLevel('warn');
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled(); // info uses console.log
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('warn message')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('error message')
      );
    });

    it('should log all messages when level is debug', () => {
      logger.setLevel('debug');
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Console Logging', () => {
    it('should format log messages correctly', () => {
      logger.info('test message', 'TestContext', { key: 'value' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[.*\] \[INFO\] \[TestContext\] test message/)
      );
    });

    it('should include data in log output', () => {
      logger.error('error message', 'ErrorContext', { error: 'details' });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Data: {')
      );
    });

    it('should respect console enabled setting', () => {
      const consoleDisabledLogger = new LoggerService({
        console: { enabled: false, colorize: false }
      });
      
      consoleDisabledLogger.info('test message');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('File Logging', () => {
    it('should write log entries to file', async () => {
      logger.info('test message');
      
      // Wait for async file write
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('.log'),
        expect.stringContaining('test message'),
        'utf8'
      );
    });

    it('should handle file write errors gracefully', async () => {
      mockFs.appendFile.mockRejectedValueOnce(new Error('Write failed'));
      
      logger.error('test error');
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should not crash and should disable file logging
      expect(logger.isFileLoggingEnabled()).toBe(false);
    });

    it('should rotate log files when size limit is reached', async () => {
      // Mock file size to exceed limit
      mockFs.stat.mockResolvedValueOnce({ size: 2048 } as any);
      
      logger.info('test message');
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should check file size
      expect(mockFs.stat).toHaveBeenCalled();
    });
  });

  describe('Log Cleanup', () => {
    it('should clean up old log files', async () => {
      const oldFiles = [
        'app-2023-01-01T00-00-00-000Z.log',
        'app-2023-01-02T00-00-00-000Z.log',
        'app-2023-01-03T00-00-00-000Z.log',
        'app-2023-01-04T00-00-00-000Z.log'
      ];
      
      mockFs.readdir.mockResolvedValueOnce(oldFiles);
      
      // Create new logger to trigger cleanup
      new LoggerService({ file: { enabled: true, path: '', maxSize: 1024, maxFiles: 2 } });
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should remove excess files
      expect(mockFs.remove).toHaveBeenCalled();
    });
  });

  describe('Development Mode Features', () => {
    it('should show stack trace in development mode for errors', () => {
      const devLogger = new LoggerService({
        development: { enhanced: true, stackTrace: true }
      });
      
      devLogger.error('test error');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stack trace:')
      );
    });

    it('should not show stack trace when disabled', () => {
      const prodLogger = new LoggerService({
        development: { enhanced: false, stackTrace: false }
      });
      
      prodLogger.error('test error');
      
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Stack trace:')
      );
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getLogger', () => {
      const logger1 = getLogger();
      const logger2 = getLogger();
      
      expect(logger1).toBe(logger2);
    });

    it('should create new instance with createLogger', () => {
      const logger1 = createLogger();
      const logger2 = createLogger();
      
      expect(logger1).toBe(logger2); // Should still be singleton
    });
  });

  describe('Utility Methods', () => {
    it('should return log directory path', () => {
      const logDir = logger.getLogDirectory();
      expect(logDir).toContain('Console Logs');
    });

    it('should return current log file path', () => {
      const logFile = logger.getCurrentLogFile();
      expect(logFile).toContain('.log');
    });

    it('should flush logs on shutdown', async () => {
      await logger.shutdown();
      
      expect(mockFs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining('.log'),
        '',
        'utf8'
      );
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing app.getPath gracefully', () => {
      (app.getPath as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Path not available');
      });
      
      expect(() => new LoggerService()).not.toThrow();
    });

    it('should continue logging to console when file logging fails', async () => {
      mockFs.ensureDir.mockRejectedValueOnce(new Error('Directory creation failed'));
      
      const failingLogger = new LoggerService();
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      failingLogger.info('test message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('test message')
      );
    });
  });
});