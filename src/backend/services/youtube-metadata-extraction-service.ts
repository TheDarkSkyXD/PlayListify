// src/backend/services/youtube-metadata-extraction-service.ts

import { ChildProcess, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import {
  DependencyError,
  NetworkError,
  TimeoutError,
} from '../../shared/errors';
import { StructuredLoggerService } from './structured-logger-service';

export interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  duration: number; // in seconds
  thumbnailUrl?: string;
  uploadDate?: string;
  uploader: string;
  uploaderUrl?: string;
  viewCount?: number;
  likeCount?: number;
  isLive?: boolean;
  isPrivate?: boolean;
  isDeleted?: boolean;
  isUnavailable?: boolean;
  unavailableReason?: string;
  formats?: VideoFormat[];
}

export interface VideoFormat {
  formatId: string;
  ext: string;
  quality: string;
  filesize?: number;
  url: string;
}

export interface PlaylistMetadata {
  id: string;
  title: string;
  description?: string;
  uploader: string;
  uploaderUrl?: string;
  thumbnailUrl?: string;
  videoCount: number;
  totalDuration: number; // in seconds
  createdAt?: string;
  updatedAt?: string;
  isPrivate: boolean;
  videos: VideoMetadata[];
}

export interface ExtractionOptions {
  includeFormats?: boolean;
  maxVideos?: number;
  skipUnavailable?: boolean;
  extractComments?: boolean;
  extractSubtitles?: boolean;
  timeout?: number; // in milliseconds
  retryAttempts?: number;
}

export interface ExtractionProgress {
  stage:
    | 'initializing'
    | 'extracting_playlist'
    | 'extracting_videos'
    | 'processing'
    | 'completed'
    | 'error';
  totalVideos: number;
  processedVideos: number;
  currentVideo?: string;
  percentage: number;
  estimatedTimeRemaining?: number; // in seconds
  errors: string[];
  warnings: string[];
}

export interface ExtractionResult {
  success: boolean;
  playlist?: PlaylistMetadata;
  errors: string[];
  warnings: string[];
  partialData?: Partial<PlaylistMetadata>;
  extractionTime: number; // in milliseconds
}

export class YouTubeMetadataExtractionService {
  private logger: StructuredLoggerService;
  private ytDlpPath: string;
  private tempDir: string;
  private activeExtractions: Map<string, ChildProcess> = new Map();

  constructor(
    logger?: StructuredLoggerService,
    ytDlpPath?: string,
    tempDir?: string,
  ) {
    this.logger = logger || new StructuredLoggerService();
    this.ytDlpPath = ytDlpPath || 'yt-dlp';
    this.tempDir =
      tempDir || path.join(process.cwd(), 'temp', 'youtube-extraction');
    this.ensureTempDirectory();
  }

