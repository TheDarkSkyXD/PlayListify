// src/backend/ipc/youtube-import-ipc-handlers.ts

import { BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import { BaseError, ValidationError } from '../../shared/errors';
import {
  DatabaseService,
  YouTubeImportProgressService,
  YouTubeMetadataExtractionService,
  YouTubeUrlValidationService,
} from '../services';
import { StructuredLoggerService } from '../services/structured-logger-service';
import {
  ImportJob,
  ImportOptions,
  ValidationResult,
  YouTubePlaylistPreview,
} from '../services/youtube-url-validation-service';
import { IPCRequest, IPCResponse } from './playlist-ipc-handlers';

// YouTube Import Request Types
export interface ValidateUrlRequest {
  url: string;
}

export interface GetPlaylistPreviewRequest {
  playlistId: string;
}

export interface StartImportRequest {
  playlistUrl: string;
  targetPlaylistName?: string;
  options?: Partial<ImportOptions>;
}

export interface ImportControlRequest {
  jobId: string;
}

export interface GetImportStatusRequest {
  jobId: string;
}

export interface GetUserImportsRequest {
  userId: string;
}

export interface RetryImportRequest {
  jobId: string;
  recoveryOptions?: {
    skipFailedVideos?: boolean;
    useLastCheckpoint?: boolean;
    maxRetries?: number;
  };
}

export interface BatchValidateRequest {
  urls: string[];
}

export class YouTubeImportIPCHandlers {
  private logger: StructuredLoggerService;
  private urlValidationService: YouTubeUrlValidationService;
  private metadataExtractionService: YouTubeMetadataExtractionService;
  private importProgressService: YouTubeImportProgressService;
  private mainWindow: BrowserWindow | null = null;

  constructor(
    databaseService: DatabaseService,
    logger?: StructuredLoggerService,
  ) {
    this.logger = logger || new StructuredLoggerService();
    this.urlValidationService = new YouTubeUrlValidationService(this.logger);
    this.metadataExtractionService = new YouTubeMetadataExtractionService(
      this.logger,
    );
    this.importProgressService = new YouTubeImportProgressService(
      this.metadataExtractionService,
      databaseService.getPlaylistRepository() as any, // Type assertion for compatibility
      this.logger,
      new (require('../services/error-recovery-service').ErrorRecoveryService)(),
    );

    this.setupProgressEventHandlers();
  }

  /**
   * Set main window for real-time updates
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Register all YouTube import IPC handlers
   */
  registerHandlers(): void {
    // URL validation and preview
    ipcMain.handle('youtube:validateUrl', this.handleValidateUrl.bind(this));
    ipcMain.handle(
      'youtube:batchValidateUrls',
      this.handleBatchValidateUrls.bind(this),
    );
    ipcMain.handle(
      'youtube:getPlaylistPreview',
      this.handleGetPlaylistPreview.bind(this),
    );
    ipcMain.handle(
      'youtube:getRateLimitStatus',
      this.handleGetRateLimitStatus.bind(this),
    );

    // Import operations
    ipcMain.handle('youtube:startImport', this.handleStartImport.bind(this));
    ipcMain.handle('youtube:cancelImport', this.handleCancelImport.bind(this));
    ipcMain.handle('youtube:pauseImport', this.handlePauseImport.bind(this));
    ipcMain.handle('youtube:resumeImport', this.handleResumeImport.bind(this));
    ipcMain.handle('youtube:retryImport', this.handleRetryImport.bind(this));

    // Status and monitoring
    ipcMain.handle(
      'youtube:getImportStatus',
      this.handleGetImportStatus.bind(this),
    );
    ipcMain.handle(
      'youtube:getUserImports',
      this.handleGetUserImports.bind(this),
    );
    ipcMain.handle(
      'youtube:getActiveImports',
      this.handleGetActiveImports.bind(this),
    );
    ipcMain.handle(
      'youtube:getImportStats',
      this.handleGetImportStats.bind(this),
    );

    // Cleanup and maintenance
    ipcMain.handle('youtube:cleanupJobs', this.handleCleanupJobs.bind(this));

    this.logger.info('YouTube import IPC handlers registered');
  }

  /**
   * Unregister all YouTube import IPC handlers
   */
  unregisterHandlers(): void {
    const channels = [
      'youtube:validateUrl',
      'youtube:batchValidateUrls',
      'youtube:getPlaylistPreview',
      'youtube:getRateLimitStatus',
      'youtube:startImport',
      'youtube:cancelImport',
      'youtube:pauseImport',
      'youtube:resumeImport',
      'youtube:retryImport',
      'youtube:getImportStatus',
      'youtube:getUserImports',
      'youtube:getActiveImports',
      'youtube:getImportStats',
      'youtube:cleanupJobs',
    ];

    channels.forEach(channel => {
      ipcMain.removeAllListeners(channel);
    });

    this.logger.info('YouTube import IPC handlers unregistered');
  }

  // URL Validation and Preview Handlers

  private async handleValidateUrl(
    event: IpcMainInvokeEvent,
    request: IPCRequest<ValidateUrlRequest>,
  ): Promise<IPCResponse<ValidationResult>> {
    return this.executeWithErrorHandling(
      'youtube:validateUrl',
      request,
      async () => {
        return this.urlValidationService.validateUrl(
          request.data.url,
          request.userId || 'anonymous',
        );
      },
    );
  }

  private async handleBatchValidateUrls(
    event: IpcMainInvokeEvent,
    request: IPCRequest<BatchValidateRequest>,
  ): Promise<IPCResponse<ValidationResult[]>> {
    return this.executeWithErrorHandling(
      'youtube:batchValidateUrls',
      request,
      async () => {
        return await this.urlValidationService.batchValidateUrls(
          request.data.urls,
          request.userId || 'anonymous',
        );
      },
    );
  }

  private async handleGetPlaylistPreview(
    event: IpcMainInvokeEvent,
    request: IPCRequest<GetPlaylistPreviewRequest>,
  ): Promise<IPCResponse<YouTubePlaylistPreview | null>> {
    return this.executeWithErrorHandling(
      'youtube:getPlaylistPreview',
      request,
      async () => {
        return await this.urlValidationService.getPlaylistPreview(
          request.data.playlistId,
          request.userId || 'anonymous',
        );
      },
    );
  }

  private async handleGetRateLimitStatus(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{}>,
  ): Promise<IPCResponse<any>> {
    return this.executeWithErrorHandling(
      'youtube:getRateLimitStatus',
      request,
      async () => {
        return this.urlValidationService.getRateLimitStatus(
          request.userId || 'anonymous',
        );
      },
    );
  }

  // Import Operation Handlers

  private async handleStartImport(
    event: IpcMainInvokeEvent,
    request: IPCRequest<StartImportRequest>,
  ): Promise<IPCResponse<string>> {
    return this.executeWithErrorHandling(
      'youtube:startImport',
      request,
      async () => {
        // Validate URL first
        const validation = this.urlValidationService.validateUrl(
          request.data.playlistUrl,
          request.userId || 'anonymous',
        );

        if (!validation.isValid) {
          throw new ValidationError(
            `Invalid YouTube URL: ${validation.errors.join(', ')}`,
          );
        }

        if (validation.urlInfo.type !== 'playlist') {
          throw new ValidationError(
            'Only playlist URLs are supported for import',
          );
        }

        // Start import
        const jobId = await this.importProgressService.startImport(
          request.data.playlistUrl,
          request.data.options,
          request.userId,
          request.sessionId,
        );

        // Send initial status to frontend
        this.sendImportUpdate('importStarted', { jobId });

        return jobId;
      },
    );
  }

  private async handleCancelImport(
    event: IpcMainInvokeEvent,
    request: IPCRequest<ImportControlRequest>,
  ): Promise<IPCResponse<boolean>> {
    return this.executeWithErrorHandling(
      'youtube:cancelImport',
      request,
      async () => {
        const result = await this.importProgressService.cancelImport(
          request.data.jobId,
        );

        if (result) {
          this.sendImportUpdate('importCancelled', {
            jobId: request.data.jobId,
          });
        }

        return result;
      },
    );
  }

  private async handlePauseImport(
    event: IpcMainInvokeEvent,
    request: IPCRequest<ImportControlRequest>,
  ): Promise<IPCResponse<boolean>> {
    return this.executeWithErrorHandling(
      'youtube:pauseImport',
      request,
      async () => {
        const result = await this.importProgressService.pauseImport(
          request.data.jobId,
        );

        if (result) {
          this.sendImportUpdate('importPaused', { jobId: request.data.jobId });
        }

        return result;
      },
    );
  }

  private async handleResumeImport(
    event: IpcMainInvokeEvent,
    request: IPCRequest<ImportControlRequest>,
  ): Promise<IPCResponse<boolean>> {
    return this.executeWithErrorHandling(
      'youtube:resumeImport',
      request,
      async () => {
        const result = await this.importProgressService.resumeImport(
          request.data.jobId,
        );

        if (result) {
          this.sendImportUpdate('importResumed', { jobId: request.data.jobId });
        }

        return result;
      },
    );
  }

  private async handleRetryImport(
    event: IpcMainInvokeEvent,
    request: IPCRequest<RetryImportRequest>,
  ): Promise<IPCResponse<boolean>> {
    return this.executeWithErrorHandling(
      'youtube:retryImport',
      request,
      async () => {
        const result = await this.importProgressService.retryImport(
          request.data.jobId,
          request.data.recoveryOptions,
        );

        if (result) {
          this.sendImportUpdate('importRetried', {
            jobId: request.data.jobId,
            recoveryOptions: request.data.recoveryOptions,
          });
        }

        return result;
      },
    );
  }

  // Status and Monitoring Handlers

  private async handleGetImportStatus(
    event: IpcMainInvokeEvent,
    request: IPCRequest<GetImportStatusRequest>,
  ): Promise<IPCResponse<ImportJob | null>> {
    return this.executeWithErrorHandling(
      'youtube:getImportStatus',
      request,
      async () => {
        return this.importProgressService.getImportStatus(request.data.jobId);
      },
    );
  }

  private async handleGetUserImports(
    event: IpcMainInvokeEvent,
    request: IPCRequest<GetUserImportsRequest>,
  ): Promise<IPCResponse<ImportJob[]>> {
    return this.executeWithErrorHandling(
      'youtube:getUserImports',
      request,
      async () => {
        return this.importProgressService.getUserImports(request.data.userId);
      },
    );
  }

  private async handleGetActiveImports(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{}>,
  ): Promise<IPCResponse<ImportJob[]>> {
    return this.executeWithErrorHandling(
      'youtube:getActiveImports',
      request,
      async () => {
        return this.importProgressService.getActiveImports();
      },
    );
  }

  private async handleGetImportStats(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{}>,
  ): Promise<IPCResponse<any>> {
    return this.executeWithErrorHandling(
      'youtube:getImportStats',
      request,
      async () => {
        return this.importProgressService.getImportStats();
      },
    );
  }

  // Cleanup and Maintenance Handlers

  private async handleCleanupJobs(
    event: IpcMainInvokeEvent,
    request: IPCRequest<{ olderThanHours?: number }>,
  ): Promise<IPCResponse<number>> {
    return this.executeWithErrorHandling(
      'youtube:cleanupJobs',
      request,
      async () => {
        return this.importProgressService.cleanupJobs(
          request.data.olderThanHours || 24,
        );
      },
    );
  }

  // Event Handling and Real-time Updates

  /**
   * Setup event handlers for import progress updates
   */
  private setupProgressEventHandlers(): void {
    // Import started
    this.importProgressService.on('importStarted', data => {
      this.sendImportUpdate('importStarted', data);
      this.logger.info('Import started event', { jobId: data.jobId });
    });

    // Import progress updates
    this.importProgressService.on('importProgress', data => {
      this.sendImportUpdate('importProgress', data);

      // Log significant progress milestones
      if (data.progress.percentage % 25 === 0) {
        this.logger.info('Import progress milestone', {
          jobId: data.jobId,
          percentage: data.progress.percentage,
          stage: data.progress.stage,
        });
      }
    });

    // Import completed
    this.importProgressService.on('importCompleted', data => {
      this.sendImportUpdate('importCompleted', data);
      this.logger.info('Import completed event', {
        jobId: data.jobId,
        result: data.result,
      });
    });

    // Import failed
    this.importProgressService.on('importFailed', data => {
      this.sendImportUpdate('importFailed', data);
      this.logger.error('Import failed event', new Error(data.error), {
        jobId: data.jobId,
      });
    });

    // Import cancelled
    this.importProgressService.on('importCancelled', data => {
      this.sendImportUpdate('importCancelled', data);
      this.logger.info('Import cancelled event', { jobId: data.jobId });
    });

    // Import paused
    this.importProgressService.on('importPaused', data => {
      this.sendImportUpdate('importPaused', data);
      this.logger.info('Import paused event', { jobId: data.jobId });
    });

    // Import resumed
    this.importProgressService.on('importResumed', data => {
      this.sendImportUpdate('importResumed', data);
      this.logger.info('Import resumed event', { jobId: data.jobId });
    });

    // Import retried
    this.importProgressService.on('importRetried', data => {
      this.sendImportUpdate('importRetried', data);
      this.logger.info('Import retried event', {
        jobId: data.jobId,
        recoveryOptions: data.recoveryOptions,
      });
    });
  }

  /**
   * Send real-time updates to frontend
   */
  private sendImportUpdate(eventType: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('youtube-import-update', {
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Utility Methods

  /**
   * Execute operation with comprehensive error handling
   */
  private async executeWithErrorHandling<T>(
    operation: string,
    request: IPCRequest,
    handler: () => Promise<T>,
  ): Promise<IPCResponse<T>> {
    const startTime = Date.now();

    try {
      // Log operation start
      this.logger.logUserAction(
        operation,
        request.userId || 'anonymous',
        request.sessionId || 'unknown',
        { requestId: request.requestId },
      );

      // Execute handler
      const result = await handler();

      // Log successful operation
      const duration = Date.now() - startTime;
      this.logger.info(`YouTube IPC operation completed: ${operation}`, {
        operation,
        duration,
        userId: request.userId,
        requestId: request.requestId,
      });

      return {
        success: true,
        data: result,
        requestId: request.requestId,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      this.logger.error(
        `YouTube IPC operation failed: ${operation}`,
        error instanceof Error ? error : new Error(String(error)),
        {
          operation,
          duration,
          userId: request.userId,
          requestId: request.requestId,
          requestData: this.sanitizeRequestData(request.data),
        },
      );

      // Format error for IPC response
      const formattedError = this.formatErrorForIPC(error);

      return {
        success: false,
        error: formattedError,
        requestId: request.requestId,
      };
    }
  }

  /**
   * Format error for IPC transmission
   */
  private formatErrorForIPC(error: any): {
    code: string;
    message: string;
    userMessage?: string;
    suggestions?: string[];
    recoverable?: boolean;
  } {
    if (error instanceof BaseError) {
      return {
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        suggestions: error.suggestions,
        recoverable: error.recoverable,
      };
    }

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('rate limit')) {
        return {
          code: 'RATE_LIMIT_EXCEEDED',
          message: error.message,
          userMessage: 'Too many requests. Please wait a moment and try again.',
          suggestions: [
            'Wait a few minutes before trying again',
            'Reduce the frequency of requests',
          ],
          recoverable: true,
        };
      }

      if (
        error.message.includes('network') ||
        error.message.includes('timeout')
      ) {
        return {
          code: 'NETWORK_ERROR',
          message: error.message,
          userMessage:
            'Network error occurred. Please check your internet connection.',
          suggestions: [
            'Check your internet connection',
            'Try again in a few moments',
          ],
          recoverable: true,
        };
      }

      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        userMessage: 'An unexpected error occurred. Please try again.',
        suggestions: [
          'Try refreshing the application',
          'Check your internet connection',
        ],
        recoverable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      userMessage: 'An unexpected error occurred. Please try again.',
      recoverable: true,
    };
  }

  /**
   * Sanitize request data for logging (remove sensitive information)
   */
  private sanitizeRequestData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };

    // Remove potentially sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Truncate long URLs for logging
    if (sanitized.url && sanitized.url.length > 200) {
      sanitized.url = sanitized.url.substring(0, 200) + '...';
    }

    if (sanitized.playlistUrl && sanitized.playlistUrl.length > 200) {
      sanitized.playlistUrl = sanitized.playlistUrl.substring(0, 200) + '...';
    }

    return sanitized;
  }

  /**
   * Get handler statistics
   */
  getHandlerStats(): {
    activeImports: number;
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  } {
    // In a real implementation, you'd track these statistics
    return {
      activeImports: this.importProgressService.getActiveImports().length,
      totalRequests: 0,
      errorRate: 0,
      averageResponseTime: 0,
    };
  }
}
