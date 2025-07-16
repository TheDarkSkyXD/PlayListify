// src/backend/services/youtube-import-progress-service.ts

import { EventEmitter } from 'events';
import { ValidationError } from '../../shared/errors';
import { ErrorRecoveryService } from './error-recovery-service';
import { PlaylistCrudService } from './playlist-crud-service';
import { StructuredLoggerService } from './structured-logger-service';
import {
  ExtractionProgress,
  PlaylistMetadata,
  VideoMetadata,
  YouTubeMetadataExtractionService,
} from './youtube-metadata-extraction-service';

export interface ImportJob {
  id: string;
  playlistUrl: string;
  targetPlaylistName?: string;
  userId?: string;
  sessionId?: string;
  status:
    | 'pending'
    | 'running'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled';
  progress: ImportProgress;
  result?: ImportResult;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  options: ImportOptions;
}

export interface ImportProgress {
  stage:
    | 'initializing'
    | 'validating'
    | 'extracting'
    | 'importing'
    | 'finalizing'
    | 'completed'
    | 'error';
  totalSteps: number;
  currentStep: number;
  percentage: number;
  currentOperation: string;
  videosTotal: number;
  videosProcessed: number;
  videosSkipped: number;
  videosFailed: number;
  estimatedTimeRemaining?: number; // in seconds
  throughput?: number; // videos per second
  errors: ImportError[];
  warnings: ImportWarning[];
  partialData?: {
    playlistId?: string;
    importedVideos: string[];
    failedVideos: string[];
  };
}

export interface ImportError {
  code: string;
  message: string;
  videoId?: string;
  videoTitle?: string;
  timestamp: Date;
  recoverable: boolean;
  retryCount: number;
}

export interface ImportWarning {
  code: string;
  message: string;
  videoId?: string;
  videoTitle?: string;
  timestamp: Date;
}

export interface ImportOptions {
  skipUnavailableVideos: boolean;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  createNewPlaylist: boolean;
  overwriteExisting: boolean;
  preserveOrder: boolean;
  timeout: number;
  enableRecovery: boolean;
}

export interface ImportResult {
  success: boolean;
  playlistId?: string;
  totalVideos: number;
  importedVideos: number;
  skippedVideos: number;
  failedVideos: number;
  duration: number; // in milliseconds
  errors: ImportError[];
  warnings: ImportWarning[];
  recoveryActions: string[];
}

export interface RecoveryCheckpoint {
  jobId: string;
  timestamp: Date;
  stage: string;
  processedVideos: string[];
  failedVideos: string[];
  playlistId?: string;
  metadata: any;
}

export class YouTubeImportProgressService extends EventEmitter {
  private jobs: Map<string, ImportJob> = new Map();
  private checkpoints: Map<string, RecoveryCheckpoint> = new Map();
  private defaultOptions: ImportOptions = {
    skipUnavailableVideos: true,
    maxRetries: 3,
    retryDelay: 2000,
    batchSize: 10,
    createNewPlaylist: true,
    overwriteExisting: false,
    preserveOrder: true,
    timeout: 300000, // 5 minutes
    enableRecovery: true,
  };

  constructor(
    private extractionService: YouTubeMetadataExtractionService,
    private playlistService: PlaylistCrudService,
    private logger: StructuredLoggerService,
    private recoveryService: ErrorRecoveryService,
  ) {
    super();
    this.setupEventHandlers();
  }

  /**
   * Start YouTube playlist import with progress tracking
   */
  async startImport(
    playlistUrl: string,
    options: Partial<ImportOptions> = {},
    userId?: string,
    sessionId?: string,
  ): Promise<string> {
    const jobId = this.generateJobId();
    const importOptions = { ...this.defaultOptions, ...options };

    const job: ImportJob = {
      id: jobId,
      playlistUrl,
      userId,
      sessionId,
      status: 'pending',
      progress: this.createInitialProgress(),
      createdAt: new Date(),
      options: importOptions,
    };

    this.jobs.set(jobId, job);

    // Start import process asynchronously
    this.processImport(jobId).catch(error => {
      this.handleImportError(jobId, error);
    });

    this.logger.logUserAction(
      'youtube_import_started',
      userId || 'anonymous',
      sessionId || 'unknown',
      {
        jobId,
        playlistUrl,
        options: importOptions,
      },
    );

    return jobId;
  }

