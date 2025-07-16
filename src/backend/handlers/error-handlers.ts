/**
 * IPC Error Handlers
 * Provides secure IPC communication for error handling and recovery operations
 */

import { ipcMain } from 'electron';
import { ErrorHandlerService } from '../services/error-handler-service';
import { createIPCHandler, createIPCResponse } from './index';
import type { 
  ErrorStatistics, 
  ErrorReport, 
  ErrorContext, 
  RecoveryOptions,
  ErrorHandlerConfig 
} from '@/shared/types/error-types';
import { getLogger } from '../services/logger-service';

let errorHandlerService: ErrorHandlerService | null = null;
const logger = getLogger();

/**
 * Initialize error handler service and register IPC handlers
 */
export function initializeErrorHandlers(errorHandler: ErrorHandlerService): void {
  errorHandlerService = errorHandler;
  registerErrorIPCHandlers();
  logger.info('Error IPC handlers initialized', 'ErrorHandlers');
}

/**
 * Register all error-related IPC handlers
 */
function registerErrorIPCHandlers(): void {
  // Get error statistics
  ipcMain.handle('error:getStatistics', createIPCHandler(async (): Promise<ErrorStatistics> => {
    if (!errorHandlerService) {
      throw new Error('Error handler service not initialized');
    }
    
    return errorHandlerService.getErrorStatistics();
  }));

  // Get recent error reports
  ipcMain.handle('error:getRecentReports', createIPCHandler(async (limit: number = 10): Promise<ErrorReport[]> => {
    if (!errorHandlerService) {
      throw new Error('Error handler service not initialized');
    }
    
    const stats = errorHandlerService.getErrorStatistics();
    return stats.recentErrors.slice(0, limit);
  }));

  // Report an error from renderer process
  ipcMain.handle('error:report', createIPCHandler(async (
    error: { message: string; stack?: string; name?: string },
    context: ErrorContext,
    options?: RecoveryOptions
  ): Promise<boolean> => {
    if (!errorHandlerService) {
      throw new Error('Error handler service not initialized');
    }
    
    // Create Error object from serialized error
    const errorObj = new Error(error.message);
    errorObj.name = error.name || 'RendererError';
    errorObj.stack = error.stack;
    
    return await errorHandlerService.handleError(errorObj, context, options);
  }));

  // Clear old error reports
  ipcMain.handle('error:clearOldReports', createIPCHandler(async (maxAge?: number): Promise<void> => {
    if (!errorHandlerService) {
      throw new Error('Error handler service not initialized');
    }
    
    errorHandlerService.clearOldReports(maxAge);
  }));

  // Trigger graceful shutdown
  ipcMain.handle('error:gracefulShutdown', createIPCHandler(async (reason: string = 'User requested'): Promise<void> => {
    if (!errorHandlerService) {
      throw new Error('Error handler service not initialized');
    }
    
    await errorHandlerService.gracefulShutdown(reason);
  }));

  // Test error handling (development only)
  if (process.env.NODE_ENV === 'development') {
    ipcMain.handle('error:test', createIPCHandler(async (errorType: string): Promise<boolean> => {
      if (!errorHandlerService) {
        throw new Error('Error handler service not initialized');
      }
      
      let testError: Error;
      
      switch (errorType) {
        case 'network':
          testError = new Error('ENOTFOUND: Network connection failed');
          break;
        case 'filesystem':
          testError = new Error('ENOENT: File not found');
          break;
        case 'permission':
          testError = new Error('EACCES: Permission denied');
          break;
        case 'validation':
          testError = new Error('Invalid input format');
          break;
        default:
          testError = new Error('Test error for development');
      }
      
      return await errorHandlerService.handleError(testError, {
        operation: 'test',
        component: 'ErrorHandlers',
        additionalData: { errorType },
      });
    }));
  }

  logger.debug('Error IPC handlers registered successfully', 'ErrorHandlers');
}

/**
 * Cleanup error IPC handlers
 */
export function cleanupErrorHandlers(): void {
  // Remove specific error handlers
  const errorChannels = [
    'error:getStatistics',
    'error:getRecentReports',
    'error:report',
    'error:clearOldReports',
    'error:gracefulShutdown',
  ];

  if (process.env.NODE_ENV === 'development') {
    errorChannels.push('error:test');
  }

  errorChannels.forEach(channel => {
    ipcMain.removeHandler(channel);
  });

  errorHandlerService = null;
  logger.info('Error IPC handlers cleaned up', 'ErrorHandlers');
}

/**
 * Handle IPC errors with proper error response format
 */
export function handleIPCError(error: unknown, channel: string, args?: any[]): any {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  logger.error(`IPC Error in channel: ${channel}`, 'ErrorHandlers', {
    error: errorMessage,
    args: args ? JSON.stringify(args) : undefined,
  });

  // If we have an error handler service, report the error
  if (errorHandlerService) {
    const errorObj = error instanceof Error ? error : new Error(errorMessage);
    
    errorHandlerService.handleError(errorObj, {
      operation: 'ipc',
      component: 'ErrorHandlers',
      additionalData: { channel, args },
    }).catch(handlingError => {
      logger.error('Failed to handle IPC error', 'ErrorHandlers', {
        originalError: errorMessage,
        handlingError: handlingError instanceof Error ? handlingError.message : handlingError,
      });
    });
  }

  return createIPCResponse(undefined, errorMessage);
}

/**
 * Create standardized error response for IPC
 */
export function createErrorResponse(error: Error, context?: string): any {
  return createIPCResponse(undefined, `${context ? `${context}: ` : ''}${error.message}`);
}

/**
 * Validate error handler service is available
 */
export function validateErrorHandlerService(): void {
  if (!errorHandlerService) {
    throw new Error('Error handler service not initialized. Call initializeErrorHandlers first.');
  }
}

/**
 * Get error handler service instance (for internal use)
 */
export function getErrorHandlerService(): ErrorHandlerService | null {
  return errorHandlerService;
}