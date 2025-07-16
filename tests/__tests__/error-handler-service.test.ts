/**
 * Error Handler Service Tests
 * Tests for comprehensive error handling, recovery mechanisms, and graceful shutdown
 */

import { ErrorHandlerService } from '../../src/backend/services/error-handler-service';
import { LoggerService } from '../../src/backend/services/logger-service';
import { BaseError, SystemError, NetworkError } from '../../src/shared/errors';
import type { ErrorContext, RecoveryOptions } from '../../src/shared/types/error-types';

// Mock Electron modules
jest.mock('electron', () => ({
  app: {
    on: jest.fn(),
    quit: jest.fn(),
  },
  dialog: {
    showErrorBox: jest.fn(),
  },
  BrowserWindow: {
    getFocusedWindow: jest.fn(),
    getAllWindows: jest.fn(() => []),
  },
}));

// Mock logger
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  shutdown: jest.fn().mockResolvedValue(undefined),
} as unknown as LoggerService;

describe('ErrorHandlerService', () => {
  let errorHandler: ErrorHandlerService;

  beforeEach(() => {
    jest.clearAllMocks();
    errorHandler = new ErrorHandlerService(mockLogger);
  });

  afterEach(async () => {
    await errorHandler.shutdown();
  });

  describe('Error Handling', () => {
    it('should handle basic errors', async () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        operation: 'test',
        component: 'TestComponent',
      };

      const result = await errorHandler.handleError(error, context);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error occurred',
        'ErrorHandler',
        expect.objectContaining({
          errorId: expect.any(String),
          context,
        })
      );

      // Should return false since no recovery strategies are registered
      expect(result).toBe(false);
    });

    it('should handle BaseError instances', async () => {
      const error = new SystemError('System error', 'SYSTEM_TEST', {
        userMessage: 'Test user message',
        suggestions: ['Test suggestion'],
      });
      const context: ErrorContext = {
        operation: 'test',
        component: 'TestComponent',
      };

      await errorHandler.handleError(error, context);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error occurred',
        'ErrorHandler',
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'SystemError',
            code: 'SYSTEM_TEST',
            userMessage: 'Test user message',
            suggestions: ['Test suggestion'],
          }),
        })
      );
    });

    it('should wrap regular errors in BaseError', async () => {
      const error = new Error('Regular error');
      const context: ErrorContext = {
        operation: 'ipc',
        component: 'IPC',
      };

      await errorHandler.handleError(error, context);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error occurred',
        'ErrorHandler',
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'IPCError',
            code: 'IPC_ERROR',
          }),
        })
      );
    });
  });

  describe('Recovery Strategies', () => {
    it('should register and use recovery strategies', async () => {
      const mockRecovery = jest.fn().mockResolvedValue(true);
      
      errorHandler.registerRecoveryStrategy('test-strategy', {
        canRecover: (error) => error.message.includes('recoverable'),
        recover: mockRecovery,
        priority: 5,
      });

      const error = new Error('This is a recoverable error');
      const context: ErrorContext = {
        operation: 'test',
        component: 'TestComponent',
      };

      const result = await errorHandler.handleError(error, context);

      expect(mockRecovery).toHaveBeenCalledWith(expect.any(BaseError), context);
      expect(result).toBe(true);
    });

    it('should try multiple recovery strategies in priority order', async () => {
      const lowPriorityRecovery = jest.fn().mockResolvedValue(false);
      const highPriorityRecovery = jest.fn().mockResolvedValue(true);
      
      errorHandler.registerRecoveryStrategy('low-priority', {
        canRecover: () => true,
        recover: lowPriorityRecovery,
        priority: 1,
      });

      errorHandler.registerRecoveryStrategy('high-priority', {
        canRecover: () => true,
        recover: highPriorityRecovery,
        priority: 10,
      });

      const error = new Error('Test error');
      const context: ErrorContext = {
        operation: 'test',
        component: 'TestComponent',
      };

      const result = await errorHandler.handleError(error, context);

      // High priority should be called first and succeed
      expect(highPriorityRecovery).toHaveBeenCalled();
      expect(lowPriorityRecovery).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should retry recovery strategies with exponential backoff', async () => {
      let attemptCount = 0;
      const mockRecovery = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.resolve(false);
        }
        return Promise.resolve(true);
      });
      
      errorHandler.registerRecoveryStrategy('retry-strategy', {
        canRecover: () => true,
        recover: mockRecovery,
        priority: 5,
      });

      const error = new Error('Test error');
      const context: ErrorContext = {
        operation: 'test',
        component: 'TestComponent',
      };

      const options: RecoveryOptions = {
        maxRetries: 3,
        retryDelay: 100,
        exponentialBackoff: true,
      };

      const result = await errorHandler.handleError(error, context, options);

      expect(mockRecovery).toHaveBeenCalledTimes(3);
      expect(result).toBe(true);
    });

    it('should use fallback action when no strategies work', async () => {
      const fallbackAction = jest.fn().mockResolvedValue(undefined);
      
      const error = new Error('Test error');
      const context: ErrorContext = {
        operation: 'test',
        component: 'TestComponent',
      };

      const options: RecoveryOptions = {
        fallbackAction,
      };

      const result = await errorHandler.handleError(error, context, options);

      expect(fallbackAction).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('Shutdown Procedures', () => {
    it('should register shutdown procedures', () => {
      const mockProcedure = jest.fn().mockResolvedValue(undefined);
      
      errorHandler.registerShutdownProcedure({
        name: 'test-procedure',
        priority: 5,
        timeout: 1000,
        procedure: mockProcedure,
      });

      // No direct way to test registration, but we can test execution
      expect(() => {
        errorHandler.registerShutdownProcedure({
          name: 'test-procedure-2',
          priority: 3,
          timeout: 2000,
          procedure: jest.fn(),
        });
      }).not.toThrow();
    });

    it('should execute shutdown procedures in priority order', async () => {
      const procedures: string[] = [];
      
      const lowPriorityProcedure = jest.fn().mockImplementation(async () => {
        procedures.push('low');
      });
      
      const highPriorityProcedure = jest.fn().mockImplementation(async () => {
        procedures.push('high');
      });

      errorHandler.registerShutdownProcedure({
        name: 'low-priority',
        priority: 1,
        timeout: 1000,
        procedure: lowPriorityProcedure,
      });

      errorHandler.registerShutdownProcedure({
        name: 'high-priority',
        priority: 10,
        timeout: 1000,
        procedure: highPriorityProcedure,
      });

      await errorHandler.gracefulShutdown('Test shutdown');

      expect(procedures).toEqual(['high', 'low']);
      expect(highPriorityProcedure).toHaveBeenCalled();
      expect(lowPriorityProcedure).toHaveBeenCalled();
    });

    it('should handle shutdown procedure timeouts', async () => {
      const slowProcedure = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
      });

      errorHandler.registerShutdownProcedure({
        name: 'slow-procedure',
        priority: 5,
        timeout: 100, // Very short timeout
        procedure: slowProcedure,
      });

      // Should not hang
      await errorHandler.gracefulShutdown('Test shutdown');

      expect(slowProcedure).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Shutdown procedure failed'),
        'ErrorHandler',
        expect.objectContaining({
          error: expect.stringContaining('timed out'),
        })
      );
    });
  });

  describe('Error Statistics', () => {
    it('should track error statistics', async () => {
      const error1 = new SystemError('System error 1', 'SYSTEM_ERROR_1');
      const error2 = new NetworkError('Network error 1', 'NETWORK_ERROR_1');
      const error3 = new SystemError('System error 2', 'SYSTEM_ERROR_2');

      const context: ErrorContext = {
        operation: 'test',
        component: 'TestComponent',
      };

      await errorHandler.handleError(error1, context);
      await errorHandler.handleError(error2, context);
      await errorHandler.handleError(error3, context);

      const stats = errorHandler.getErrorStatistics();

      expect(stats.totalErrors).toBe(3);
      expect(stats.recoveredErrors).toBe(0); // No recovery strategies registered
      expect(stats.recoveryRate).toBe(0);
      expect(stats.errorsByType).toEqual({
        SystemError: 2,
        NetworkError: 1,
      });
      expect(stats.recentErrors).toHaveLength(3);
    });

    it('should clear old error reports', async () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        operation: 'test',
        component: 'TestComponent',
      };

      await errorHandler.handleError(error, context);

      let stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(1);

      // Clear reports older than 0ms (should clear all)
      errorHandler.clearOldReports(0);

      stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
    });
  });

  describe('Event Emission', () => {
    it('should emit error events', async () => {
      const errorListener = jest.fn();
      const recoveryListener = jest.fn();

      errorHandler.on('error', errorListener);
      errorHandler.on('recoveryAttempt', recoveryListener);

      const error = new Error('Test error');
      const context: ErrorContext = {
        operation: 'test',
        component: 'TestComponent',
      };

      await errorHandler.handleError(error, context);

      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(BaseError),
          context,
          report: expect.objectContaining({
            id: expect.any(String),
            timestamp: expect.any(Date),
          }),
        })
      );

      expect(recoveryListener).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(BaseError),
          context,
          recovered: false,
        })
      );
    });

    it('should emit shutdown events', async () => {
      const shutdownStartedListener = jest.fn();
      const shutdownCompletedListener = jest.fn();

      errorHandler.on('shutdownStarted', shutdownStartedListener);
      errorHandler.on('shutdownCompleted', shutdownCompletedListener);

      await errorHandler.gracefulShutdown('Test shutdown');

      expect(shutdownStartedListener).toHaveBeenCalledWith({
        reason: 'Test shutdown',
      });

      expect(shutdownCompletedListener).toHaveBeenCalledWith({
        reason: 'Test shutdown',
      });
    });
  });

  describe('Error ID Generation', () => {
    it('should generate unique error IDs', async () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        operation: 'test',
        component: 'TestComponent',
      };

      await errorHandler.handleError(error, context);
      await errorHandler.handleError(error, context);

      const stats = errorHandler.getErrorStatistics();
      const ids = stats.recentErrors.map(report => report.id);

      expect(ids).toHaveLength(2);
      expect(ids[0]).not.toBe(ids[1]);
      expect(ids[0]).toMatch(/^error_\d+_[a-z0-9]+$/);
      expect(ids[1]).toMatch(/^error_\d+_[a-z0-9]+$/);
    });
  });
});

