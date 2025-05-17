import { EventEmitter } from 'events';
import PQueue from 'p-queue';
import YTDlpWrap from 'yt-dlp-wrap';
import path from 'path'; // For path manipulations
import fs from 'fs-extra'; // For ensuring directory exists
import { app } from 'electron';

import { IpcResponse, DownloadQueueItem, VideoFormat, Settings, DownloadAddItemDetails } from '../../shared/types';
// Assuming settingsService provides a getSetting function
import { getSetting } from './settingsService'; // Corrected path
// Assuming pathUtils provides functions to get binary paths
import { getManagedYtDlpPath, getManagedFfmpegPath } from '../utils/pathUtils'; // Corrected function names

// In-memory store for downloads
const downloads = new Map<string, DownloadQueueItem>();
export const downloadEvents = new EventEmitter();

let ytDlpWrap: YTDlpWrap | null = null;
let downloadQueue: PQueue | null = null;
let ffmpegPathExternal: string | null = null; // Renamed to avoid conflict with node 'path' module

async function initializeDownloadManager() {
  if (downloadQueue && ytDlpWrap) {
    return; // Already initialized
  }

  try {
    const ytDlpPath = await getManagedYtDlpPath(); 
    ffmpegPathExternal = await getManagedFfmpegPath(); 

    if (!ytDlpPath) {
      console.error('[DownloadManager] yt-dlp binary path not found. Downloads will fail.');
      throw new Error('yt-dlp binary path not found.');
    }
    if (!ffmpegPathExternal) {
      console.warn('[DownloadManager] FFmpeg path not found. Merging formats might fail.');
    }

    ytDlpWrap = new YTDlpWrap(ytDlpPath);
    console.log(`[DownloadManager] YTDlpWrap initialized with binary at: ${ytDlpPath}`);

    // Use the correct key 'maxConcurrentDownloads' from the Settings/UserSettings type
    const concurrency = await getSetting('maxConcurrentDownloads', 3); 
    downloadQueue = new PQueue({ concurrency });
    console.log(`[DownloadManager] PQueue initialized with concurrency: ${concurrency}`);

  } catch (error) {
    console.error('[DownloadManager] Initialization failed:', error);
  }
}

initializeDownloadManager();

async function processDownload(downloadId: string) {
  const item = downloads.get(downloadId);
  if (!item || !ytDlpWrap || !downloadQueue) {
    console.error(`[DownloadManager] Cannot process download ${downloadId}, item or manager not ready.`);
    if (item) {
        item.status = 'error';
        downloads.set(downloadId, item);
        downloadEvents.emit('statusChanged', item);
    }
    return;
  }

  item.status = 'downloading';
  downloads.set(downloadId, item);
  downloadEvents.emit('statusChanged', item); 
  downloadEvents.emit('progress', { downloadId, progress: 0, status: 'downloading' });

  try {
    const fallbackDownloadDir = app.getPath('videos'); // Electron's default videos path
    const defaultDownloadDir = await getSetting('downloadLocation', fallbackDownloadDir) || fallbackDownloadDir;
    const finalOutputPath = item.outputPath || path.join(defaultDownloadDir, `${item.id}.%(ext)s`);
    item.outputPath = finalOutputPath; // Update the item with the resolved path

    // Use finalOutputPath directly as it's guaranteed to be a string here
    await fs.ensureDir(path.dirname(finalOutputPath));
    
    const qualityToUse = item.requestedQuality || await getSetting('defaultQuality', '1080p');
    const formatToUse = item.requestedFormat || await getSetting('downloadFormat', 'mp4');

    let formatSelection = '';
    if (qualityToUse === 'best') {
      formatSelection = `bestvideo[ext=${formatToUse}]+bestaudio[ext=m4a]/best[ext=${formatToUse}]/best`;
    } else {
      // Ensure qualityToUse is not undefined and is a string with 'p' before calling replace
      const height = qualityToUse ? qualityToUse.replace('p', '') : '1080'; // Default height if undefined
      formatSelection = `bestvideo[ext=${formatToUse}][height<=?${height}]+bestaudio[ext=m4a]/bestvideo[ext=${formatToUse}]+bestaudio/best[ext=${formatToUse}]/best`;
    }
    
    const args: string[] = [item.url];
    args.push('-f', formatSelection);
    args.push('-o', item.outputPath);
    if (ffmpegPathExternal) {
        args.push('--ffmpeg-location', ffmpegPathExternal);
    }

    console.log(`[DownloadManager] Starting download for ${item.title} with args:`, args.join(' '));

    ytDlpWrap.exec(args)
      .on('progress', (progress) => {
        item.progress = progress.percent || 0;
        item.eta = progress.eta;
        item.speed = progress.currentSpeed;
        downloads.set(downloadId, item);
        downloadEvents.emit('progress', { downloadId, ...progress, status: 'downloading' });
      })
      .on('ytDlpEvent', (eventType, eventData) => {})
      .on('error', (error) => {
        console.error(`[DownloadManager] Error downloading ${item.title} (ID: ${downloadId}):`, error);
        item.status = 'error';
        downloads.set(downloadId, item);
        downloadEvents.emit('statusChanged', item);
        downloadEvents.emit('error', { downloadId, error: error.message });
      })
      .on('close', () => {
        if (item.status === 'downloading') {
          item.status = 'completed';
          item.progress = 100;
          console.log(`[DownloadManager] Download completed for ${item.title} (ID: ${downloadId})`);
          downloads.set(downloadId, item);
          downloadEvents.emit('statusChanged', item);
          downloadEvents.emit('completed', { downloadId });
        }
      });
      
  } catch (error: any) {
    console.error(`[DownloadManager] Failed to start download for ${item.title} (ID: ${downloadId}):`, error);
    item.status = 'error';
    downloads.set(downloadId, item);
    downloadEvents.emit('statusChanged', item);
    downloadEvents.emit('error', { downloadId, error: error.message });
  }
}

