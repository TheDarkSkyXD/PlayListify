// These imports are used in the processDownload function
import fs from 'fs-extra';
import path from 'path';
import * as ytDlpManager from '../ytDlpManager';
import { logToFile } from '../logger';
import { DownloadManager } from './core';

// Patch the DownloadManager prototype with the implementation
DownloadManager.prototype.processDownload = async function(downloadId: string): Promise<string> {
  return processDownload(this, downloadId);
};

DownloadManager.prototype.pauseDownload = function(downloadId: string): boolean {
  return pauseDownload(this, downloadId);
};

DownloadManager.prototype.resumeDownload = function(downloadId: string): boolean {
  return resumeDownload(this, downloadId);
};

DownloadManager.prototype.cancelDownload = function(downloadId: string): boolean {
  return cancelDownload(this, downloadId);
};

DownloadManager.prototype.removeDownload = function(downloadId: string): boolean {
  return removeDownload(this, downloadId);
};

/**
 * Process a download from the queue
 */
export async function processDownload(
  manager: DownloadManager,
  downloadId: string
): Promise<string> {
  const props = manager.getProps();

  try {
    // Get the download item
    const download = props.downloads.get(downloadId);
    if (!download) {
      logToFile('ERROR', `Download ${downloadId} not found`);
      throw new Error(`Download ${downloadId} not found`);
    }

    // Check if the download is already active
    if (props.activeDownloads.has(downloadId)) {
      logToFile('WARN', `Download ${downloadId} is already active`);
      return download.outputPath || '';
    }

    // Mark as downloading
    download.status = 'downloading';
    download.startedAt = new Date().toISOString();
    props.activeDownloads.add(downloadId);

    // Send update to renderer
    manager.sendDownloadUpdate(download);

    logToFile('INFO', `Starting download: ${download.title} (${downloadId})`);

    // Download the video with progress tracking
    const outputPath = await ytDlpManager.downloadVideo(
      download.url,
      download.outputDir,
      download.videoId,
      {
        format: download.format,
        quality: download.quality,
        downloadId: download.id,
        onProgress: (progress: number, speed?: string, eta?: string) => {
          // Update download progress
          download.progress = progress;
          download.speed = speed;
          download.eta = eta;

          // Send update to renderer
          manager.sendDownloadUpdate(download);
        }
      }
    );

    // Mark as completed
    download.status = 'completed';
    download.progress = 100;
    download.completedAt = new Date().toISOString();
    download.outputPath = outputPath;
    props.activeDownloads.delete(downloadId);

    // Send update to renderer
    manager.sendDownloadUpdate(download);

    logToFile('INFO', `Download completed: ${download.title} (${downloadId})`);
    logToFile('INFO', `Output path: ${outputPath}`);

    return outputPath;
  } catch (error) {
    // Get the download item
    const download = props.downloads.get(downloadId);
    if (download) {
      // Mark as failed
      download.status = 'failed';
      download.error = error.message;
      props.activeDownloads.delete(downloadId);

      // Send update to renderer
      manager.sendDownloadUpdate(download);

      logToFile('ERROR', `Download failed: ${download.title} (${downloadId}): ${error.message}`);

      // Check for partial files that might need cleanup
      try {
        const dir = download.outputDir;
        const basename = download.videoId;

        if (await fs.pathExists(dir)) {
          const files = await fs.readdir(dir);

          // Look for partial downloads with the same base name
          const partialFiles = files.filter((file: string) =>
            file.startsWith(basename) &&
            (file.includes('.part') || file.includes('.f') || file.includes('.temp'))
          );

          if (partialFiles.length > 0) {
            logToFile('INFO', `Found ${partialFiles.length} partial download files to clean up`);
            for (const file of partialFiles) {
              const filePath = path.join(dir, file);
              logToFile('INFO', `Removing partial file: ${filePath}`);
              await fs.remove(filePath);
            }
          }
        }
      } catch (cleanupError) {
        logToFile('ERROR', `Error cleaning up partial files: ${cleanupError}`);
      }
    }

    throw error;
  }
}

/**
 * Pause a download
 */
export function pauseDownload(
  manager: DownloadManager,
  downloadId: string
): boolean {
  const props = manager.getProps();

  // Ensure we're initialized
  if (!props.initialized) {
    console.error('Download manager not initialized when pausing download');
    manager.initialize();
  }

  const download = props.downloads.get(downloadId);
  if (!download) {
    logToFile('ERROR', `Download ${downloadId} not found`);
    return false;
  }

  // Can only pause downloads that are pending or downloading
  if (download.status !== 'pending' && download.status !== 'downloading') {
    logToFile('WARN', `Cannot pause download ${downloadId} with status ${download.status}`);
    return false;
  }

  // If the download is active, we need to cancel it
  if (props.activeDownloads.has(downloadId)) {
    // TODO: Implement actual cancellation of the download process
    // For now, we just mark it as paused
    props.activeDownloads.delete(downloadId);
  }

  // Mark as paused
  download.status = 'paused';

  // Send update to renderer
  manager.sendDownloadUpdate(download);

  logToFile('INFO', `Paused download: ${download.title} (${downloadId})`);

  return true;
}

/**
 * Resume a download
 */
export function resumeDownload(
  manager: DownloadManager,
  downloadId: string
): boolean {
  const props = manager.getProps();

  // Ensure we're initialized
  if (!props.initialized) {
    console.error('Download manager not initialized when resuming download');
    manager.initialize();
  }

  const download = props.downloads.get(downloadId);
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
  manager.sendDownloadUpdate(download);

  // Add to queue
  if (props.queue) {
    props.queue.add(async () => {
      return manager.processDownload(downloadId);
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
export function cancelDownload(
  manager: DownloadManager,
  downloadId: string
): boolean {
  const props = manager.getProps();

  // Ensure we're initialized
  if (!props.initialized) {
    console.error('Download manager not initialized when canceling download');
    manager.initialize();
  }

  const download = props.downloads.get(downloadId);
  if (!download) {
    logToFile('ERROR', `Download ${downloadId} not found`);
    return false;
  }

  // Can only cancel downloads that are pending, downloading, or paused
  if (download.status !== 'pending' && download.status !== 'downloading' && download.status !== 'paused') {
    logToFile('WARN', `Cannot cancel download ${downloadId} with status ${download.status}`);
    return false;
  }

  // If the download is active, we need to cancel it
  if (props.activeDownloads.has(downloadId)) {
    // TODO: Implement actual cancellation of the download process
    // For now, we just mark it as canceled
    props.activeDownloads.delete(downloadId);
  }

  // Mark as canceled
  download.status = 'canceled';

  // Send update to renderer
  manager.sendDownloadUpdate(download);

  logToFile('INFO', `Canceled download: ${download.title} (${downloadId})`);

  return true;
}

/**
 * Remove a download from the list
 */
export function removeDownload(
  manager: DownloadManager,
  downloadId: string
): boolean {
  const props = manager.getProps();

  // Ensure we're initialized
  if (!props.initialized) {
    console.error('Download manager not initialized when removing download');
    return false;
  }

  const download = props.downloads.get(downloadId);
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
  props.downloads.delete(downloadId);

  logToFile('INFO', `Removed download: ${download.title} (${downloadId})`);

  return true;
}
