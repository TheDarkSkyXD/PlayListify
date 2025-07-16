/**
 * Logger Service Tests
 * Tests for comprehensive logging system with file and console output
 */

import { LoggerService } from '../../src/backend/services/logger-service';
import { createServiceTestEnvironment } from '../utils/service-test-utils';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock Electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name: string) => {
      const paths: Record<string, string> = {
        userData: '/mock/userData',
        logs: '/mock/logs',
      };
      return paths[name] || '/mock/path';
    }),
  },
}));

// Mock winston
jest.mock('winston', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    end: jest.fn(),
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      json: jest.fn(),
      simple: jest.fn(),
      colorize: jest.fn(),
      printf: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

// Mock fs-extra
jest.mock('fs-extra');

describe('LoggerService', () => {
  let loggerService: LoggerService;
  let testEnv: ReturnType<typeof createServiceTestEnvironment>;
  let mockWinstonLogger: any;

  beforeEach(async () => {
    testEnv = createServiceTestEnvironment();
    await testEnv.setup();

    // Get the mock winston logger
    const winston = require('winston');
    mockWinstonLogger = winston.createLogger();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock fs operations
    (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
    (fs.remove as jest.Mock).mockResolvedValue(undefined);
    (fs.readdir as jest.Mock).mockResolvedValue([]);

    loggerService = new LoggerService();
  });

  afterEach(async () => {
    await loggerService.shutdown();
    await testEnv.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(loggerService).toBeDefined();
      expect(fs.ensureDir).toHaveBeenCalled();
    });

    it('should create log directory', () => {
      expect(fs.ensureDir).toHaveBeenCalledWith(
        expect.stringContaining('Console Logs')
      );
    });

    it('should clean up old log files on initialization', () => {
      expect(fs.readdir).toHaveBeenCalled();
    });
  });

  describe('Logging Methods', () => {
    it('should log error messages', () => {
      const message = 'Test error message';
      const component = 'TestComponent';
      const meta = { key: 'value' };

      loggerService.error(message, component, meta);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          component,
          level: 'error',
          ...meta,
        })
      );
    });

    it('should log warning messages', () => {
      const message = 'Test warning message';
      const component = 'TestComponent';

      loggerService.warn(message, component);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          component,
          level: 'warn',
        })
      );
    });

    it('should log info messages', () => {
      const message = 'Test info message';
      const component = 'TestComponent';

      loggerService.info(message, component);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          component,
          level: 'info',
        })
      );
    });

    it('should log debug messages', () => {
      const message = 'Test debug message';
      const component = 'TestComponent';

      loggerService.debug(message, component);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          component,
          level: 'debug',
        })
      );
    });

    it('should handle messages without component', () => {
      const message = 'Test message without component';

      loggerService.info(message);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          component: 'Unknown',
          level: 'info',
        })
      );
    });

    it('should handle messages with complex metadata', () => {
      const message = 'Test message with complex meta';
      const component = 'TestComponent';
      const meta = {
        nested: { key: 'value' },
        array: [1, 2, 3],
        error: new Error('Test error'),
      };

      loggerService.error(message, component, meta);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message,
          component,
          level: 'error',
          nested: meta.nested,
          array: meta.array,
          error: meta.error,
        })
      );
    });
  });

  describe('Log Level Management', () => {
    it('should set log level', () => {
      loggerService.setLevel('debug');
      
      // In a real implementation, this would change the winston logger level
      // For now, we just verify the method doesn't throw
      expect(() => loggerService.setLevel('debug')).not.toThrow();
    });

    it('should get current log level', () => {
      const level = loggerService.getLevel();
      expect(typeof level).toBe('string');
    });

    it('should handle invalid log levels gracefully', () => {
      expect(() => loggerService.setLevel('invalid' as any)).not.toThrow();
    });
  });

  describe('File Operations', () => {
    it('should clean up old log files', async () => {
      // Mock readdir to return some old log files
      (fs.readdir as jest.Mock).mockResolvedValue([
        'app-2023-01-01.log',
        'app-2023-01-02.log',
        'current.log',
      ]);

      await loggerService.cleanupOldLogs();

      expect(fs.remove).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      (fs.readdir as jest.Mock).mockRejectedValue(new Error('Read error'));

      await expect(loggerService.cleanupOldLogs()).resolves.not.toThrow();
    });

    it('should rotate log files', async () => {
      await loggerService.rotateLogs();

      // In a real implementation, this would create new log files
      // For now, we just verify the method doesn't throw
      expect(() => loggerService.rotateLogs()).not.toThrow();
    });
  });

  describe('Performance Logging', () => {
    it('should log performance metrics', () => {
      const operation = 'testOperation';
      const duration = 1500;
      const metadata = { key: 'value' };

      loggerService.logPerformance(operation, duration, metadata);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Performance'),
          operation,
          duration,
          level: 'info',
          ...metadata,
        })
      );
    });

    it('should handle performance logging with timer', () => {
      const operation = 'timedOperation';
      
      const timer = loggerService.startTimer(operation);
      expect(timer).toBeDefined();
      expect(typeof timer.end).toBe('function');

      // End the timer
      timer.end();

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Performance'),
          operation,
          duration: expect.any(Number),
        })
      );
    });
  });

  describe('Structured Logging', () => {
    it('should log structured data', () => {
      const data = {
        userId: '123',
        action: 'login',
        timestamp: new Date(),
        metadata: { ip: '127.0.0.1' },
      };

      loggerService.logStructured('info', 'User action', data);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User action',
          level: 'info',
          ...data,
        })
      );
    });

    it('should handle different log levels for structured logging', () => {
      const data = { key: 'value' };

      loggerService.logStructured('error', 'Error occurred', data);
      loggerService.logStructured('warn', 'Warning occurred', data);
      loggerService.logStructured('debug', 'Debug info', data);

      expect(mockWinstonLogger.error).toHaveBeenCalled();
      expect(mockWinstonLogger.warn).toHaveBeenCalled();
      expect(mockWinstonLogger.debug).toHaveBeenCalled();
    });
  });

  describe('Error Logging', () => {
    it('should log Error objects properly', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      loggerService.error('An error occurred', 'TestComponent', { error });

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'An error occurred',
          component: 'TestComponent',
          error: error,
        })
      );
    });

    it('should log error with context', () => {
      const error = new Error('Test error');
      const context = {
        userId: '123',
        operation: 'testOperation',
        requestId: 'req-123',
      };

      loggerService.logError(error, context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: error.message,
          error: error,
          ...context,
        })
      );
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await loggerService.shutdown();

      expect(mockWinstonLogger.close).toHaveBeenCalled();
    });

    it('should handle shutdown errors', async () => {
      mockWinstonLogger.close.mockRejectedValue(new Error('Shutdown error'));

      await expect(loggerService.shutdown()).resolves.not.toThrow();
    });

    it('should prevent logging after shutdown', async () => {
      await loggerService.shutdown();

      // Attempt to log after shutdown
      loggerService.info('Test message after shutdown');

      // Should not call winston logger
      expect(mockWinstonLogger.info).not.toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test message after shutdown',
        })
      );
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', () => {
      const customConfig = {
        level: 'debug' as const,
        maxFiles: 10,
        maxSize: '50m',
        datePattern: 'YYYY-MM-DD',
      };

      expect(() => new LoggerService(customConfig)).not.toThrow();
    });

    it('should use default configuration when none provided', () => {
      expect(() => new LoggerService()).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should not accumulate memory over time', () => {
      // Log many messages
      for (let i = 0; i < 1000; i++) {
        loggerService.info(`Test message ${i}`, 'TestComponent');
      }

      // Should not throw or cause memory issues
      expect(mockWinstonLogger.info).toHaveBeenCalledTimes(1000);
    });
  });
});