export const addItemToQueue = (itemDetails: DownloadAddItemDetails): DownloadQueueItem | null => {
  if (!ytDlpWrap) {
    console.error('[DownloadManager] YTDlpWrap instance not initialized.');
    return null;
  }

  // Use itemDetails.id if provided, otherwise generate one.
  // The ID from itemDetails usually comes from the Video object (e.g., YouTube video ID)
  const downloadId = itemDetails.id || `dl-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;

  const newItem: DownloadQueueItem = {
    id: downloadId, 
    url: itemDetails.url,
    title: itemDetails.title,
    thumbnailUrl: itemDetails.thumbnail_url,
    playlistId: itemDetails.playlistId,
    outputPath: itemDetails.outputPath,
    status: 'pending',
    progress: 0,
    addedAt: new Date().toISOString(),
    duration: itemDetails.duration,
    requestedFormat: itemDetails.requestedFormat,
    requestedQuality: itemDetails.requestedQuality,
  };

  downloads.set(downloadId, newItem);
  downloadEvents.emit('statusChanged', newItem);

  downloadQueue?.add(() => processDownload(downloadId)).catch(error => {
    console.error(`[DownloadManager] Unhandled error in PQueue for download ${downloadId}:`, error);
    const item = downloads.get(downloadId);
    if (item) {
        item.status = 'error';
        downloads.set(downloadId, item);
        downloadEvents.emit('statusChanged', item);
    }
  });

  console.log(`[DownloadManager] Item ${downloadId} added to queue. Title: ${newItem.title}`);
  return newItem;
}

export async function pauseItem(downloadId: string): Promise<IpcResponse<void>> {
  console.log('[DownloadManager] pauseItem called for ID:', downloadId);
  const item = downloads.get(downloadId);
  if (item && item.status === 'downloading') { 
    item.status = 'paused';
    downloads.set(downloadId, item);
    downloadEvents.emit('statusChanged', item);
    console.log(`[DownloadManager] Item ${downloadId} marked as paused (actual process pause not implemented).`);
    return { success: true };
  }
  return { success: false, error: 'Item not found or not downloadable.' };
}

export async function resumeItem(downloadId: string): Promise<IpcResponse<void>> {
  console.log('[DownloadManager] resumeItem called for ID:', downloadId);
   const item = downloads.get(downloadId);
  if (item && item.status === 'paused') {
    item.status = 'pending'; 
    downloads.set(downloadId, item);
    downloadEvents.emit('statusChanged', item);
    console.log(`[DownloadManager] Item ${downloadId} marked as resumed/re-queued (actual process resume not implemented).`);
    return { success: true };
  }
  return { success: false, error: 'Item not found or not paused.' };
}

export async function cancelItem(downloadId: string): Promise<IpcResponse<void>> {
  console.log('[DownloadManager] cancelItem called for ID:', downloadId);
  const item = downloads.get(downloadId);
  if (item) {
    item.status = 'cancelled';
    downloads.set(downloadId, item);
    downloadEvents.emit('statusChanged', item);
    downloadQueue?.clear(); 
    console.log(`[DownloadManager] Item ${downloadId} marked as cancelled (actual process cancellation not implemented).`);
    return { success: true };
  }
  return { success: false, error: 'Item not found.' };
}

export async function retryItem(downloadId: string): Promise<IpcResponse<void>> {
  console.log('[DownloadManager] retryItem called for ID:', downloadId);
  const item = downloads.get(downloadId);
  if (item && (item.status === 'error' || item.status === 'cancelled')) {
    item.status = 'pending';
    item.progress = 0;
    downloads.set(downloadId, item);
    downloadEvents.emit('statusChanged', item);
    downloadQueue?.add(() => processDownload(downloadId)).catch(error => {
        console.error(`[DownloadManager] Unhandled error in PQueue for retry ${downloadId}:`, error);
    });
    console.log(`[DownloadManager] Item ${downloadId} re-queued for retry.`);
    return { success: true };
  }
  return { success: false, error: 'Item not found or not in a retryable state.' };
}

export async function removeItem(downloadId: string): Promise<IpcResponse<void>> {
  console.log('[DownloadManager] removeItem called for ID:', downloadId);
  if (downloads.has(downloadId)) {
    downloads.delete(downloadId);
    downloadEvents.emit('removed', { downloadId }); 
    console.log(`[DownloadManager] Item ${downloadId} removed from tracking.`);
    return { success: true };
  }
  return { success: false, error: 'Item not found.' };
}

export async function getAllItems(): Promise<IpcResponse<DownloadQueueItem[]>> {
  console.log('[DownloadManager] getAllItems called');
  return { success: true, data: Array.from(downloads.values()) };
}

export async function clearCompleted(): Promise<IpcResponse<void>> {
  console.log('[DownloadManager] clearCompleted called');
  let changed = false;
  downloads.forEach((item, id) => {
    if (item.status === 'completed') {
      downloads.delete(id);
      changed = true;
    }
  });
  if (changed) {
      downloadEvents.emit('clearedCompleted'); 
  }
  console.log('[DownloadManager] Completed items cleared.');
  return { success: true };
}

// For emitting progress, the DownloadManager would typically use an EventEmitter
// or have a way to send updates to the main process/IPC handlers,
// which then forward to the renderer.
// e.g., using something like:
// import { EventEmitter } from 'events';
// export const downloadEvents = new EventEmitter();
// downloadEvents.emit('progress', { downloadId: 'some-id', progress: 50 }); 