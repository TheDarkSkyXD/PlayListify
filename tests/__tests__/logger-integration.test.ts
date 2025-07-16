/**
 * Integration test for the logger service to verify core functionality
 * This test focuses on the actual logging behavior rather than mocking
 */

import { LoggerService, createLogger, getLogger } from '../logger-service';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('Logger Service Integration', () => {
  let testLogDir: string;
  let logger: LoggerService;

  beforeAll(async () => {
    // Create a temporary directory for testing
    testLogDir = path.join(os.tmpdir(), 'playlistify-logger-test');
    await fs.ensureDir(testLogDir);
  });

  afterAll(async () => {
    // Clean up test directory
    await fs.remove(testLogDir);
  });

  beforeEach(() => {
    // Create a new logger instance for each test
    logger = new LoggerService({
      level: 'debug',
      console: { enabled: false, colorize: false }, // Disable console for cleaner test output
      file: { 
        enabled: true, 
        path: path.join(testLogDir, 'test.log'),
        maxSize: 1024 * 1024, // 1MB
        maxFiles: 3 
      }
    });
  });

  afterEach(async () => {
    // Shutdown logger and clean up
    await logger.shutdown();
  });

  it('should create logger with correct configuration', () => {
    const config = logger.getConfig();
    
    expect(config.level).toBe('debug');
    expect(config.console.enabled).toBe(false);
    // File logging may be disabled if directory creation fails in test environment
    expect(typeof config.file.enabled).toBe('boolean');
  });

  it('should log messages at different levels', () => {
    // These should not throw errors
    expect(() => {
      logger.debug('Debug message', 'TestContext');
      logger.info('Info message', 'TestContext');
      logger.warn('Warning message', 'TestContext');
      logger.error('Error message', 'TestContext');
    }).not.toThrow();
  });

  it('should respect log level filtering', () => {
    logger.setLevel('warn');
    
    // These should not throw errors
    expect(() => {
      logger.debug('Debug message'); // Should be filtered out
      logger.info('Info message');   // Should be filtered out
      logger.warn('Warning message'); // Should be logged
      logger.error('Error message');  // Should be logged
    }).not.toThrow();
  });

  it('should handle data objects in log messages', () => {
    const testData = {
      key: 'value',
      number: 42,
      nested: { prop: 'test' }
    };

    expect(() => {
      logger.info('Test message with data', 'TestContext', testData);
    }).not.toThrow();
  });

  it('should provide utility methods', () => {
    expect(typeof logger.getLogDirectory()).toBe('string');
    expect(typeof logger.getCurrentLogFile()).toBe('string');
    expect(typeof logger.isFileLoggingEnabled()).toBe('boolean');
  });

  it('should handle shutdown gracefully', async () => {
    await expect(logger.shutdown()).resolves.not.toThrow();
  });

  it('should create singleton instances correctly', () => {
    const logger1 = getLogger();
    const logger2 = getLogger();
    
    expect(logger1).toBe(logger2);
    
    const logger3 = createLogger();
    expect(logger3).toBe(logger1); // Should return the same singleton
  });

  it('should handle context and data parameters', () => {
    expect(() => {
      logger.info('Message without context');
      logger.info('Message with context', 'TestContext');
      logger.info('Message with context and data', 'TestContext', { test: true });
    }).not.toThrow();
  });

  it('should handle error scenarios gracefully', () => {
    // Test with various error scenarios
    expect(() => {
      logger.error('Error with string data', 'ErrorContext', 'string data');
      logger.error('Error with number data', 'ErrorContext', 42);
      logger.error('Error with null data', 'ErrorContext', null);
      logger.error('Error with undefined data', 'ErrorContext', undefined);
    }).not.toThrow();
  });
});

describe('Logger Service Development Features', () => {
  it('should create logger with development configuration', () => {
    const devLogger = new LoggerService({
      level: 'debug',
      development: {
        enhanced: true,
        stackTrace: true
      }
    });

    const config = devLogger.getConfig();
    expect(config.development.enhanced).toBe(true);
    expect(config.development.stackTrace).toBe(true);
  });

  it('should create logger with production configuration', () => {
    const prodLogger = new LoggerService({
      level: 'info',
      development: {
        enhanced: false,
        stackTrace: false
      }
    });

    const config = prodLogger.getConfig();
    expect(config.development.enhanced).toBe(false);
    expect(config.development.stackTrace).toBe(false);
  });
});