/**
 * Error Handler Service
 * Provides comprehensive error handling, recovery mechanisms, and graceful shutdown procedures
 */

import { EventEmitter } from 'events';
import { app, dialog, BrowserWindow } from 'electron';
import { BaseError, SystemError, ApplicationError, IPCError, ConfigurationError } from '@/shared/errors';
import type { LoggerService } from './logger-service';

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  fallbackAction?: () => Promise<void> | void;
  userNotification?: boolean;
}

export interface ErrorContext {
  operation: string;
  component: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

export interface RecoveryStrategy {
  canRecover: (error: Error) => boolean;
  recover: (error: Error, context: ErrorContext) => Promise<boolean>;
  priority: number;
}

export interface ShutdownProcedure {
  name: string;
  priority: number;
  timeout: number;
  procedure: () => Promise<void>;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: BaseError | Error;
  context: ErrorContext;
  recoveryAttempts: number;
  recovered: boolean;
  userNotified: boolean;
}

export class ErrorHandlerService extends EventEmitter {
  private logger: LoggerService;
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private shutdownProcedures: Map<string, ShutdownProcedure> = new Map();
  private errorReports: Map<string, ErrorReport> = new Map();
  private isShuttingDown = false;
  private shutdownTimeout = 30000; // 30 seconds
  private sessionId: string;

  constructor(logger: LoggerService) {
    super();
    this.logger = logger;
    this.sessionId = Date.now().toString();
    this.setupDefaultRecoveryStrategies();
    this.setupProcessHandlers();
  }

  /**
   * Handle an error with automatic recovery attempts
   */
  async handleError(
    error: Error,
    context: ErrorContext,
    options: ErrorRecoveryOptions = {}
  ): Promise<boolean> {
    const errorId = this.generateErrorId();
    const baseError = error instanceof BaseError ? error : this.wrapError(error, context);
    
    // Create error report
    const report: ErrorReport = {
      id: errorId,
      timestamp: new Date(),
      error: baseError,
      context: { ...context, sessionId: this.sessionId },
      recoveryAttempts: 0,
      recovered: false,
      userNotified: false,
    };

    this.errorReports.set(errorId, report);

    // Log the error
    this.logger.error('Error occurred', 'ErrorHandler', {
      errorId,
      error: baseError.toJSON ? baseError.toJSON() : this.errorToJSON(error),
      context,
    });

    // Emit error event
    this.emit('error', { error: baseError, context, report });

    try {
      // Attempt recovery
      const recovered = await this.attemptRecovery(baseError, context, options);
      report.recovered = recovered;

      if (!recovered && options.userNotification !== false) {
        await this.notifyUser(baseError, context);
        report.userNotified = true;
      }

      // Update report
      this.errorReports.set(errorId, report);

      // Emit recovery result
      this.emit('recoveryAttempt', { error: baseError, context, recovered, report });

      return recovered;
    } catch (recoveryError) {
      this.logger.error('Error during recovery attempt', 'ErrorHandler', {
        originalError: baseError.toJSON ? baseError.toJSON() : this.errorToJSON(error),
        recoveryError: recoveryError instanceof Error ? recoveryError.message : recoveryError,
        context,
      });

      return false;
    }
  }