  /**
   * Extract playlist metadata with progress tracking
   */
  async extractPlaylistMetadata(
    playlistUrl: string,
    options: ExtractionOptions = {},
    progressCallback?: (progress: ExtractionProgress) => void,
  ): Promise<ExtractionResult> {
    const extractionId = this.generateExtractionId();
    const startTime = Date.now();

    const endOperation = this.logger.startOperation(
      'extract_playlist_metadata',
      {
        playlistUrl,
        extractionId,
        options,
      },
    );

    const result: ExtractionResult = {
      success: false,
      errors: [],
      warnings: [],
      extractionTime: 0,
    };

    try {
      // Validate yt-dlp availability
      await this.validateYtDlpAvailability();

      // Initialize progress
      const progress: ExtractionProgress = {
        stage: 'initializing',
        totalVideos: 0,
        processedVideos: 0,
        percentage: 0,
        errors: [],
        warnings: [],
      };

      progressCallback?.(progress);

      // Extract playlist information first
      progress.stage = 'extracting_playlist';
      progressCallback?.(progress);

      const playlistInfo = await this.extractPlaylistInfo(
        playlistUrl,
        extractionId,
        options,
      );

      if (!playlistInfo) {
        result.errors.push('Failed to extract playlist information');
        return result;
      }

      progress.totalVideos = playlistInfo.videoCount;
      progress.stage = 'extracting_videos';
      progressCallback?.(progress);

      // Extract individual video metadata
      const videos: VideoMetadata[] = [];
      const maxVideos = options.maxVideos || playlistInfo.videoCount;
      const videosToProcess = Math.min(maxVideos, playlistInfo.videoCount);

      for (let i = 0; i < videosToProcess; i++) {
        try {
          const videoUrl = `https://www.youtube.com/watch?v=${playlistInfo.videos[i]?.id}&list=${playlistInfo.id}`;
          const videoMetadata = await this.extractVideoMetadata(
            videoUrl,
            extractionId,
            options,
          );

          if (videoMetadata) {
            videos.push(videoMetadata);
          } else if (!options.skipUnavailable) {
            result.warnings.push(
              `Failed to extract metadata for video ${i + 1}`,
            );
          }

          progress.processedVideos = i + 1;
          progress.percentage = Math.round(
            (progress.processedVideos / videosToProcess) * 100,
          );
          progress.currentVideo = videoMetadata?.title || `Video ${i + 1}`;

          // Estimate remaining time
          const elapsed = Date.now() - startTime;
          const avgTimePerVideo = elapsed / (i + 1);
          progress.estimatedTimeRemaining = Math.round(
            ((videosToProcess - i - 1) * avgTimePerVideo) / 1000,
          );

          progressCallback?.(progress);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          result.warnings.push(
            `Error extracting video ${i + 1}: ${errorMessage}`,
          );

          if (!options.skipUnavailable) {
            progress.errors.push(errorMessage);
          }
        }
      }

      // Finalize playlist metadata
      const finalPlaylist: PlaylistMetadata = {
        ...playlistInfo,
        videos,
        videoCount: videos.length,
        totalDuration: videos.reduce(
          (sum, video) => sum + (video.duration || 0),
          0,
        ),
      };

      progress.stage = 'completed';
      progress.percentage = 100;
      progressCallback?.(progress);

      result.success = true;
      result.playlist = finalPlaylist;
      result.extractionTime = Date.now() - startTime;

      this.logger.info('Playlist metadata extraction completed', {
        playlistId: finalPlaylist.id,
        videoCount: finalPlaylist.videos.length,
        extractionTime: result.extractionTime,
        warnings: result.warnings.length,
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      result.extractionTime = Date.now() - startTime;

      this.logger.error(
        'Playlist metadata extraction failed',
        error instanceof Error ? error : new Error(errorMessage),
        {
          playlistUrl,
          extractionId,
          extractionTime: result.extractionTime,
        },
      );

      // Try to provide partial data if available
      if (progressCallback) {
        const errorProgress: ExtractionProgress = {
          stage: 'error',
          totalVideos: 0,
          processedVideos: 0,
          percentage: 0,
          errors: [errorMessage],
          warnings: result.warnings,
        };
        progressCallback(errorProgress);
      }

      return result;
    } finally {
      endOperation();
      this.cleanup(extractionId);
    }
  }

  /**
   * Extract single video metadata
   */
  async extractVideoMetadata(
    videoUrl: string,
    extractionId?: string,
    options: ExtractionOptions = {},
  ): Promise<VideoMetadata | null> {
    const id = extractionId || this.generateExtractionId();

    try {
      const args = ['--dump-json', '--no-playlist', '--no-warnings', videoUrl];

      if (options.timeout) {
        args.push('--socket-timeout', (options.timeout / 1000).toString());
      }

      const output = await this.executeYtDlp(args, id, options.timeout);
      const videoData = JSON.parse(output);

      return this.parseVideoMetadata(videoData);
    } catch (error) {
      this.logger.warn('Failed to extract video metadata', {
        videoUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Cancel ongoing extraction
   */
  cancelExtraction(extractionId: string): boolean {
    const process = this.activeExtractions.get(extractionId);
    if (process) {
      process.kill('SIGTERM');
      this.activeExtractions.delete(extractionId);
      this.cleanup(extractionId);

      this.logger.info('Extraction cancelled', { extractionId });
      return true;
    }
    return false;
  }

  /**
   * Get list of active extractions
   */
  getActiveExtractions(): string[] {
    return Array.from(this.activeExtractions.keys());
  }

  /**
   * Validate yt-dlp availability
   */
  private async validateYtDlpAvailability(): Promise<void> {
    try {
      const output = await this.executeYtDlp(['--version'], 'validation', 5000);
      this.logger.debug('yt-dlp version check', { version: output.trim() });
    } catch (error) {
      throw new DependencyError(
        'yt-dlp is not available or not working properly. Please ensure yt-dlp is installed and accessible.',
        'YTDLP_NOT_AVAILABLE',
        {
          suggestions: [
            'Install yt-dlp using pip: pip install yt-dlp',
            'Ensure yt-dlp is in your system PATH',
            'Check if yt-dlp executable has proper permissions',
          ],
        },
      );
    }
  }

  /**
   * Extract basic playlist information
   */
  private async extractPlaylistInfo(
    playlistUrl: string,
    extractionId: string,
    options: ExtractionOptions,
  ): Promise<Partial<PlaylistMetadata> | null> {
    try {
      const args = [
        '--dump-json',
        '--flat-playlist',
        '--no-warnings',
        playlistUrl,
      ];

      if (options.timeout) {
        args.push('--socket-timeout', (options.timeout / 1000).toString());
      }

      const output = await this.executeYtDlp(
        args,
        extractionId,
        options.timeout,
      );
      const lines = output
        .trim()
        .split('\n')
        .filter(line => line.trim());

      if (lines.length === 0) {
        return null;
      }

      // Parse playlist entries
      const entries = lines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(entry => entry !== null);

      if (entries.length === 0) {
        return null;
      }

      // Extract playlist metadata from first entry or playlist info
      const playlistEntry =
        entries.find(entry => entry._type === 'playlist') || entries[0];

      return {
        id: this.extractPlaylistId(playlistUrl),
        title: playlistEntry.title || 'Unknown Playlist',
        description: playlistEntry.description,
        uploader: playlistEntry.uploader || playlistEntry.channel || 'Unknown',
        uploaderUrl: playlistEntry.uploader_url || playlistEntry.channel_url,
        thumbnailUrl: playlistEntry.thumbnail,
        videoCount: entries.filter(entry => entry._type !== 'playlist').length,
        totalDuration: 0,
        isPrivate: false,
        videos: entries
          .filter(entry => entry._type !== 'playlist')
          .map(entry => ({
            id: entry.id,
            title: entry.title || 'Unknown Video',
            duration: entry.duration || 0,
            uploader: entry.uploader || 'Unknown',
          })) as VideoMetadata[],
      };
    } catch (error) {
      this.logger.error(
        'Failed to extract playlist info',
        error instanceof Error ? error : new Error(String(error)),
        {
          playlistUrl,
          extractionId,
        },
      );
      return null;
    }
  }

  /**
   * Execute yt-dlp command
   */
  private async executeYtDlp(
    args: string[],
    extractionId: string,
    timeout: number = 30000,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.ytDlpPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: this.tempDir,
      });

      this.activeExtractions.set(extractionId, process);

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', data => {
        stdout += data.toString();
      });

      process.stderr?.on('data', data => {
        stderr += data.toString();
      });

      const timeoutHandle = setTimeout(() => {
        process.kill('SIGTERM');
        reject(
          new TimeoutError(`yt-dlp operation timed out after ${timeout}ms`),
        );
      }, timeout);

      process.on('close', code => {
        clearTimeout(timeoutHandle);
        this.activeExtractions.delete(extractionId);

        if (code === 0) {
          resolve(stdout);
        } else {
          reject(
            new NetworkError(
              'YTDLP_ERROR',
              `yt-dlp exited with code ${code}: ${stderr}`,
            ),
          );
        }
      });

      process.on('error', error => {
        clearTimeout(timeoutHandle);
        this.activeExtractions.delete(extractionId);
        reject(
          new DependencyError(
            `Failed to execute yt-dlp: ${error.message}`,
            'YTDLP_EXECUTION_ERROR',
          ),
        );
      });
    });
  }

