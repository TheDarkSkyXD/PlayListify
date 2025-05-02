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
  video_id: videoId
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
  private queue: PQueue;
  private activeDownloads: Map<string, { isCancelled: boolean }>;
  private notifyProgressCallback: NotifyDownloadProgressCallback | null = null;
  private notifyCompleteCallback: NotifyDownloadCompleteCallback | null = null;
  
  constructor() {
    this.queue = new PQueue({ concurrency: 2 });
    this.activeDownloads = new Map();
    
    try {
      // Get user settings
      const settings = getSettings();
      
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
      
      // Set queue concurrency from settings
      if (settings && settings.maxConcurrentDownloads) {
        this.queue.concurrency = settings.maxConcurrentDownloads;
      }
      
      logger.info(`Download service initialized with concurrency: ${this.queue.concurrency}`);
      
      // Recover any interrupted downloads
      this.recoverDownloads();
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
      return this.queue.add(() => this.processDownload(downloadId, videoId, formatId));
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
    try {
      // Get video info - videoId is the external ID (string)
      const video = await getVideoByExternalId(videoId, getDatabase());
      if (!video) {
        throw new Error(`Video with ID ${videoId} not found`);
      }
      
      // Update download status to downloading
      await addOrUpdateDownload({
        id: downloadId,
        status: 'downloading',
        progress: 0,
        updated_at: new Date().toISOString()
      });
      
      // Create a record for tracking this download
      this.activeDownloads.set(downloadId, { isCancelled: false });
      
      // Get settings for download location
      const settings = getSettings();
      
      // Ensure download directory exists
      const downloadPath = settings.downloadPath || path.join(app.getPath('userData'), 'downloads');
      fs.ensureDirSync(downloadPath);
      
      // Create a normalized filename
      const safeTitle = video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const outputFilename = `${safeTitle}_${videoId}.%(ext)s`;
      const outputPath = path.join(downloadPath, outputFilename);
      
      // Prepare arguments - access video URL from the correct property
      const args = [
        videoId, // Use the videoId directly as the URL since the actual video_url property might not exist
        '-f', formatId,
        '-o', outputPath,
        '--newline',  // Important for progress parsing
      ];
      
      logger.info(`Starting download for "${video.title}" (${videoId}) with format ${formatId}`);
      
      // Execute download with yt-dlp
      const ytDlpPath = ytdlpService.getYtdlpPath();
      const ytDlp = new YtDlpWrap(ytDlpPath);
      
      return new Promise((resolve, reject) => {
        let lastProgressUpdate = 0;
        let isCancelled = false;
        
        // Check if download was already cancelled
        const downloadState = this.activeDownloads.get(downloadId);
        if (downloadState && downloadState.isCancelled) {
          isCancelled = true;
          reject(new Error('Download cancelled'));
          return;
        }
        
        // Create the event emitter for the download
        const eventEmitter = ytDlp.exec(args);
        
        // Add event listeners
        eventEmitter.on('progress', ((progress: any) => {
          // Only update progress every 500ms to avoid flooding the renderer
          const now = Date.now();
          if (now - lastProgressUpdate > 500) {
            lastProgressUpdate = now;
            
            // Ensure percent is a number
            const percent = typeof progress.percent === 'number' ? progress.percent : 0;
            
            // Notify progress
            this.notifyDownloadProgress(downloadId, percent);
            
            // Update progress in database
            addOrUpdateDownload({
              id: downloadId,
              status: 'downloading',
              progress: percent,
              updated_at: new Date().toISOString()
            }).catch((err: Error) => {
              logger.error(`Failed to update download progress in DB`, { error: err });
            });
          }
        }) as any);
        
        eventEmitter.on('ytDlpEvent', (eventType: string, eventData: string) => {
          if (eventType === 'finished') {
            const parts = eventData.split(' ');
            const filePath = parts[0];
            
            logger.info(`Download completed: ${filePath}`);
          }
        });
        
        eventEmitter.on('error', (error: Error) => {
          if (isCancelled) {
            resolve(); // Don't reject if cancelled
          } else {
            reject(error);
          }
        });
        
        // Handle completion
        eventEmitter.on('close', async () => {
          try {
            // If download wasn't cancelled, mark as complete
            const downloadState = this.activeDownloads.get(downloadId);
            if (!downloadState || !downloadState.isCancelled) {
              // Get the actual file path (need to replace the extension placeholder)
              let actualFilePath = outputPath.replace('%(ext)s', '');
              
              // Find the actual file (with proper extension)
              const filePattern = actualFilePath.replace('.%(ext)s', '.*');
              const files = await fs.promises.readdir(downloadPath);
              const matchingFile = files.find(file => {
                const fullPath = path.join(downloadPath, file);
                return fullPath.startsWith(filePattern.replace('.%(ext)s', ''));
              });
              
              if (matchingFile) {
                actualFilePath = path.join(downloadPath, matchingFile);
                
                // Update download in DB
                await addOrUpdateDownload({
                  id: downloadId,
                  status: 'completed',
                  progress: 100,
                  file_path: actualFilePath,
                  updated_at: new Date().toISOString()
                });
                
                // Update video download status
                await updateVideoDownloadStatus(videoId, 'downloaded');
                
                // Notify completion
                this.notifyDownloadComplete(downloadId, 'completed', actualFilePath);
                
                logger.info(`Download for "${video.title}" completed successfully`);
                resolve();
              } else {
                const err = new Error('Could not find downloaded file');
                logger.error(`Download failed for "${video.title}"`, { error: err });
                
                // Update download in DB
                await addOrUpdateDownload({
                  id: downloadId,
                  status: 'failed',
                  error_message: err.message,
                  updated_at: new Date().toISOString()
                });
                
                // Update video download status
                await updateVideoDownloadStatus(videoId, 'download_failed');
                
                // Notify failure
                this.notifyDownloadComplete(downloadId, 'failed', undefined, err.message);
                
                reject(err);
              }
            } else {
              resolve(); // Don't update if cancelled
            }
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`Error processing download completion for "${video.title}"`, { error: err });
            
            // Update download in DB
            await addOrUpdateDownload({
              id: downloadId,
              status: 'failed',
              error_message: err.message,
              updated_at: new Date().toISOString()
            });
            
            // Update video download status
            await updateVideoDownloadStatus(videoId, 'download_failed');
            
            // Notify failure
            this.notifyDownloadComplete(downloadId, 'failed', undefined, err.message);
            
            reject(err);
          }
        });
      });
    } catch (error: unknown) {
      logger.error(`Failed to process download for video ${videoId}`, { error });
      
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
  
  // Cancel a download
  async cancelDownload(downloadId: string): Promise<void> {
    try {
      const downloadState = this.activeDownloads.get(downloadId);
      if (downloadState) {
        // Mark as cancelled to prevent updates
        downloadState.isCancelled = true;
        
        logger.info(`Cancelling download ${downloadId}`);
        
        // Update status in DB
        await addOrUpdateDownload({
          id: downloadId,
          status: 'cancelled',
          updated_at: new Date().toISOString()
        });
        
        // Get download info to update video status
        const download = await getDownloadById(downloadId);
        if (download) {
          // Use a valid status
          await updateVideoDownloadStatus(download.video_id, 'not_downloaded');
        }
        
        // Notify cancellation
        this.notifyDownloadComplete(downloadId, 'cancelled');
      }
    } catch (error) {
      logger.error(`Error cancelling download ${downloadId}`, { error });
      throw error;
    }
  }
  
  // Clean up after download (remove from active downloads tracking)
  private cleanupActiveDownload(downloadId: string): void {
    this.activeDownloads.delete(downloadId);
  }
  
  // Attempt to recover interrupted downloads from previous sessions
  private async recoverDownloads(): Promise<void> {
    try {
      // Get downloads that were in progress
      const interruptedDownloads = await getDownloadsByStatus(['downloading', 'queued']);
      
      if (interruptedDownloads.length > 0) {
        logger.info(`Found ${interruptedDownloads.length} interrupted downloads, marking as failed`);
        
        // Mark all as failed since we can't resume partial downloads
        for (const download of interruptedDownloads) {
          await addOrUpdateDownload({
            id: download.id,
            status: 'failed',
            error_message: 'Download interrupted by application restart',
            updated_at: new Date().toISOString()
          });
          
          await updateVideoDownloadStatus(download.video_id, 'download_failed');
        }
      }
    } catch (error) {
      logger.error('Failed to recover downloads', { error });
    }
  }
  
  // Retry a failed download
  async retryDownload(downloadId: string): Promise<void> {
    try {
      const download = await getDownloadById(downloadId);
      if (!download) {
        throw new Error(`Download with ID ${downloadId} not found`);
      }
      
      if (download.status !== 'failed' && download.status !== 'cancelled') {
        throw new Error(`Can only retry failed or cancelled downloads`);
      }
      
      logger.info(`Retrying download ${downloadId} for video ${download.video_id}`);
      
      // Create a new download ID
      const newDownloadId = uuidv4();
      
      // Queue the download with the same parameters
      return this.downloadVideo(
        newDownloadId,
        download.video_id,
        download.format,
        download.quality
      );
    } catch (error) {
      logger.error(`Failed to retry download ${downloadId}`, { error });
      throw error;
    }
  }
  
  // Clear completed downloads from DB
  async clearCompletedDownloads(): Promise<void> {
    try {
      const completedDownloads = await getDownloadsByStatus(['completed']);
      
      logger.info(`Clearing ${completedDownloads.length} completed downloads from history`);
      
      // Update each download to 'cleared' status
      for (const download of completedDownloads) {
        await addOrUpdateDownload({
          id: download.id,
          status: 'cleared',
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Failed to clear completed downloads', { error });
      throw error;
    }
  }
  
  // Get queue status
  async getQueueStatus(): Promise<QueueStatus> {
    try {
      // Get download counts by status
      const activeDownloads = await getDownloadsByStatus(['downloading']);
      const pendingDownloads = await getDownloadsByStatus(['queued']);
      const completedDownloads = await getDownloadsByStatus(['completed']);
      const failedDownloads = await getDownloadsByStatus(['failed', 'cancelled']);
      
      // Format active downloads for UI
      const formattedActiveDownloads = await Promise.all(
        activeDownloads.map(async (download: any) => {
          const video = await getVideoByExternalId(download.video_id, getDatabase());
          return {
            id: download.id,
            videoId: download.video_id,
            title: video ? video.title : 'Unknown video',
            progress: download.progress,
            status: download.status
          };
        })
      );
      
      return {
        active: activeDownloads.length,
        pending: pendingDownloads.length,
        completed: completedDownloads.length,
        failed: failedDownloads.length
      };
    } catch (error) {
      logger.error('Failed to get queue status', { error });
      throw error;
    }
  }
  
  // Download all videos in a playlist
  async downloadPlaylist(
    playlistId: string,
    formatId: string,
    quality: string
  ): Promise<string[]> {
    try {
      // Get all videos in playlist
      const playlistVideos = await getPlaylistVideos(parseInt(playlistId, 10), getDatabase());
      
      if (!playlistVideos.length) {
        throw new Error(`No videos found in playlist ${playlistId}`);
      }
      
      logger.info(`Starting download for ${playlistVideos.length} videos in playlist ${playlistId}`);
      
      // Create download entries for each video
      const downloadIds: string[] = [];
      
      for (const video of playlistVideos) {
        const downloadId = uuidv4();
        downloadIds.push(downloadId);
        
        // Queue the download
        this.downloadVideo(downloadId, video.video_external_id, formatId, quality)
          .catch(error => {
            logger.error(`Failed to download video ${video.video_external_id} from playlist`, { error });
          });
      }
      
      return downloadIds;
    } catch (error) {
      logger.error(`Failed to download playlist ${playlistId}`, { error });
      throw error;
    }
  }
}

// Create singleton instance
const downloadService = new DownloadService();

export default downloadService; 