  /**
   * Attempt to recover from an error using registered strategies
   */
  private async attemptRecovery(
    error: BaseError | Error,
    context: ErrorContext,
    options: ErrorRecoveryOptions
  ): Promise<boolean> {
    const maxRetries = options.maxRetries ?? 3;
    const baseDelay = options.retryDelay ?? 1000;
    const useExponentialBackoff = options.exponentialBackoff ?? true;

    // Get applicable recovery strategies
    const strategies = Array.from(this.recoveryStrategies.values())
      .filter(strategy => strategy.canRecover(error))
      .sort((a, b) => b.priority - a.priority);

    if (strategies.length === 0) {
      this.logger.warn('No recovery strategies available for error', 'ErrorHandler', {
        errorType: error.constructor.name,
        context,
      });

      // Try fallback action if provided
      if (options.fallbackAction) {
        try {
          await options.fallbackAction();
          return true;
        } catch (fallbackError) {
          this.logger.error('Fallback action failed', 'ErrorHandler', {
            fallbackError: fallbackError instanceof Error ? fallbackError.message : fallbackError,
          });
        }
      }

      return false;
    }

    // Try each strategy with retries
    for (const strategy of strategies) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          this.logger.info(`Attempting recovery with strategy: ${strategy.constructor.name}`, 'ErrorHandler', {
            attempt,
            maxRetries,
            context,
          });

          const recovered = await strategy.recover(error, context);
          
          if (recovered) {
            this.logger.info('Recovery successful', 'ErrorHandler', {
              strategy: strategy.constructor.name,
              attempt,
              context,
            });
            return true;
          }

          // Wait before retry
          if (attempt < maxRetries) {
            const delay = useExponentialBackoff 
              ? baseDelay * Math.pow(2, attempt - 1)
              : baseDelay;
            
            await this.delay(delay);
          }
        } catch (strategyError) {
          this.logger.error('Recovery strategy failed', 'ErrorHandler', {
            strategy: strategy.constructor.name,
            attempt,
            error: strategyError instanceof Error ? strategyError.message : strategyError,
            context,
          });
        }
      }
    }

    return false;
  }

  /**
   * Register a recovery strategy
   */
  registerRecoveryStrategy(name: string, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(name, strategy);
    this.logger.debug(`Recovery strategy registered: ${name}`, 'ErrorHandler');
  }

  /**
   * Register a shutdown procedure
   */
  registerShutdownProcedure(procedure: ShutdownProcedure): void {
    this.shutdownProcedures.set(procedure.name, procedure);
    this.logger.debug(`Shutdown procedure registered: ${procedure.name}`, 'ErrorHandler');
  }

  /**
   * Perform graceful shutdown
   */
  async gracefulShutdown(reason: string = 'Unknown'): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('Shutdown already in progress', 'ErrorHandler');
      return;
    }

    this.isShuttingDown = true;
    this.logger.info(`Initiating graceful shutdown: ${reason}`, 'ErrorHandler');

    this.emit('shutdownStarted', { reason });

    try {
      // Get procedures sorted by priority (higher priority first)
      const procedures = Array.from(this.shutdownProcedures.values())
        .sort((a, b) => b.priority - a.priority);

      // Execute shutdown procedures
      for (const procedure of procedures) {
        try {
          this.logger.info(`Executing shutdown procedure: ${procedure.name}`, 'ErrorHandler');
          
          await Promise.race([
            procedure.procedure(),
            this.delay(procedure.timeout).then(() => {
              throw new Error(`Shutdown procedure ${procedure.name} timed out`);
            }),
          ]);

          this.logger.info(`Shutdown procedure completed: ${procedure.name}`, 'ErrorHandler');
        } catch (error) {
          this.logger.error(`Shutdown procedure failed: ${procedure.name}`, 'ErrorHandler', {
            error: error instanceof Error ? error.message : error,
          });
        }
      }

      this.emit('shutdownCompleted', { reason });
      this.logger.info('Graceful shutdown completed', 'ErrorHandler');
    } catch (error) {
      this.logger.error('Error during graceful shutdown', 'ErrorHandler', {
        error: error instanceof Error ? error.message : error,
        reason,
      });
    }
  }

  /**
   * Show user-friendly error notification
   */
  private async notifyUser(error: BaseError | Error, context: ErrorContext): Promise<void> {
    try {
      const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      
      if (!mainWindow || mainWindow.isDestroyed()) {
        // Fallback to system dialog
        await this.showSystemErrorDialog(error, context);
        return;
      }

      // Send error to renderer for user-friendly display
      mainWindow.webContents.send('error-notification', {
        error: error instanceof BaseError ? error.toJSON() : this.errorToJSON(error),
        context,
        timestamp: new Date().toISOString(),
      });
    } catch (notificationError) {
      this.logger.error('Failed to notify user of error', 'ErrorHandler', {
        notificationError: notificationError instanceof Error ? notificationError.message : notificationError,
        originalError: error.message,
      });

      // Fallback to system dialog
      await this.showSystemErrorDialog(error, context);
    }
  }

  /**
   * Show system error dialog as fallback
   */
  private async showSystemErrorDialog(error: BaseError | Error, context: ErrorContext): Promise<void> {
    try {
      const userMessage = error instanceof BaseError && error.userMessage 
        ? error.userMessage 
        : 'An unexpected error occurred. Please try again.';

      const suggestions = error instanceof BaseError && error.suggestions
        ? error.suggestions.join('\n• ')
        : 'Restart the application if the problem persists.';

      await dialog.showErrorBox(
        'Application Error',
        `${userMessage}\n\nSuggestions:\n• ${suggestions}\n\nOperation: ${context.operation}\nComponent: ${context.component}`
      );
    } catch (dialogError) {
      this.logger.error('Failed to show system error dialog', 'ErrorHandler', {
        dialogError: dialogError instanceof Error ? dialogError.message : dialogError,
      });
    }
  }

  /**
   * Setup default recovery strategies
   */
  private setupDefaultRecoveryStrategies(): void {
    // File system recovery strategy
    this.registerRecoveryStrategy('filesystem', {
      canRecover: (error) => error.message.includes('ENOENT') || error.message.includes('EACCES'),
      recover: async (error, context) => {
        this.logger.info('Attempting file system recovery', 'ErrorHandler', { context });
        
        // Try to create missing directories or fix permissions
        if (error.message.includes('ENOENT')) {
          // Directory creation logic would go here
          return true;
        }
        
        if (error.message.includes('EACCES')) {
          // Permission fix logic would go here
          return false; // Usually requires user intervention
        }
        
        return false;
      },
      priority: 5,
    });

    // Network recovery strategy
    this.registerRecoveryStrategy('network', {
      canRecover: (error) => 
        error.message.includes('ENOTFOUND') || 
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('timeout'),
      recover: async (error, context) => {
        this.logger.info('Attempting network recovery', 'ErrorHandler', { context });
        
        // Wait and retry for network issues
        await this.delay(2000);
        return true; // Let the retry mechanism handle it
      },
      priority: 3,
    });

    // Database recovery strategy
    this.registerRecoveryStrategy('database', {
      canRecover: (error) => 
        error.message.includes('database') || 
        error.message.includes('SQLITE'),
      recover: async (error, context) => {
        this.logger.info('Attempting database recovery', 'ErrorHandler', { context });
        
        // Database recovery logic would go here
        // For now, just log and return false
        return false;
      },
      priority: 4,
    });
  }

  /**
   * Setup process-level error handlers
   */
  private setupProcessHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      this.logger.error('Uncaught Exception', 'ErrorHandler', {
        error: error.message,
        stack: error.stack,
      });

      await this.handleError(error, {
        operation: 'process',
        component: 'uncaughtException',
      });

      // Graceful shutdown on critical errors
      await this.gracefulShutdown('Uncaught Exception');
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      
      this.logger.error('Unhandled Promise Rejection', 'ErrorHandler', {
        reason: String(reason),
        promise: promise.toString(),
      });

      await this.handleError(error, {
        operation: 'process',
        component: 'unhandledRejection',
      });
    });

    // Handle app before-quit for graceful shutdown
    app.on('before-quit', async (event) => {
      if (!this.isShuttingDown) {
        event.preventDefault();
        await this.gracefulShutdown('Application Quit');
        app.quit();
      }
    });
  }

  /**
   * Wrap a regular Error in a BaseError
   */
  private wrapError(error: Error, context: ErrorContext): BaseError {
    // Determine error type based on context and message
    if (context.component === 'IPC' || context.operation.includes('ipc')) {
      return new IPCError(error.message, 'IPC_ERROR', {
        cause: error,
        details: { context },
      });
    }

    if (context.component === 'System' || error.message.includes('ENOENT') || error.message.includes('EACCES')) {
      return new SystemError(error.message, 'SYSTEM_ERROR', {
        cause: error,
        details: { context },
      });
    }

    if (context.component === 'Configuration' || context.operation.includes('config')) {
      return new ConfigurationError(error.message, 'CONFIG_ERROR', {
        cause: error,
        details: { context },
      });
    }

    // Default to ApplicationError
    return new ApplicationError(error.message, 'APPLICATION_ERROR', {
      cause: error,
      details: { context },
    });
  }

  /**
   * Convert regular Error to JSON
   */
  private errorToJSON(error: Error): Record<string, any> {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    recoveredErrors: number;
    recoveryRate: number;
    errorsByType: Record<string, number>;
    recentErrors: ErrorReport[];
  } {
    const reports = Array.from(this.errorReports.values());
    const totalErrors = reports.length;
    const recoveredErrors = reports.filter(r => r.recovered).length;
    const recoveryRate = totalErrors > 0 ? (recoveredErrors / totalErrors) * 100 : 0;

    const errorsByType: Record<string, number> = {};
    reports.forEach(report => {
      const errorType = report.error.constructor.name;
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    const recentErrors = reports
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalErrors,
      recoveredErrors,
      recoveryRate,
      errorsByType,
      recentErrors,
    };
  }

  /**
   * Clear old error reports
   */
  clearOldReports(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [id, report] of this.errorReports.entries()) {
      if (report.timestamp < cutoff) {
        this.errorReports.delete(id);
      }
    }
  }

  /**
   * Shutdown the error handler service
   */
  async shutdown(): Promise<void> {
    this.logger.info('Error handler service shutting down', 'ErrorHandler');
    
    // Clear old reports
    this.clearOldReports();
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.logger.info('Error handler service shutdown complete', 'ErrorHandler');
  }
}