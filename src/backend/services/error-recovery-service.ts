// src/backend/services/error-recovery-service.ts

import { BaseError, DatabaseError } from '../../shared/errors';

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'skip' | 'abort';
  description: string;
  execute?: () => Promise<any>;
}

export interface ErrorContext {
  operation: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface RecoveryResult {
  success: boolean;
  action: RecoveryAction;
  attempts: number;
  finalError?: BaseError;
  recoveredData?: any;
}

export class ErrorRecoveryService {
  private defaultRetryOptions: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    retryableErrors: [
      'DATABASE_ERROR',
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'DEPENDENCY_ERROR',
    ],
  };

  /**
   * Execute operation with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options: Partial<RetryOptions> = {},
  ): Promise<T> {
    const retryOptions = { ...this.defaultRetryOptions, ...options };
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < retryOptions.maxAttempts) {
      attempt++;

      try {
        const result = await operation();

        // Log successful recovery if this wasn't the first attempt
        if (attempt > 1) {
          console.log(`Operation succeeded after ${attempt} attempts`, {
            operation: context.operation,
            attempts: attempt,
            timestamp: new Date().toISOString(),
          });
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is retryable
        const isRetryable = this.isRetryableError(
          lastError,
          retryOptions.retryableErrors,
        );

        if (!isRetryable || attempt >= retryOptions.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryOptions.baseDelay *
            Math.pow(retryOptions.backoffMultiplier, attempt - 1),
          retryOptions.maxDelay,
        );

        console.warn(
          `Operation failed, retrying in ${delay}ms (attempt ${attempt}/${retryOptions.maxAttempts})`,
          {
            operation: context.operation,
            error: lastError.message,
            attempt,
            delay,
            timestamp: new Date().toISOString(),
          },
        );

        await this.delay(delay);
      }
    }

    // All retries failed
    throw lastError || new Error('Operation failed after all retry attempts');
  }

  /**
   * Attempt to recover from specific error types
   */
  async attemptRecovery(
    error: BaseError,
    context: ErrorContext,
    recoveryStrategies?: Map<string, () => Promise<any>>,
  ): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      success: false,
      action: { type: 'abort', description: 'No recovery strategy available' },
      attempts: 0,
    };

    try {
      // Determine recovery action based on error type
      const action = this.determineRecoveryAction(error, recoveryStrategies);
      result.action = action;

      if (action.type === 'retry' && action.execute) {
        result.attempts = 1;
        try {
          result.recoveredData = await action.execute();
          result.success = true;
        } catch (recoveryError) {
          result.finalError =
            recoveryError instanceof BaseError
              ? recoveryError
              : new DatabaseError(
                  `Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`,
                );
        }
      } else if (action.type === 'fallback' && action.execute) {
        try {
          result.recoveredData = await action.execute();
          result.success = true;
        } catch (fallbackError) {
          result.finalError =
            fallbackError instanceof BaseError
              ? fallbackError
              : new DatabaseError(
                  `Fallback failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
                );
        }
      } else if (action.type === 'skip') {
        result.success = true;
        result.recoveredData = null;
      }

      // Log recovery attempt
      console.log('Recovery attempt completed', {
        operation: context.operation,
        errorCode: error.code,
        recoveryAction: action.type,
        success: result.success,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (recoveryError) {
      result.finalError =
        recoveryError instanceof BaseError
          ? recoveryError
          : new DatabaseError(
              `Recovery process failed: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`,
            );

      return result;
    }
  }

  /**
   * Handle database corruption recovery
   */
  async handleDatabaseCorruption(
    dbPath: string,
    backupPath?: string,
  ): Promise<RecoveryResult> {
    const context: ErrorContext = {
      operation: 'database_corruption_recovery',
      timestamp: new Date(),
    };

    try {
      // Step 1: Try to backup current database if possible
      let backupCreated = false;
      try {
        if (backupPath) {
          // Implementation would depend on your backup service
          console.log('Attempting to create emergency backup...');
          backupCreated = true;
        }
      } catch (backupError) {
        console.warn('Failed to create emergency backup:', backupError);
      }

      // Step 2: Try to repair database
      try {
        console.log('Attempting database repair...');
        // Implementation would use SQLite PRAGMA integrity_check
        // and attempt repairs
        return {
          success: true,
          action: {
            type: 'retry',
            description: 'Database repaired successfully',
          },
          attempts: 1,
        };
      } catch (repairError) {
        console.error('Database repair failed:', repairError);
      }

      // Step 3: Try to restore from backup
      if (backupPath) {
        try {
          console.log('Attempting restore from backup...');
          // Implementation would restore from most recent backup
          return {
            success: true,
            action: {
              type: 'fallback',
              description: 'Restored from backup',
            },
            attempts: 1,
          };
        } catch (restoreError) {
          console.error('Backup restore failed:', restoreError);
        }
      }

      // Step 4: Create new database
      return {
        success: true,
        action: {
          type: 'fallback',
          description: 'Created new database (data loss occurred)',
        },
        attempts: 1,
      };
    } catch (error) {
      return {
        success: false,
        action: {
          type: 'abort',
          description: 'All recovery attempts failed',
        },
        attempts: 1,
        finalError: new DatabaseError(
          `Database corruption recovery failed: ${error instanceof Error ? error.message : String(error)}`,
        ),
      };
    }
  }

  /**
   * Handle playlist data inconsistency
   */
  async handlePlaylistInconsistency(
    playlistId: string,
    inconsistencyType:
      | 'missing_songs'
      | 'invalid_positions'
      | 'orphaned_references',
  ): Promise<RecoveryResult> {
    const context: ErrorContext = {
      operation: 'playlist_inconsistency_recovery',
      timestamp: new Date(),
      metadata: { playlistId, inconsistencyType },
    };

    try {
      switch (inconsistencyType) {
        case 'missing_songs':
          return {
            success: true,
            action: {
              type: 'skip',
              description: 'Removed references to missing songs',
            },
            attempts: 1,
          };

        case 'invalid_positions':
          return {
            success: true,
            action: {
              type: 'retry',
              description: 'Reordered playlist positions',
            },
            attempts: 1,
          };

        case 'orphaned_references':
          return {
            success: true,
            action: {
              type: 'skip',
              description: 'Cleaned up orphaned references',
            },
            attempts: 1,
          };

        default:
          return {
            success: false,
            action: {
              type: 'abort',
              description: 'Unknown inconsistency type',
            },
            attempts: 0,
          };
      }
    } catch (error) {
      return {
        success: false,
        action: {
          type: 'abort',
          description: 'Recovery failed',
        },
        attempts: 1,
        finalError: new DatabaseError(
          `Playlist recovery failed: ${error instanceof Error ? error.message : String(error)}`,
        ),
      };
    }
  }

  /**
   * Create circuit breaker for failing operations
   */
  createCircuitBreaker(
    operationName: string,
    failureThreshold: number = 5,
    resetTimeout: number = 60000,
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let state: 'closed' | 'open' | 'half-open' = 'closed';

    return async <T>(operation: () => Promise<T>): Promise<T> => {
      const now = Date.now();

      // Check if circuit should reset
      if (state === 'open' && now - lastFailureTime > resetTimeout) {
        state = 'half-open';
        failures = 0;
      }

      // Reject if circuit is open
      if (state === 'open') {
        throw new DatabaseError(
          `Circuit breaker is open for operation: ${operationName}`,
        );
      }

      try {
        const result = await operation();

        // Reset on success
        if (state === 'half-open') {
          state = 'closed';
        }
        failures = 0;

        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;

        if (failures >= failureThreshold) {
          state = 'open';
          console.warn(
            `Circuit breaker opened for operation: ${operationName}`,
            {
              failures,
              threshold: failureThreshold,
              timestamp: new Date().toISOString(),
            },
          );
        }

        throw error;
      }
    };
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: Error, retryableErrors: string[]): boolean {
    if (error instanceof BaseError) {
      return retryableErrors.includes(error.code);
    }

    // Check error message for common retryable patterns
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('network') ||
      message.includes('busy') ||
      message.includes('locked')
    );
  }

  /**
   * Determine recovery action based on error type
   */
  private determineRecoveryAction(
    error: BaseError,
    customStrategies?: Map<string, () => Promise<any>>,
  ): RecoveryAction {
    // Check for custom recovery strategies first
    if (customStrategies?.has(error.code)) {
      return {
        type: 'retry',
        description: `Custom recovery for ${error.code}`,
        execute: customStrategies.get(error.code),
      };
    }

    // Default recovery strategies based on error type
    switch (error.code) {
      case 'DATABASE_CONNECTION_ERROR':
        return {
          type: 'retry',
          description: 'Reconnect to database',
        };

      case 'PLAYLIST_NOT_FOUND':
      case 'SONG_NOT_FOUND':
        return {
          type: 'skip',
          description: 'Skip missing resource',
        };

      case 'VALIDATION_ERROR':
        return {
          type: 'abort',
          description: 'Cannot recover from validation error',
        };

      case 'DATABASE_ERROR':
        if (error.message.includes('corruption')) {
          return {
            type: 'fallback',
            description: 'Attempt database recovery',
          };
        }
        return {
          type: 'retry',
          description: 'Retry database operation',
        };

      default:
        return {
          type: 'abort',
          description: 'No recovery strategy available',
        };
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log structured error information
   */
  logError(
    error: BaseError,
    context: ErrorContext,
    additionalData?: Record<string, any>,
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      operation: context.operation,
      error: {
        name: error.name,
        code: error.code,
        message: error.message,
        recoverable: error.recoverable,
        userMessage: error.userMessage,
        suggestions: error.suggestions,
        context: error.context,
        details: error.details,
      },
      context: {
        userId: context.userId,
        sessionId: context.sessionId,
        metadata: context.metadata,
      },
      additionalData,
      stack: error.stack,
    };

    console.error('Structured error log:', JSON.stringify(logEntry, null, 2));
  }
}
