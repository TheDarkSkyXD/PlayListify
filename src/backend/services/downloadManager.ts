import PQueue from 'p-queue';
import { BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { getSetting } from './settingsManager';
import * as ytDlpManager from './ytDlpManager';
import { c, logToFile } from './logger';
import { app } from 'electron';

// Download status types
export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'canceled';

// Download item interface
export interface DownloadItem {
  id: string;
  videoId: string;
  playlistId?: string;
  url: string;
  title: string;
  outputDir: string;
  outputPath?: string;
  status: DownloadStatus;
  progress: number;
  speed?: string;
  eta?: string;
  size?: string;
  error?: string;
  format?: string;
  quality?: string;
  addedAt: string;
  startedAt?: string;
  completedAt?: string;
  thumbnail?: string;
}

// Download options interface
export interface DownloadOptions {
  format?: string;
  quality?: string;
}

// Download manager class
export class DownloadManager {
  private queue: PQueue | null = null;
  private downloads: Map<string, DownloadItem> = new Map();
  private activeDownloads: Set<string> = new Set();
  private mainWindow?: BrowserWindow;
  private initialized: boolean = false;

  /**
   * Check if the download manager is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  constructor() {
    // Defer initialization until explicitly called
    // This prevents issues with logger initialization order
  }

  /**
   * Initialize the download manager
   * This should be called after the app is ready and logger is initialized
   */
  public initialize(): void {
    if (this.initialized) return;

    try {
      // Initialize the queue with concurrency from settings
      const concurrentDownloads = getSetting('concurrentDownloads', 3);
      this.queue = new PQueue({ concurrency: concurrentDownloads });

      // Log initialization
      logToFile('INFO', c.section('🚀', 'Download Manager initialized'));
      logToFile('INFO', `Concurrent downloads: ${concurrentDownloads}`);

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize download manager:', error);
    }
  }

  /**
   * Set the main window for sending progress updates
   */
  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;

    // Ensure we're initialized when setting the main window
    if (!this.initialized) {
      this.initialize();
    }
  }

  /**
   * Add a video to the download queue
   */
  public async addToQueue(
    videoUrl: string,
    videoId: string,
    title: string,
    outputDir: string,
    options: DownloadOptions = {},
    playlistId?: string,
    thumbnail?: string
  ): Promise<string> {
    // Ensure we're initialized
    if (!this.initialized) {
      this.initialize();
    }

    // Generate a unique download ID
    const downloadId = uuidv4();

    // Create download item
    const downloadItem: DownloadItem = {
      id: downloadId,
      videoId,
      playlistId,
      url: videoUrl,
      title,
      outputDir,
      status: 'pending',
      progress: 0,
      format: options.format || getSetting('downloadFormat', 'mp4'),
      quality: options.quality || getSetting('maxQuality', '1080p'),
      addedAt: new Date().toISOString(),
      thumbnail
    };

    // Add to downloads map
    this.downloads.set(downloadId, downloadItem);

    // Log the addition
    logToFile('INFO', `Added download to queue: ${title} (${downloadId})`);

    // Send update to renderer
    this.sendDownloadUpdate(downloadItem);

    // Add to queue
    if (this.queue) {
      this.queue.add(async () => {
        return this.processDownload(downloadId);
      });
    } else {
      console.error('Download queue not initialized');
    }

    return downloadId;
  }

  /**
   * Process a download
   */
  private async processDownload(downloadId: string): Promise<string | null> {
    // Ensure we're initialized
    if (!this.initialized) {
      console.error('Download manager not initialized when processing download');
      this.initialize();
    }

    const download = this.downloads.get(downloadId);
    if (!download) {
      logToFile('ERROR', `Download ${downloadId} not found in queue`);
      return null;
    }

    try {
      // Mark as downloading
      this.activeDownloads.add(downloadId);
      download.status = 'downloading';
      download.startedAt = new Date().toISOString();
      this.sendDownloadUpdate(download);

      logToFile('INFO', `Starting download: ${download.title} (${downloadId})`);

      // Ensure output directory exists
      await fs.ensureDir(download.outputDir);

      // Download the video
      const outputPath = await ytDlpManager.downloadVideo(
        download.url,
        download.outputDir,
        download.videoId,
        {
          format: download.format,
          quality: download.quality
        }
      );

      // Update download status
      download.status = 'completed';
      download.progress = 100;
      download.outputPath = outputPath;
      download.completedAt = new Date().toISOString();

      // Get file size
      const stats = await fs.stat(outputPath);
      download.size = this.formatBytes(stats.size);

      // Remove from active downloads
      this.activeDownloads.delete(downloadId);

      // Send update to renderer
      this.sendDownloadUpdate(download);

      logToFile('INFO', c.success(`Download completed: ${download.title} (${downloadId})`));
      logToFile('INFO', `Output path: ${outputPath}`);

      return outputPath;
    } catch (error: any) {
      // Update download status
      download.status = 'failed';
      download.error = error.message || 'Unknown error';

      // Remove from active downloads
      this.activeDownloads.delete(downloadId);

      // Send update to renderer
      this.sendDownloadUpdate(download);

      logToFile('ERROR', c.error(`Download failed: ${download.title} (${downloadId})`));
      logToFile('ERROR', error.message || 'Unknown error');

      return null;
    }
  }

  /**
   * Pause a download
   */
  public pauseDownload(downloadId: string): boolean {
    // Ensure we're initialized
    if (!this.initialized) {
      console.error('Download manager not initialized when pausing download');
      return false;
    }

    const download = this.downloads.get(downloadId);
    if (!download) {
      logToFile('ERROR', `Download ${downloadId} not found`);
      return false;
    }

    // Can only pause downloads that are pending or downloading
    if (download.status !== 'pending' && download.status !== 'downloading') {
      logToFile('WARN', `Cannot pause download ${downloadId} with status ${download.status}`);
      return false;
    }

    // Mark as paused
    download.status = 'paused';

    // Send update to renderer
    this.sendDownloadUpdate(download);

    logToFile('INFO', `Paused download: ${download.title} (${downloadId})`);

    return true;
  }

  /**
   * Resume a download
   */
  public resumeDownload(downloadId: string): boolean {
    // Ensure we're initialized
    if (!this.initialized) {
      console.error('Download manager not initialized when resuming download');
      this.initialize();
    }

    const download = this.downloads.get(downloadId);
    if (!download) {
      logToFile('ERROR', `Download ${downloadId} not found`);
      return false;
    }

    // Can only resume downloads that are paused
    if (download.status !== 'paused') {
      logToFile('WARN', `Cannot resume download ${downloadId} with status ${download.status}`);
      return false;
    }

    // Mark as pending
    download.status = 'pending';

    // Send update to renderer
    this.sendDownloadUpdate(download);

    // Add to queue
    if (this.queue) {
      this.queue.add(async () => {
        return this.processDownload(downloadId);
      });
    } else {
      console.error('Download queue not initialized when resuming download');
    }

    logToFile('INFO', `Resumed download: ${download.title} (${downloadId})`);

    return true;
  }

  /**
   * Cancel a download
   */
  public cancelDownload(downloadId: string): boolean {
    // Ensure we're initialized
    if (!this.initialized) {
      console.error('Download manager not initialized when canceling download');
      return false;
    }

    const download = this.downloads.get(downloadId);
    if (!download) {
      logToFile('ERROR', `Download ${downloadId} not found`);
      return false;
    }

    // Can only cancel downloads that are pending, downloading, or paused
    if (download.status !== 'pending' && download.status !== 'downloading' && download.status !== 'paused') {
      logToFile('WARN', `Cannot cancel download ${downloadId} with status ${download.status}`);
      return false;
    }

    // Mark as canceled
    download.status = 'canceled';

    // Remove from active downloads
    this.activeDownloads.delete(downloadId);

    // Send update to renderer
    this.sendDownloadUpdate(download);

    logToFile('INFO', `Canceled download: ${download.title} (${downloadId})`);

    return true;
  }

  /**
   * Remove a download from the list
   */
  public removeDownload(downloadId: string): boolean {
    // Ensure we're initialized
    if (!this.initialized) {
      console.error('Download manager not initialized when removing download');
      return false;
    }

    const download = this.downloads.get(downloadId);
    if (!download) {
      logToFile('ERROR', `Download ${downloadId} not found`);
      return false;
    }

    // Can only remove downloads that are completed, failed, or canceled
    if (download.status !== 'completed' && download.status !== 'failed' && download.status !== 'canceled') {
      logToFile('WARN', `Cannot remove download ${downloadId} with status ${download.status}`);
      return false;
    }

    // Remove from downloads map
    this.downloads.delete(downloadId);

    logToFile('INFO', `Removed download: ${download.title} (${downloadId})`);

    return true;
  }

  /**
   * Get all downloads
   */
  public getAllDownloads(): DownloadItem[] {
    // Ensure we're initialized
    if (!this.initialized) {
      return [];
    }

    return Array.from(this.downloads.values());
  }

  /**
   * Get a download by ID
   */
  public getDownload(downloadId: string): DownloadItem | undefined {
    // Ensure we're initialized
    if (!this.initialized) {
      return undefined;
    }

    return this.downloads.get(downloadId);
  }

  /**
   * Get downloads by playlist ID
   */
  public getDownloadsByPlaylist(playlistId: string): DownloadItem[] {
    // Ensure we're initialized
    if (!this.initialized) {
      return [];
    }

    return Array.from(this.downloads.values()).filter(
      download => download.playlistId === playlistId
    );
  }

  /**
   * Get downloads by status
   */
  public getDownloadsByStatus(status: DownloadStatus): DownloadItem[] {
    // Ensure we're initialized
    if (!this.initialized) {
      return [];
    }

    return Array.from(this.downloads.values()).filter(
      download => download.status === status
    );
  }

  /**
   * Update download progress
   */
  public updateDownloadProgress(
    downloadId: string,
    progress: number,
    speed?: string,
    eta?: string
  ): boolean {
    // Ensure we're initialized
    if (!this.initialized) {
      return false;
    }

    const download = this.downloads.get(downloadId);
    if (!download) {
      return false;
    }

    // Update progress
    download.progress = progress;
    download.speed = speed;
    download.eta = eta;

    // Send update to renderer
    this.sendDownloadUpdate(download);

    return true;
  }

  /**
   * Send download update to renderer
   */
  private sendDownloadUpdate(download: DownloadItem): void {
    // Skip if not initialized or no main window
    if (!this.initialized || !this.mainWindow) {
      return;
    }

    if (!this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('download-update', download);

      // Also send playlist-specific update if applicable
      if (download.playlistId) {
        this.mainWindow.webContents.send(
          `download-progress-${download.videoId}`,
          download.progress
        );
      }
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Update concurrency based on settings
   */
  public updateConcurrency(): void {
    // Ensure we're initialized
    if (!this.initialized) {
      this.initialize();
      return;
    }

    if (this.queue) {
      const concurrentDownloads = getSetting('concurrentDownloads', 3);
      this.queue.concurrency = concurrentDownloads;
      logToFile('INFO', `Updated concurrent downloads to ${concurrentDownloads}`);
    }
  }

  /**
   * Get queue statistics
   */
  public getQueueStats(): {
    pending: number;
    active: number;
    completed: number;
    failed: number;
    paused: number;
    canceled: number;
    total: number;
  } {
    // Ensure we're initialized
    if (!this.initialized) {
      // Return empty stats if not initialized
      return {
        pending: 0,
        active: 0,
        completed: 0,
        failed: 0,
        paused: 0,
        canceled: 0,
        total: 0
      };
    }

    const downloads = Array.from(this.downloads.values());

    return {
      pending: downloads.filter(d => d.status === 'pending').length,
      active: downloads.filter(d => d.status === 'downloading').length,
      completed: downloads.filter(d => d.status === 'completed').length,
      failed: downloads.filter(d => d.status === 'failed').length,
      paused: downloads.filter(d => d.status === 'paused').length,
      canceled: downloads.filter(d => d.status === 'canceled').length,
      total: downloads.length
    };
  }

  /**
   * Add multiple videos to the download queue
   */
  public async addMultipleToQueue(
    videos: Array<{
      videoId: string;
      url: string;
      title: string;
      thumbnail?: string;
    }>,
    playlistId: string,
    playlistName: string
  ): Promise<string[]> {
    // Ensure we're initialized
    if (!this.initialized) {
      this.initialize();
    }

    // Get output directory for the playlist
    const playlistLocation = getSetting('playlistLocation');
    const outputDir = path.join(
      playlistLocation,
      `${playlistId}-${this.sanitizeFileName(playlistName)}`,
      'videos'
    );

    // Add each video to the queue
    const downloadIds: string[] = [];

    for (const video of videos) {
      const downloadId = await this.addToQueue(
        video.url,
        video.videoId,
        video.title,
        outputDir,
        {
          format: getSetting('downloadFormat', 'mp4'),
          quality: getSetting('maxQuality', '1080p')
        },
        playlistId,
        video.thumbnail
      );

      downloadIds.push(downloadId);
    }

    logToFile('INFO', `Added ${videos.length} videos to download queue for playlist ${playlistName}`);

    return downloadIds;
  }

  /**
   * Sanitize a file name to be safe for file systems
   */
  private sanitizeFileName(name: string): string {
    // Replace invalid characters with underscores
    return name
      .replace(/[\\/:*?"<>|]/g, '_') // Replace invalid characters
      .replace(/\s+/g, '_')          // Replace spaces with underscores
      .replace(/_+/g, '_')           // Replace multiple underscores with a single one
      .substring(0, 100);            // Limit length to 100 characters
  }
}

// Create and export a singleton instance
export const downloadManager = new DownloadManager();

// Initialize the download manager when the app is ready
app.whenReady().then(() => {
  // We'll initialize the download manager explicitly in main.ts
  // This is just a fallback in case it's not done there
  setTimeout(() => {
    if (!downloadManager.isInitialized()) {
      downloadManager.initialize();
    }
  }, 2000); // Wait 2 seconds to ensure logger is initialized
});
