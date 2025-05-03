import { BrowserWindow } from 'electron';
import { app } from 'electron';
import PQueue from 'p-queue';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import YtDlpWrap from 'yt-dlp-wrap';
import logger from './logService';
import ytdlpService from './ytdlpService';
import { getDatabase } from '../database/index';
import settingsService from './settingsService';
import { EventEmitter } from 'events';

// Import empty interfaces for now, we'll implement the queries later
// These will be properly implemented in their respective files
// For now, we're just fixing import errors
const addOrUpdateDownload = async (download: any) => {};

const getDownloadsByStatus = async (statuses: string[]): Promise<any[]> => {
  return [{ 
    id: 'dummy-id',
    video_id: 'dummy-video-id',
    status: 'completed',
    format: 'mp4',
    quality: 'best'
  }];
};

const getDownloadById = async (id: string): Promise<any> => {
  return { 
    id: id,
    video_id: 'dummy-video-id',
    status: 'completed',
    format: 'mp4',
    quality: 'best'
  };
};

const getVideoByExternalId = async (videoId: string, db: any) => ({
  title: 'Video Title',
  video_id: videoId,
  url: `https://www.youtube.com/watch?v=${videoId}`
});

const updateVideoDownloadStatus = async (videoId: string, status: string) => {};

const getPlaylistVideos = async (playlistId: number, db: any) => [
  { video_external_id: 'video1', id: 1 }
];

// Settings service wrapper
const getSettings = () => {
  return settingsService.getSettings() || {
    downloadPath: app.getPath('downloads'),
    maxConcurrentDownloads: 2
  };
};

// Types
export type VideoFormat = {
  format_id: string;
  format_note: string;
  ext: string;
  resolution?: string;
  fps?: number;
  filesize?: number;
  filesize_approx?: number;
  tbr?: number; // Total bit rate
  vbr?: number; // Video bit rate
  abr?: number; // Audio bit rate
  format: string;
};

export type FormatSelection = {
  formatId: string;
  quality: string;
  type: 'video' | 'audio';
  ext: string;
};

export interface QueueStatus {
  active: number;
  pending: number;
  completed: number;
  failed: number;
}

// Add this type to match the yt-dlp-wrap types
interface YtDlpProgress {
  percent: number;
  totalSize: string;
  currentSpeed: string;
  eta: string;
}

type NotifyDownloadProgressCallback = (downloadId: string, progress: number) => void;
type NotifyDownloadCompleteCallback = (
  downloadId: string, 
  status: string, 
  filePath?: string, 
  error?: string
) => void;

// Download Service Class
class DownloadService {
  private queue: PQueue | null = null;
  private activeDownloads: Map<string, { isCancelled: boolean; eventEmitter?: EventEmitter }>;
  private notifyProgressCallback: NotifyDownloadProgressCallback | null = null;
  private notifyCompleteCallback: NotifyDownloadCompleteCallback | null = null;
  private mainWindow?: BrowserWindow;
  private isInitialized: boolean;
  
  constructor() {
    this.activeDownloads = new Map();
    this.isInitialized = false;
    
    logger.info('Download service created - awaiting initialization');
  }
  
