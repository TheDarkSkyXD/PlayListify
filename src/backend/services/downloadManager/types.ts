import { BrowserWindow } from 'electron';
import PQueue from 'p-queue';

/**
 * Download status types
 */
export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'canceled';

/**
 * Download item interface
 */
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

/**
 * Download options interface
 */
export interface DownloadOptions {
  format?: string;
  quality?: string;
}

/**
 * Queue statistics interface
 */
export interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  paused: number;
  canceled: number;
  total: number;
}

/**
 * Download manager interface
 */
export interface IDownloadManager {
  isInitialized(): boolean;
  initialize(): void;
  setMainWindow(window: BrowserWindow): void;
  addToQueue(
    videoUrl: string,
    videoId: string,
    title: string,
    outputDir: string,
    options?: DownloadOptions,
    playlistId?: string,
    thumbnail?: string
  ): Promise<string>;
  processDownload(downloadId: string): Promise<string>;
  pauseDownload(downloadId: string): boolean;
  resumeDownload(downloadId: string): boolean;
  cancelDownload(downloadId: string): boolean;
  removeDownload(downloadId: string): boolean;
  getAllDownloads(): DownloadItem[];
  getDownloadsMapSize(): number;
  getDownload(downloadId: string): DownloadItem | undefined;
  getDownloadsByPlaylist(playlistId: string): DownloadItem[];
  getDownloadsByStatus(status: DownloadStatus): DownloadItem[];
  updateDownloadProgress(
    downloadId: string,
    progress: number,
    speed?: string,
    eta?: string
  ): boolean;
  updateConcurrency(): void;
  getQueueStats(): QueueStats;
  addMultipleToQueue(
    videos: Array<{
      videoId: string;
      url: string;
      title: string;
      thumbnail?: string;
    }>,
    playlistId: string,
    playlistName: string,
    customLocation?: string,
    createPlaylistFolder?: boolean
  ): Promise<string[]>;
  sendDownloadUpdate(download: DownloadItem): void;
}

/**
 * Download manager class properties
 */
export interface DownloadManagerProps {
  queue: PQueue | null;
  downloads: Map<string, DownloadItem>;
  activeDownloads: Set<string>;
  mainWindow?: BrowserWindow;
  initialized: boolean;
}