describe('Error Handler Integration', () => {
  let errorHandler: ErrorHandlerService;

  beforeEach(() => {
    errorHandler = new ErrorHandlerService(mockLogger);
  });

  afterEach(async () => {
    await errorHandler.shutdown();
  });

  it('should handle complex error scenarios', async () => {
    // Register a recovery strategy that fails first, then succeeds
    let recoveryAttempts = 0;
    errorHandler.registerRecoveryStrategy('complex-recovery', {
      canRecover: (error) => error.message.includes('complex'),
      recover: async () => {
        recoveryAttempts++;
        if (recoveryAttempts < 2) {
          throw new Error('Recovery failed');
        }
        return true;
      },
      priority: 5,
    });

    const error = new Error('This is a complex error scenario');
    const context: ErrorContext = {
      operation: 'complex-test',
      component: 'IntegrationTest',
    };

    const options: RecoveryOptions = {
      maxRetries: 3,
      retryDelay: 50,
    };

    const result = await errorHandler.handleError(error, context, options);

    expect(result).toBe(true);
    expect(recoveryAttempts).toBe(2);
  });

  it('should handle shutdown during error processing', async () => {
    const slowRecovery = jest.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    });

    errorHandler.registerRecoveryStrategy('slow-recovery', {
      canRecover: () => true,
      recover: slowRecovery,
      priority: 5,
    });

    const error = new Error('Test error');
    const context: ErrorContext = {
      operation: 'test',
      component: 'TestComponent',
    };

    // Start error handling
    const errorPromise = errorHandler.handleError(error, context);

    // Start shutdown immediately
    const shutdownPromise = errorHandler.gracefulShutdown('Test shutdown');

    // Both should complete without hanging
    await Promise.all([errorPromise, shutdownPromise]);

    expect(slowRecovery).toHaveBeenCalled();
  });
});