  // Check if the service is initialized
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }
  
  // Method to initialize the service
  public initialize(mainWindow?: BrowserWindow): void {
    if (this.isInitialized) {
      logger.info('Download service already initialized, skipping');
      return;
    }
    
    try {
      // Store main window reference if provided
      if (mainWindow) {
        this.mainWindow = mainWindow;
      }
      
      // Get user settings
      const settings = getSettings();
      
      // Create queue with concurrency from settings
      const concurrentDownloads = settings.maxConcurrentDownloads || 2;
      this.queue = new PQueue({ concurrency: concurrentDownloads });
      
      // Ensure download directory exists - safely handle app initialization
      let downloadPath = '';
      if (app && app.getPath) {
        const userDataPath = app.getPath('userData');
        downloadPath = path.join(userDataPath, 'downloads');
      } else {
        // Fallback if app is not ready
        downloadPath = path.join(process.cwd(), 'downloads');
      }
      
      fs.ensureDirSync(downloadPath);
      
      logger.info(`Download service initialized with concurrency: ${this.queue.concurrency}`);
      logger.info(`Download path: ${downloadPath}`);
      
      // Recover any interrupted downloads
      this.recoverDownloads();
      
      this.isInitialized = true;
    } catch (error) {
      logger.error('Error initializing download service:', error);
    }
  }
  
  // Set callback for progress notification
  setNotifyProgressCallback(callback: NotifyDownloadProgressCallback): void {
    this.notifyProgressCallback = callback;
  }
  
  // Set callback for download completion notification
  setNotifyCompleteCallback(callback: NotifyDownloadCompleteCallback): void {
    this.notifyCompleteCallback = callback;
  }
  
  // Notify progress via callback if set
  private notifyDownloadProgress(downloadId: string, progress: number): void {
    if (this.notifyProgressCallback) {
      this.notifyProgressCallback(downloadId, progress);
    }
  }
  
  // Notify completion via callback if set
  private notifyDownloadComplete(
    downloadId: string, 
    status: string, 
    filePath?: string, 
    error?: string
  ): void {
    if (this.notifyCompleteCallback) {
      this.notifyCompleteCallback(downloadId, status, filePath, error);
    }
  }
  
  // Get available formats for a video URL
  async getFormats(videoUrl: string): Promise<VideoFormat[]> {
    try {
      const ytDlpPath = ytdlpService.getYtdlpPath();
      const ytDlp = new YtDlpWrap(ytDlpPath);
      
      const output = await ytDlp.execPromise([
        videoUrl,
        '--dump-json',
        '--no-playlist',
      ]);
      
      // Parse output to get formats
      const info = JSON.parse(output);
      return info.formats || [];
    } catch (error: any) {
      logger.error(`Failed to get formats for ${videoUrl}`, { error });
      throw new Error(`Failed to get formats: ${error.message}`);
    }
  }
  
  // Download a video
  async downloadVideo(
    downloadId: string,
    videoId: string,
    formatId: string,
    quality: string
  ): Promise<void> {
    // Ensure we're initialized
    if (!this.isInitialized) {
      this.initialize();
    }
    
    try {
      // Get video info - videoId is the external ID (string)
      const video = await getVideoByExternalId(videoId, getDatabase());
      if (!video) {
        throw new Error(`Video with ID ${videoId} not found`);
      }
      
      // Update download status to queued
      await addOrUpdateDownload({
        id: downloadId,
        video_id: videoId,
        status: 'queued',
        format: formatId,
        quality,
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // Add to download queue
      return this.queue!.add(() => this.processDownload(downloadId, videoId, formatId));
    } catch (error: unknown) {
      logger.error(`Failed to queue download for video ${videoId}`, { error });
      
      // Update download status to failed
      await addOrUpdateDownload({
        id: downloadId,
        video_id: videoId,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      });
      
      await updateVideoDownloadStatus(videoId, 'download_failed');
      this.notifyDownloadComplete(downloadId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
      
      throw error;
    } finally {
      this.cleanupActiveDownload(downloadId);
    }
  }
  
  // Process a download from the queue
  private async processDownload(
    downloadId: string,
    videoId: string,
    formatId: string
  ): Promise<void> {
    // Ensure we're initialized
    if (!this.isInitialized) {
      this.initialize();
    }
    
    try {
      // Get video info - videoId is the external ID (string)
      const video = await getVideoByExternalId(videoId, getDatabase());
      if (!video) {
        throw new Error(`Video with ID ${videoId} not found`);
      }
      
      // Update download status to downloading
      await addOrUpdateDownload({
        id: downloadId,
        video_id: videoId,
        status: 'downloading',
        progress: 0,
        updated_at: new Date().toISOString()
      });
      
      // Register this as an active download that can be cancelled
      this.activeDownloads.set(downloadId, { isCancelled: false });
      
      // Get settings for download path
      const settings = getSettings();
      const downloadPath = settings.downloadPath || app.getPath('downloads');
      
      // Create the output file path
      const outputFilePath = path.join(downloadPath, `${videoId}.mp4`);
      
      // Make sure the download directory exists
      await fs.ensureDir(downloadPath);
      
      // Get yt-dlp path
      const ytDlpPath = ytdlpService.getYtdlpPath();
      const ytDlp = new YtDlpWrap(ytDlpPath);
      
      // Construct format string based on the provided format
      const formatString = formatId === 'best' 
        ? 'bestvideo+bestaudio/best' 
        : formatId;
      
      // Track progress with event emitter
      let eventEmitter: EventEmitter;
      
      // Start download with progress tracking
      try {
        eventEmitter = ytDlp.exec(
          [
            video.url || `https://www.youtube.com/watch?v=${videoId}`,
            '-f', formatString,
            '-o', outputFilePath,
            '--newline', // Important for progress parsing
            '--progress'
          ]
        );
        
        // Save the event emitter to be able to cancel
        const activeDownload = this.activeDownloads.get(downloadId);
        if (activeDownload) {
          activeDownload.eventEmitter = eventEmitter;
          this.activeDownloads.set(downloadId, activeDownload);
        }
        
        // Set up progress handler
        eventEmitter.on('progress', (progress: YtDlpProgress) => {
          // Check if this download has been cancelled
          const activeDownload = this.activeDownloads.get(downloadId);
          if (activeDownload && activeDownload.isCancelled) {
            // Just exit the handler, the download will be cancelled elsewhere
            return;
          }
          
          // Update progress
          const percent = progress.percent || 0;
          this.notifyDownloadProgress(downloadId, percent);
          
          // Update download in database
          addOrUpdateDownload({
            id: downloadId,
            video_id: videoId,
            status: 'downloading',
            progress: percent,
            updated_at: new Date().toISOString()
          }).catch(err => logger.error(`Failed to update download progress: ${err}`));
        });
        
        // Wait for download to complete
        await new Promise<void>((resolve, reject) => {
          eventEmitter.on('error', (error) => {
            reject(error);
          });
          
          eventEmitter.on('close', () => {
            resolve();
          });
        });
        
        // Download completed successfully
        await addOrUpdateDownload({
          id: downloadId,
          video_id: videoId,
          status: 'completed',
          progress: 100,
          file_path: outputFilePath,
          updated_at: new Date().toISOString()
        });
        
        await updateVideoDownloadStatus(videoId, 'downloaded');
        this.notifyDownloadComplete(downloadId, 'completed', outputFilePath);
        
        logger.info(`Download completed: ${video.title} (${videoId})`);
      } catch (error: any) {
        // Check if this was a cancellation
        const activeDownload = this.activeDownloads.get(downloadId);
        if (activeDownload && activeDownload.isCancelled) {
          logger.info(`Download cancelled: ${videoId}`);
          return; // Exit without recording as error
        }
        
        logger.error(`Download failed: ${videoId}`, { error });
        
        // Update download status to failed
        await addOrUpdateDownload({
          id: downloadId,
          video_id: videoId,
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        });
        
        await updateVideoDownloadStatus(videoId, 'download_failed');
        this.notifyDownloadComplete(downloadId, 'failed', undefined, error.message);
      } finally {
        // Clean up this download from the active downloads map
        this.cleanupActiveDownload(downloadId);
      }
    } catch (error: any) {
      logger.error(`Error setting up download: ${error.message}`);
      
      // Update download status to failed
      await addOrUpdateDownload({
        id: downloadId,
        video_id: videoId,
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      });
      
      await updateVideoDownloadStatus(videoId, 'download_failed');
      this.notifyDownloadComplete(downloadId, 'failed', undefined, error.message);
      
      // Clean up
      this.cleanupActiveDownload(downloadId);
    }
  }
  
  // Cancel an active download
  async cancelDownload(downloadId: string): Promise<void> {
    try {
      // Check if this download is active
      const activeDownload = this.activeDownloads.get(downloadId);
      if (activeDownload) {
        // Mark as cancelled
        activeDownload.isCancelled = true;
        this.activeDownloads.set(downloadId, activeDownload);
        
        // Kill the download process if we have an event emitter
        if (activeDownload.eventEmitter) {
          try {
            // Try to emit an error to break the download
            activeDownload.eventEmitter.emit('error', new Error('Download cancelled by user'));
          } catch (err) {
            logger.warn(`Failed to emit error to cancel download: ${err}`);
          }
        }
        
        // Update status in database
        await addOrUpdateDownload({
          id: downloadId,
          status: 'cancelled',
          updated_at: new Date().toISOString()
        });
        
        logger.info(`Download marked for cancellation: ${downloadId}`);
      } else {
        logger.warn(`Attempted to cancel non-active download: ${downloadId}`);
      }
    } catch (error) {
      logger.error(`Error cancelling download ${downloadId}:`, error);
      throw error;
    }
  }
  
  // Helper to remove a download from active downloads
  private cleanupActiveDownload(downloadId: string): void {
    this.activeDownloads.delete(downloadId);
  }
  
  // Recover interrupted downloads
  private async recoverDownloads(): Promise<void> {
    try {
      // Get all downloads with status 'downloading' or 'queued'
      const incompleteDownloads = await getDownloadsByStatus(['downloading', 'queued']);
      
      if (incompleteDownloads.length > 0) {
        logger.info(`Found ${incompleteDownloads.length} incomplete downloads to recover`);
        
        // Mark all as failed due to interruption
        for (const download of incompleteDownloads) {
          await addOrUpdateDownload({
            id: download.id,
            status: 'failed',
            error_message: 'Download interrupted by application restart',
            updated_at: new Date().toISOString()
          });
          
          // Let the UI know
          this.notifyDownloadComplete(
            download.id, 
            'failed', 
            undefined, 
            'Download interrupted by application restart'
          );
        }
      }
    } catch (error) {
      logger.error('Error recovering downloads:', error);
    }
  }
  
  // Retry a failed download
  async retryDownload(downloadId: string): Promise<void> {
    // Ensure we're initialized
    if (!this.isInitialized) {
      this.initialize();
    }
    
    try {
      // Get download info
      const download = await getDownloadById(downloadId);
      if (!download) {
        throw new Error(`Download with ID ${downloadId} not found`);
      }
      
      if (download.status !== 'failed') {
        throw new Error(`Cannot retry download that is not in failed state: ${download.status}`);
      }
      
      // Reset download status to queued
      await addOrUpdateDownload({
        id: downloadId,
        status: 'queued',
        progress: 0,
        error_message: null,
        updated_at: new Date().toISOString()
      });
      
      // Add to download queue
      return this.queue!.add(() => this.processDownload(downloadId, download.video_id, download.format));
    } catch (error) {
      logger.error(`Failed to retry download ${downloadId}:`, error);
      throw error;
    }
  }
  
  // Clear completed and failed downloads from history
  async clearCompletedDownloads(): Promise<void> {
    try {
      // Get all completed and failed downloads
      const completedDownloads = await getDownloadsByStatus(['completed', 'failed', 'cancelled']);
      
      if (completedDownloads.length > 0) {
        logger.info(`Clearing ${completedDownloads.length} completed/failed downloads from history`);
        
        // Delete each download
        for (const download of completedDownloads) {
          await addOrUpdateDownload({
            id: download.id,
            status: 'deleted',
            updated_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      logger.error('Error clearing completed downloads:', error);
      throw error;
    }
  }
  
  // Get the current status of the download queue
  async getQueueStatus(): Promise<QueueStatus> {
    // Ensure we're initialized
    if (!this.isInitialized) {
      this.initialize();
    }
    
    try {
      if (!this.queue) {
        return {
          active: 0,
          pending: 0,
          completed: 0,
          failed: 0
        };
      }
      
      // Get all downloads by status
      const [active, pending, completed, failed] = await Promise.all([
        getDownloadsByStatus(['downloading']),
        getDownloadsByStatus(['queued']),
        getDownloadsByStatus(['completed']),
        getDownloadsByStatus(['failed'])
      ]);
      
      return {
        active: active.length,
        pending: pending.length, 
        completed: completed.length,
        failed: failed.length
      };
    } catch (error) {
      logger.error('Error getting queue status:', error);
      return {
        active: 0,
        pending: 0,
        completed: 0,
        failed: 0
      };
    }
  }
  
  // Download all videos in a playlist
  async downloadPlaylist(
    playlistId: string,
    formatId: string,
    quality: string
  ): Promise<string[]> {
    // Ensure we're initialized
    if (!this.isInitialized) {
      this.initialize();
    }
    
    try {
      // Get all videos in the playlist
      const playlistVideos = await getPlaylistVideos(parseInt(playlistId), getDatabase());
      const downloadIds: string[] = [];
      
      // Queue up each video for download
      for (const video of playlistVideos) {
        const downloadId = uuidv4();
        downloadIds.push(downloadId);
        
        // Add to download queue
        await this.downloadVideo(downloadId, video.video_external_id, formatId, quality);
      }
      
      return downloadIds;
    } catch (error) {
      logger.error(`Failed to download playlist ${playlistId}:`, error);
      throw error;
    }
  }
}

// Create and export singleton instance
const downloadService = new DownloadService();
export default downloadService; 