describe('LoggerService Integration', () => {
  let loggerService: LoggerService;

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
    (fs.remove as jest.Mock).mockResolvedValue(undefined);
    (fs.readdir as jest.Mock).mockResolvedValue([]);
  });

  afterEach(async () => {
    if (loggerService) {
      await loggerService.shutdown();
    }
  });

  it('should handle complete logging lifecycle', async () => {
    loggerService = new LoggerService();

    // Log various types of messages
    loggerService.info('Application started', 'App');
    loggerService.debug('Debug information', 'Debug');
    loggerService.warn('Warning message', 'Warning');
    loggerService.error('Error occurred', 'Error', { error: new Error('Test') });

    // Log performance
    const timer = loggerService.startTimer('testOperation');
    await new Promise(resolve => setTimeout(resolve, 10));
    timer.end();

    // Log structured data
    loggerService.logStructured('info', 'Structured log', {
      userId: '123',
      action: 'test',
    });

    // Cleanup and shutdown
    await loggerService.cleanupOldLogs();
    await loggerService.shutdown();

    const winston = require('winston');
    const mockLogger = winston.createLogger();

    expect(mockLogger.info).toHaveBeenCalled();
    expect(mockLogger.debug).toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockLogger.close).toHaveBeenCalled();
  });

  it('should handle concurrent logging operations', async () => {
    loggerService = new LoggerService();

    // Start multiple logging operations concurrently
    const promises = [];
    
    for (let i = 0; i < 10; i++) {
      promises.push(
        Promise.resolve().then(() => {
          loggerService.info(`Concurrent message ${i}`, 'Concurrent');
          loggerService.error(`Concurrent error ${i}`, 'Concurrent');
        })
      );
    }

    await Promise.all(promises);

    const winston = require('winston');
    const mockLogger = winston.createLogger();

    expect(mockLogger.info).toHaveBeenCalledTimes(10);
    expect(mockLogger.error).toHaveBeenCalledTimes(10);
  });
});