  /**
   * Cancel import job
   */
  async cancelImport(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      return false;
    }

    // Cancel extraction if running
    if (job.status === 'running') {
      this.extractionService.cancelExtraction(jobId);
    }

    job.status = 'cancelled';
    job.completedAt = new Date();
    job.progress.stage = 'error';
    job.progress.currentOperation = 'Import cancelled by user';

    this.emit('importCancelled', { jobId, job });
    this.logger.info('Import cancelled', { jobId, userId: job.userId });

    return true;
  }

  /**
   * Pause import job
   */
  async pauseImport(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'running') {
      return false;
    }

    job.status = 'paused';

    // Create recovery checkpoint
    if (job.options.enableRecovery) {
      await this.createRecoveryCheckpoint(job);
    }

    this.emit('importPaused', { jobId, job });
    this.logger.info('Import paused', { jobId, userId: job.userId });

    return true;
  }

  /**
   * Resume paused import job
   */
  async resumeImport(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'paused') {
      return false;
    }

    job.status = 'running';

    // Continue from checkpoint if available
    const checkpoint = this.checkpoints.get(jobId);
    if (checkpoint) {
      await this.resumeFromCheckpoint(job, checkpoint);
    } else {
      // Restart import process
      this.processImport(jobId).catch(error => {
        this.handleImportError(jobId, error);
      });
    }

    this.emit('importResumed', { jobId, job });
    this.logger.info('Import resumed', { jobId, userId: job.userId });

    return true;
  }

  /**
   * Get import job status
   */
  getImportStatus(jobId: string): ImportJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all import jobs for user
   */
  getUserImports(userId: string): ImportJob[] {
    return Array.from(this.jobs.values()).filter(job => job.userId === userId);
  }

  /**
   * Get active import jobs
   */
  getActiveImports(): ImportJob[] {
    return Array.from(this.jobs.values()).filter(job =>
      ['pending', 'running', 'paused'].includes(job.status),
    );
  }

  /**
   * Retry failed import with recovery
   */
  async retryImport(
    jobId: string,
    recoveryOptions?: {
      skipFailedVideos?: boolean;
      useLastCheckpoint?: boolean;
      maxRetries?: number;
    },
  ): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'failed') {
      return false;
    }

    // Apply recovery options
    if (recoveryOptions?.skipFailedVideos) {
      job.options.skipUnavailableVideos = true;
    }
    if (recoveryOptions?.maxRetries) {
      job.options.maxRetries = recoveryOptions.maxRetries;
    }

    // Reset job status
    job.status = 'pending';
    job.progress = this.createInitialProgress();
    job.result = undefined;

    // Use checkpoint if requested and available
    if (recoveryOptions?.useLastCheckpoint && this.checkpoints.has(jobId)) {
      const checkpoint = this.checkpoints.get(jobId)!;
      await this.resumeFromCheckpoint(job, checkpoint);
    } else {
      // Start fresh import
      this.processImport(jobId).catch(error => {
        this.handleImportError(jobId, error);
      });
    }

    this.emit('importRetried', { jobId, job, recoveryOptions });
    this.logger.info('Import retried', {
      jobId,
      userId: job.userId,
      recoveryOptions,
    });

    return true;
  }

  /**
   * Clean up completed/failed jobs
   */
  cleanupJobs(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        ['completed', 'failed', 'cancelled'].includes(job.status) &&
        job.completedAt &&
        job.completedAt < cutoffTime
      ) {
        this.jobs.delete(jobId);
        this.checkpoints.delete(jobId);
        cleanedCount++;
      }
    }

    this.logger.info('Import jobs cleaned up', { cleanedCount, cutoffTime });
    return cleanedCount;
  }

  /**
   * Process import job
   */
  private async processImport(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const endOperation = this.logger.startOperation('process_youtube_import', {
      jobId,
      playlistUrl: job.playlistUrl,
      userId: job.userId,
    });

    try {
      job.status = 'running';
      job.startedAt = new Date();
      job.progress.stage = 'initializing';
      job.progress.currentOperation = 'Starting import process';

      this.emit('importStarted', { jobId, job });

      // Stage 1: Validation
      await this.updateProgress(job, {
        stage: 'validating',
        currentStep: 1,
        currentOperation: 'Validating YouTube URL',
      });

      // Stage 2: Extraction
      await this.updateProgress(job, {
        stage: 'extracting',
        currentStep: 2,
        currentOperation: 'Extracting playlist metadata',
      });

      const extractionResult =
        await this.extractionService.extractPlaylistMetadata(
          job.playlistUrl,
          {
            skipUnavailable: job.options.skipUnavailableVideos,
            timeout: job.options.timeout,
            maxVideos: undefined, // Extract all videos
          },
          progress => this.handleExtractionProgress(job, progress),
        );

      if (!extractionResult.success || !extractionResult.playlist) {
        throw new ValidationError(
          `Failed to extract playlist metadata: ${extractionResult.errors.join(', ')}`,
        );
      }

      // Stage 3: Importing
      await this.updateProgress(job, {
        stage: 'importing',
        currentStep: 3,
        currentOperation: 'Creating playlist and importing videos',
        videosTotal: extractionResult.playlist.videos.length,
      });

      const importResult = await this.importPlaylistData(
        job,
        extractionResult.playlist,
      );

      // Stage 4: Finalizing
      await this.updateProgress(job, {
        stage: 'finalizing',
        currentStep: 4,
        currentOperation: 'Finalizing import',
      });

      // Complete job
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = importResult;
      job.progress.stage = 'completed';
      job.progress.percentage = 100;
      job.progress.currentOperation = 'Import completed successfully';

      this.emit('importCompleted', { jobId, job, result: importResult });

      this.logger.info('YouTube import completed', {
        jobId,
        playlistId: importResult.playlistId,
        totalVideos: importResult.totalVideos,
        importedVideos: importResult.importedVideos,
        duration: importResult.duration,
      });
    } catch (error) {
      await this.handleImportError(jobId, error);
    } finally {
      endOperation();
    }
  }

  /**
   * Import playlist data to database
   */
  private async importPlaylistData(
    job: ImportJob,
    playlistMetadata: PlaylistMetadata,
  ): Promise<ImportResult> {
    const startTime = Date.now();
    const result: ImportResult = {
      success: false,
      totalVideos: playlistMetadata.videos.length,
      importedVideos: 0,
      skippedVideos: 0,
      failedVideos: 0,
      duration: 0,
      errors: [],
      warnings: [],
      recoveryActions: [],
    };

    try {
      // Create playlist
      const playlistName = job.targetPlaylistName || playlistMetadata.title;
      const playlist = await this.playlistService.createPlaylist({
        name: playlistName,
        description: playlistMetadata.description,
      });

      result.playlistId = playlist.id;

      // Create recovery checkpoint
      if (job.options.enableRecovery) {
        await this.createRecoveryCheckpoint(job, {
          playlistId: playlist.id,
          processedVideos: [],
          failedVideos: [],
        });
      }

      // Import videos in batches
      const videos = playlistMetadata.videos;
      const batchSize = job.options.batchSize;

      for (let i = 0; i < videos.length; i += batchSize) {
        if (job.status === 'cancelled') {
          break;
        }

        const batch = videos.slice(i, Math.min(i + batchSize, videos.length));
        await this.processBatch(job, playlist.id, batch, result, i);

        // Update checkpoint
        if (job.options.enableRecovery && i % (batchSize * 2) === 0) {
          await this.updateRecoveryCheckpoint(job, result);
        }
      }

      result.success =
        result.failedVideos === 0 || job.options.skipUnavailableVideos;
      result.duration = Date.now() - startTime;

      return result;
    } catch (error) {
      result.duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result.errors.push({
        code: 'IMPORT_FAILED',
        message: errorMessage,
        timestamp: new Date(),
        recoverable: true,
        retryCount: 0,
      });

      throw error;
    }
  }

  /**
   * Process batch of videos
   */
  private async processBatch(
    job: ImportJob,
    playlistId: string,
    videos: VideoMetadata[],
    result: ImportResult,
    batchStartIndex: number,
  ): Promise<void> {
    for (let i = 0; i < videos.length; i++) {
      if (job.status === 'cancelled') {
        break;
      }

      const video = videos[i];
      const videoIndex = batchStartIndex + i;

      try {
        // Create song record
        const song = await this.playlistService.createSong({
          title: video.title,
          artist: video.uploader,
          duration: video.duration,
        });

        // Add to playlist
        await this.playlistService.addSongToPlaylist({
          playlistId,
          songId: song.id,
          position: job.options.preserveOrder ? videoIndex + 1 : undefined,
        });

        result.importedVideos++;

        // Update progress
        await this.updateProgress(job, {
          videosProcessed:
            result.importedVideos + result.skippedVideos + result.failedVideos,
          currentOperation: `Imported: ${video.title}`,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (job.options.skipUnavailableVideos) {
          result.skippedVideos++;
          result.warnings.push({
            code: 'VIDEO_SKIPPED',
            message: errorMessage,
            videoId: video.id,
            videoTitle: video.title,
            timestamp: new Date(),
          });
        } else {
          result.failedVideos++;
          result.errors.push({
            code: 'VIDEO_IMPORT_FAILED',
            message: errorMessage,
            videoId: video.id,
            videoTitle: video.title,
            timestamp: new Date(),
            recoverable: true,
            retryCount: 0,
          });
        }

        // Update progress
        await this.updateProgress(job, {
          videosProcessed:
            result.importedVideos + result.skippedVideos + result.failedVideos,
          currentOperation: `Failed: ${video.title}`,
        });
      }
    }
  }

  /**
   * Handle extraction progress updates
   */
  private handleExtractionProgress(
    job: ImportJob,
    progress: ExtractionProgress,
  ): void {
    job.progress.videosTotal = progress.totalVideos;
    job.progress.videosProcessed = progress.processedVideos;
    job.progress.currentOperation = `Extracting metadata: ${progress.currentVideo || 'Processing...'}`;
    job.progress.percentage = Math.round(
      (progress.processedVideos / Math.max(progress.totalVideos, 1)) * 50,
    ); // 50% for extraction phase

    this.emit('importProgress', { jobId: job.id, progress: job.progress });
  }

  /**
   * Update job progress
   */
  private async updateProgress(
    job: ImportJob,
    updates: Partial<ImportProgress>,
  ): Promise<void> {
    Object.assign(job.progress, updates);

    // Calculate percentage based on stage
    if (updates.stage) {
      const stagePercentages = {
        initializing: 5,
        validating: 10,
        extracting: 50,
        importing: 90,
        finalizing: 95,
        completed: 100,
      };
      job.progress.percentage =
        stagePercentages[updates.stage] || job.progress.percentage;
    }

    this.emit('importProgress', { jobId: job.id, progress: job.progress });
  }

  /**
   * Handle import errors
   */
  private async handleImportError(jobId: string, error: any): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.completedAt = new Date();
    job.progress.stage = 'error';

    const errorMessage = error instanceof Error ? error.message : String(error);
    job.progress.errors.push({
      code: error.code || 'UNKNOWN_ERROR',
      message: errorMessage,
      timestamp: new Date(),
      recoverable: error.recoverable !== false,
      retryCount: 0,
    });

    // Attempt recovery if enabled
    if (job.options.enableRecovery) {
      const recoveryResult = await this.recoveryService.attemptRecovery(
        error,
        {
          operation: 'youtube_import',
          userId: job.userId,
          sessionId: job.sessionId,
        },
        new Map([
          ['NETWORK_ERROR', () => this.retryImport(jobId, { maxRetries: 1 })],
          [
            'VALIDATION_ERROR',
            () => this.retryImport(jobId, { skipFailedVideos: true }),
          ],
        ]),
      );

      if (recoveryResult.success) {
        job.result?.recoveryActions.push(recoveryResult.action.description);
      }
    }

    this.emit('importFailed', { jobId, job, error: errorMessage });
    this.logger.error('YouTube import failed', error, {
      jobId,
      userId: job.userId,
    });
  }

  /**
   * Create recovery checkpoint
   */
  private async createRecoveryCheckpoint(
    job: ImportJob,
    data?: any,
  ): Promise<void> {
    const checkpoint: RecoveryCheckpoint = {
      jobId: job.id,
      timestamp: new Date(),
      stage: job.progress.stage,
      processedVideos: data?.processedVideos || [],
      failedVideos: data?.failedVideos || [],
      playlistId: data?.playlistId,
      metadata: data || {},
    };

    this.checkpoints.set(job.id, checkpoint);
  }

  /**
   * Update recovery checkpoint
   */
  private async updateRecoveryCheckpoint(
    job: ImportJob,
    result: ImportResult,
  ): Promise<void> {
    const checkpoint = this.checkpoints.get(job.id);
    if (checkpoint) {
      checkpoint.timestamp = new Date();
      checkpoint.stage = job.progress.stage;
      checkpoint.metadata = { result };
    }
  }

  /**
   * Resume from checkpoint
   */
  private async resumeFromCheckpoint(
    job: ImportJob,
    checkpoint: RecoveryCheckpoint,
  ): Promise<void> {
    // Implementation would resume from the checkpoint data
    // For now, just log the resume attempt
    this.logger.info('Resuming import from checkpoint', {
      jobId: job.id,
      checkpointStage: checkpoint.stage,
      checkpointTime: checkpoint.timestamp,
    });

    // Continue with normal import process
    this.processImport(job.id).catch(error => {
      this.handleImportError(job.id, error);
    });
  }

  /**
   * Create initial progress object
   */
  private createInitialProgress(): ImportProgress {
    return {
      stage: 'initializing',
      totalSteps: 4,
      currentStep: 0,
      percentage: 0,
      currentOperation: 'Initializing import',
      videosTotal: 0,
      videosProcessed: 0,
      videosSkipped: 0,
      videosFailed: 0,
      errors: [],
      warnings: [],
    };
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('importProgress', data => {
      // Could emit to IPC or WebSocket for real-time UI updates
    });

    this.on('importCompleted', data => {
      // Could trigger notifications or cleanup
    });

    this.on('importFailed', data => {
      // Could trigger error notifications
    });
  }

  /**
   * Get import statistics
   */
  getImportStats(): {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageDuration: number;
    successRate: number;
  } {
    const jobs = Array.from(this.jobs.values());
    const completedJobs = jobs.filter(job => job.status === 'completed');
    const failedJobs = jobs.filter(job => job.status === 'failed');
    const activeJobs = jobs.filter(job =>
      ['pending', 'running', 'paused'].includes(job.status),
    );

    const totalDuration = completedJobs.reduce(
      (sum, job) => sum + (job.result?.duration || 0),
      0,
    );
    const averageDuration =
      completedJobs.length > 0 ? totalDuration / completedJobs.length : 0;
    const successRate =
      jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0;

    return {
      totalJobs: jobs.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      averageDuration,
      successRate,
    };
  }
}
