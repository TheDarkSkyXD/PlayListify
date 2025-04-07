import PQueue from 'p-queue';
import { BrowserWindow } from 'electron';
import { getSetting } from '../settingsManager';
import { c, logToFile } from '../logger';
import {
  DownloadItem,
  DownloadStatus,
  DownloadOptions,
  IDownloadManager,
  QueueStats,
  DownloadManagerProps
} from './types';
// Operation functions will be imported in the respective files to avoid circular dependencies

/**
 * Download manager class
 */
export class DownloadManager implements IDownloadManager {
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
   * Get the internal properties of the download manager
   * This is used by the other modules to access the internal state
   */
  public getProps(): DownloadManagerProps {
    return {
      queue: this.queue,
      downloads: this.downloads,
      activeDownloads: this.activeDownloads,
      mainWindow: this.mainWindow,
      initialized: this.initialized
    };
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
    // This will be implemented in queueOperations.ts
    // We're just defining the interface here
    throw new Error('Method not implemented - will be overridden');
  }

  /**
   * Process a download from the queue
   */
  public async processDownload(downloadId: string): Promise<string> {
    // This will be implemented in itemOperations.ts
    // We're just defining the interface here
    throw new Error('Method not implemented - will be overridden');
  }

  /**
   * Pause a download
   */
  public pauseDownload(downloadId: string): boolean {
    // This will be implemented in itemOperations.ts
    // We're just defining the interface here
    throw new Error('Method not implemented - will be overridden');
  }

  /**
   * Resume a download
   */
  public resumeDownload(downloadId: string): boolean {
    // This will be implemented in itemOperations.ts
    // We're just defining the interface here
    throw new Error('Method not implemented - will be overridden');
  }

  /**
   * Cancel a download
   */
  public cancelDownload(downloadId: string): boolean {
    // This will be implemented in itemOperations.ts
    // We're just defining the interface here
    throw new Error('Method not implemented - will be overridden');
  }

  /**
   * Remove a download from the list
   */
  public removeDownload(downloadId: string): boolean {
    // This will be implemented in itemOperations.ts
    // We're just defining the interface here
    throw new Error('Method not implemented - will be overridden');
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
   * Get the size of the downloads map
   */
  public getDownloadsMapSize(): number {
    return this.downloads.size;
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
  public getQueueStats(): QueueStats {
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
    playlistName: string,
    customLocation?: string,
    createPlaylistFolder: boolean = true
  ): Promise<string[]> {
    // This will be implemented in queueOperations.ts
    // We're just defining the interface here
    throw new Error('Method not implemented - will be overridden');
  }

  /**
   * Send a download update to the renderer
   */
  public sendDownloadUpdate(download: DownloadItem): void {
    // This will be implemented in statusOperations.ts
    // We're just defining the interface here
    throw new Error('Method not implemented - will be overridden');
  }
}