  /**
   * Parse video metadata from yt-dlp output
   */
  private parseVideoMetadata(data: any): VideoMetadata {
    return {
      id: data.id,
      title: data.title || 'Unknown Video',
      description: data.description,
      duration: data.duration || 0,
      thumbnailUrl: data.thumbnail,
      uploadDate: data.upload_date,
      uploader: data.uploader || data.channel || 'Unknown',
      uploaderUrl: data.uploader_url || data.channel_url,
      viewCount: data.view_count,
      likeCount: data.like_count,
      isLive: data.is_live || false,
      isPrivate: data.availability === 'private',
      isDeleted: data.availability === 'deleted',
      isUnavailable: [
        'private',
        'deleted',
        'premium_only',
        'subscriber_only',
      ].includes(data.availability),
      unavailableReason:
        data.availability !== 'public' ? data.availability : undefined,
      formats: data.formats
        ? data.formats.map((format: any) => ({
            formatId: format.format_id,
            ext: format.ext,
            quality: format.quality || format.format_note || 'unknown',
            filesize: format.filesize,
            url: format.url,
          }))
        : undefined,
    };
  }

  /**
   * Extract playlist ID from URL
   */
  private extractPlaylistId(url: string): string {
    const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : '';
  }

  /**
   * Generate unique extraction ID
   */
  private generateExtractionId(): string {
    return `extraction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure temp directory exists
   */
  private async ensureTempDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      this.logger.warn('Failed to create temp directory', {
        tempDir: this.tempDir,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Cleanup extraction resources
   */
  private async cleanup(extractionId: string): Promise<void> {
    try {
      // Remove any temporary files created for this extraction
      const tempFiles = await fs.readdir(this.tempDir);
      const extractionFiles = tempFiles.filter(file =>
        file.includes(extractionId),
      );

      for (const file of extractionFiles) {
        try {
          await fs.unlink(path.join(this.tempDir, file));
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Get extraction statistics
   */
  getExtractionStats(): {
    activeExtractions: number;
    totalExtractions: number;
    averageExtractionTime: number;
    successRate: number;
  } {
    // In a real implementation, you'd track these statistics
    return {
      activeExtractions: this.activeExtractions.size,
      totalExtractions: 0,
      averageExtractionTime: 0,
      successRate: 0,
    };
  }
}
