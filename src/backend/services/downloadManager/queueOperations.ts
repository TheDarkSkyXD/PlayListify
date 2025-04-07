import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { getSetting } from '../settingsManager';
import * as fileUtils from '../../utils/fileUtils/index';
import { logToFile } from '../logger';
import { DownloadItem, DownloadOptions } from './types';
import { DownloadManager } from './core';

// Patch the DownloadManager prototype with the implementation
DownloadManager.prototype.addToQueue = async function(
  videoUrl: string,
  videoId: string,
  title: string,
  outputDir: string,
  options: DownloadOptions = {},
  playlistId?: string,
  thumbnail?: string
): Promise<string> {
  return addToQueue(this, videoUrl, videoId, title, outputDir, options, playlistId, thumbnail);
};

DownloadManager.prototype.addMultipleToQueue = async function(
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
  return addMultipleToQueue(
    this,
    videos,
    playlistId,
    playlistName,
    customLocation,
    createPlaylistFolder
  );
};

/**
 * Add a video to the download queue
 */
export async function addToQueue(
  manager: DownloadManager,
  videoUrl: string,
  videoId: string,
  title: string,
  outputDir: string,
  options: DownloadOptions = {},
  playlistId?: string,
  thumbnail?: string
): Promise<string> {
  const props = manager.getProps();

  try {
    // Ensure we're initialized
    if (!props.initialized) {
      logToFile('INFO', 'Download manager not initialized, initializing now...');
      manager.initialize();
    }

    // Validate input parameters
    if (!videoUrl) {
      logToFile('ERROR', 'Cannot add to queue: videoUrl is empty');
      throw new Error('videoUrl is required');
    }

    if (!videoId) {
      logToFile('ERROR', 'Cannot add to queue: videoId is empty');
      throw new Error('videoId is required');
    }

    if (!title) {
      logToFile('ERROR', 'Cannot add to queue: title is empty');
      throw new Error('title is required');
    }

    if (!outputDir) {
      logToFile('ERROR', 'Cannot add to queue: outputDir is empty');
      throw new Error('outputDir is required');
    }

    // Ensure output directory exists
    try {
      await fs.ensureDir(outputDir);
      logToFile('INFO', `Ensured output directory exists: ${outputDir}`);
    } catch (dirError) {
      logToFile('ERROR', `Error checking/creating output directory: ${dirError}`);
      // Continue anyway, we'll handle the error during download
    }

    // Generate a unique download ID
    const downloadId = uuidv4();
    logToFile('INFO', `Generated download ID: ${downloadId} for video: ${title}`);

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
    props.downloads.set(downloadId, downloadItem);
    logToFile('INFO', `Added download to map: ${title} (${downloadId})`);

    // Send initial update to renderer
    manager.sendDownloadUpdate(downloadItem);

    // Add to queue
    if (props.queue) {
      props.queue.add(async () => {
        logToFile('INFO', `Processing download: ${title} (${downloadId})`);
        return manager.processDownload(downloadId);
      });
      logToFile('INFO', `Added download to queue: ${title} (${downloadId})`);
    } else {
      logToFile('ERROR', 'Download queue not initialized');
      throw new Error('Download queue not initialized');
    }

    // Verify the download was added to the map
    const verifyDownload = props.downloads.get(downloadId);
    if (!verifyDownload) {
      logToFile('ERROR', `Failed to add download to map: ${title} (${downloadId})`);
      throw new Error('Failed to add download to map');
    }

    return downloadId;
  } catch (error) {
    logToFile('ERROR', `Error adding download to queue: ${error}`);
    throw error;
  }
}

/**
 * Add multiple videos to the download queue
 */
export async function addMultipleToQueue(
  manager: DownloadManager,
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
  const props = manager.getProps();

  logToFile('INFO', '=== DOWNLOAD MANAGER ADD MULTIPLE TO QUEUE START ===');
  // Ensure we're initialized
  if (!props.initialized) {
    logToFile('INFO', 'Download manager not initialized, initializing now...');
    manager.initialize();
  }

  logToFile('INFO', `Adding ${videos.length} videos to download queue for playlist ${playlistName}`);
  logToFile('INFO', `Custom location: ${customLocation || 'Not specified'}`);
  logToFile('INFO', `Create playlist folder: ${createPlaylistFolder}`);

  // Get output directory for the playlist using fileUtils
  // This will create the directory if it doesn't exist
  const outputDir = await fileUtils.createDownloadDir(
    playlistId,
    playlistName,
    customLocation,
    createPlaylistFolder
  );

  logToFile('INFO', `Output directory: ${outputDir}`);

  // Add each video to the queue
  const downloadIds: string[] = [];
  for (const video of videos) {
    try {
      logToFile('INFO', `Adding video to queue: ${video.title} (${video.videoId})`);

      const downloadId = await manager.addToQueue(
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
      logToFile('INFO', `Video added to queue with download ID: ${downloadId}`);

      // Verify the download was added to the map
      const download = props.downloads.get(downloadId);
      if (download) {
        logToFile('INFO', `Verified download ${downloadId} is in the map: ${download.title}`);

        // Force send an update to the renderer
        manager.sendDownloadUpdate(download);
      } else {
        logToFile('ERROR', `Download ${downloadId} is NOT in the map!`);
      }
    } catch (error) {
      logToFile('ERROR', `Error adding video ${video.videoId} to queue: ${error}`);
      // Continue with the next video
    }
  }

  logToFile('INFO', `Added ${downloadIds.length} videos to download queue`);
  logToFile('INFO', '=== DOWNLOAD MANAGER ADD MULTIPLE TO QUEUE END ===');

  return downloadIds;
}
