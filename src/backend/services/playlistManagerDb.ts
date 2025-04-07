import * as ytDlpManager from './ytDlpManager';
import * as fileUtils from '../utils/fileUtils/index';
import * as dbManager from './databaseManager';
import { Playlist, Video } from '../../shared/types/appTypes';
import fs from 'fs-extra';
import path from 'path';
import { getSetting } from './settingsManager';
import { BrowserWindow } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

// Promisify exec for async/await usage
const execAsync = promisify(exec);

/**
 * Create a new empty playlist
 */
export async function createEmptyPlaylist(name: string, description?: string): Promise<Playlist> {
  try {
    const playlistId = uuidv4();
    const currentDate = new Date().toISOString();

    const playlist: Playlist = {
      id: playlistId,
      name,
      description,
      videos: [],
      source: 'local',
      createdAt: currentDate,
      updatedAt: currentDate
    };

    // Create the playlist in the database
    dbManager.createPlaylist(playlist);

    // Create the playlist directory for storing videos
    await fileUtils.createPlaylistDir(playlistId, name);

    return playlist;
  } catch (error: any) {
    console.error('Error creating empty playlist:', error);
    throw new Error(`Failed to create playlist: ${error.message}`);
  }
}

/**
 * Import a YouTube playlist
 */
export async function importYoutubePlaylist(
  playlistUrl: string,
  progressCallback?: (message: string, progress?: number, total?: number) => void,
  playlistInfo?: any
): Promise<Playlist> {
  try {
    // Create a combined callback that updates progress and notifies the main window
    const combinedProgressCallback = (message: string, progress?: number, total?: number) => {
      // Call the original callback if provided
      if (progressCallback) {
        progressCallback(message, progress, total);
      }

      // Notify all windows about the progress
      const windows = BrowserWindow.getAllWindows();
      for (const win of windows) {
        win.webContents.send('import-progress', { message, progress, total });
      }
    };

    // Get initial playlist info to create the playlist if not provided
    const playlistInfoToUse = playlistInfo || await ytDlpManager.getPlaylistInfo(playlistUrl);

    // Call the ytDlpManager with the combined callback and playlist info
    const importedPlaylist = await ytDlpManager.importYoutubePlaylist(playlistUrl, combinedProgressCallback, playlistInfoToUse);

    // Save the playlist to the database
    dbManager.createPlaylist(importedPlaylist);

    // Add each video to the database
    let skippedExistingVideos = 0;
    for (const video of importedPlaylist.videos) {
      // Before adding, check if the video already exists
      const existingVideo = dbManager.getVideoById(video.id, importedPlaylist.id);
      if (existingVideo) {
        skippedExistingVideos++;
      }

      // Add the video (the addVideo function will skip if it already exists)
      dbManager.addVideo(importedPlaylist.id, video);
    }

    // Log the number of skipped videos
    if (skippedExistingVideos > 0) {
      console.log(`Skipped ${skippedExistingVideos} videos that already exist in the playlist`);
      // Update the progress callback with this information
      combinedProgressCallback(`Import complete! (${skippedExistingVideos} videos already existed in the playlist)`);
    }

    return importedPlaylist;
  } catch (error: any) {
    console.error('Error importing YouTube playlist:', error);
    throw new Error(`Failed to import YouTube playlist: ${error.message}`);
  }
}

/**
 * Get all playlists
 */
export async function getAllPlaylists(): Promise<Playlist[]> {
  try {
    return dbManager.getAllPlaylists();
  } catch (error: any) {
    console.error('Error getting all playlists:', error);
    throw new Error(`Failed to get playlists: ${error.message}`);
  }
}

/**
 * Get a playlist by ID
 */
export async function getPlaylistById(playlistId: string): Promise<Playlist | null> {
  try {
    return dbManager.getPlaylistById(playlistId);
  } catch (error: any) {
    console.error(`Error getting playlist with ID ${playlistId}:`, error);
    throw new Error(`Failed to get playlist: ${error.message}`);
  }
}

/**
 * Delete a playlist
 */
export async function deletePlaylist(playlistId: string): Promise<boolean> {
  try {
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }

    // Delete from database
    const deleted = dbManager.deletePlaylist(playlistId);

    if (!deleted) {
      throw new Error(`Failed to delete playlist with ID ${playlistId} from database`);
    }

    // Delete the playlist directory
    try {
      const playlistDir = await fileUtils.findPlaylistDirById(playlistId);
      if (playlistDir && await fs.pathExists(playlistDir)) {
        await fs.remove(playlistDir);
      }
    } catch (e) {
      console.error(`Failed to delete playlist directory for ${playlistId}:`, e);
      // Continue even if directory deletion fails
    }

    return true;
  } catch (error: any) {
    console.error(`Error deleting playlist with ID ${playlistId}:`, error);
    throw new Error(`Failed to delete playlist: ${error.message}`);
  }
}

/**
 * Update a playlist
 */
export async function updatePlaylist(
  playlistId: string,
  updates: Partial<Omit<Playlist, 'id' | 'videos' | 'createdAt'>>
): Promise<Playlist> {
  try {
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }

    // Update in database
    const updatedPlaylist = dbManager.updatePlaylist(playlistId, updates);

    if (!updatedPlaylist) {
      throw new Error(`Failed to update playlist with ID ${playlistId} in database`);
    }

    // If the name changed, rename the playlist directory
    if (updates.name && updates.name !== playlist.name) {
      try {
        const oldDir = await fileUtils.findPlaylistDirById(playlistId);
        if (oldDir && await fs.pathExists(oldDir)) {
          const baseDir = getSetting('playlistLocation');
          const newDir = path.join(baseDir, `${playlistId}-${fileUtils.sanitizeFileName(updates.name)}`);

          if (oldDir !== newDir) {
            await fs.move(oldDir, newDir);
          }
        }
      } catch (e) {
        console.error(`Failed to rename playlist directory for ${playlistId}:`, e);
        // Continue even if directory renaming fails
      }
    }

    return updatedPlaylist;
  } catch (error: any) {
    console.error(`Error updating playlist with ID ${playlistId}:`, error);
    throw new Error(`Failed to update playlist: ${error.message}`);
  }
}

/**
 * Add a video to a playlist
 */
export async function addVideoToPlaylist(playlistId: string, videoUrl: string): Promise<Playlist> {
  try {
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }

    // Get yt-dlp path
    const ytDlpPath = ytDlpManager.getBundledYtDlpPath();

    try {
      // First try to get basic info with --list-formats to check if the video is available
      try {
        await execAsync(`"${ytDlpPath}" --list-formats --no-playlist "${videoUrl}"`, {
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });
      } catch (formatError: any) {
        // Check if this is a DRM-protected video
        if (formatError.stderr && formatError.stderr.includes('drm protected')) {
          throw new Error('This video is DRM protected and cannot be added to the playlist');
        }
      }

      // Use ytDlpManager to get video status which includes maxQuality
      const videoStatus = await ytDlpManager.checkVideoStatus(videoUrl);

      if (!videoStatus.available || !videoStatus.info) {
        throw new Error(`Video is not available: ${videoStatus.error || 'Unknown error'}`);
      }

      // Create a new video object using the info from checkVideoStatus
      const video: Video = {
        id: videoStatus.info.id,
        title: videoStatus.info.title,
        url: videoStatus.info.url,
        thumbnail: videoStatus.info.thumbnail,
        duration: videoStatus.info.duration,
        downloaded: false,
        addedAt: new Date().toISOString(),
        status: 'available',
        maxQuality: videoStatus.info.maxQuality // Include the maximum quality information
      };

      // Add the video to the database
      dbManager.addVideo(playlistId, video);

      // Get the updated playlist
      const updatedPlaylist = await getPlaylistById(playlistId);
      if (!updatedPlaylist) {
        throw new Error(`Failed to get updated playlist with ID ${playlistId}`);
      }

      return updatedPlaylist;
    } catch (error: any) {
      console.error('Error getting video info:', error);
      throw new Error(`Failed to get video info: ${error.message}`);
    }
  } catch (error: any) {
    console.error(`Error adding video to playlist with ID ${playlistId}:`, error);
    throw new Error(`Failed to add video to playlist: ${error.message}`);
  }
}

/**
 * Remove a video from a playlist
 */
export async function removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<Playlist> {
  try {
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }

    // Get the video to check if it exists and is downloaded
    const video = playlist.videos.find(v => v.id === videoId);
    if (!video) {
      throw new Error(`Video with ID ${videoId} not found in playlist`);
    }

    // Delete the video from the database
    const deleted = dbManager.deleteVideo(videoId, playlistId);

    if (!deleted) {
      throw new Error(`Failed to delete video with ID ${videoId} from database`);
    }

    // Remove actual video file if it exists
    try {
      if (video.downloadPath && await fs.pathExists(video.downloadPath)) {
        await fs.remove(video.downloadPath);
      } else {
        const videoPath = fileUtils.getVideoFilePath(playlistId, playlist.name, videoId);
        if (await fs.pathExists(videoPath)) {
          await fs.remove(videoPath);
        }
      }
    } catch (e) {
      // Just log, don't throw
      console.error(`Failed to remove video file for ${videoId}:`, e);
    }

    // Get the updated playlist
    const updatedPlaylist = await getPlaylistById(playlistId);
    if (!updatedPlaylist) {
      throw new Error(`Failed to get updated playlist with ID ${playlistId}`);
    }

    return updatedPlaylist;
  } catch (error: any) {
    console.error(`Error removing video from playlist with ID ${playlistId}:`, error);
    throw new Error(`Failed to remove video from playlist: ${error.message}`);
  }
}

/**
 * Download a video from a playlist
 */
export async function downloadPlaylistVideo(
  playlistId: string,
  videoId: string,
  options: {
    format?: string;
    quality?: string;
  } = {}
): Promise<Playlist> {
  try {
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }

    const video = playlist.videos.find(v => v.id === videoId);
    if (!video) {
      throw new Error(`Video with ID ${videoId} not found in playlist`);
    }

    if (video.downloaded && video.downloadPath && await fs.pathExists(video.downloadPath)) {
      console.log(`Video ${videoId} already downloaded to ${video.downloadPath}`);
      return playlist;
    }

    // Get the playlist video directory
    const playlistDir = path.join(getSetting('playlistLocation'), `${playlistId}-${fileUtils.sanitizeFileName(playlist.name)}`);
    const videoDir = path.join(playlistDir, 'videos');

    // Download the video
    const outputPath = await ytDlpManager.downloadVideo(video.url, videoDir, video.id, options);

    // Update video status in the database
    const updatedVideo = dbManager.updateVideo(videoId, {
      downloaded: true,
      downloadPath: outputPath,
      downloadStatus: 'completed',
      format: path.extname(outputPath).substring(1) // Remove the dot from extension
    });

    if (!updatedVideo) {
      throw new Error(`Failed to update video with ID ${videoId} in database`);
    }

    // Get the updated playlist
    const updatedPlaylist = await getPlaylistById(playlistId);
    if (!updatedPlaylist) {
      throw new Error(`Failed to get updated playlist with ID ${playlistId}`);
    }

    return updatedPlaylist;
  } catch (error: any) {
    console.error(`Error downloading video ${videoId} from playlist ${playlistId}:`, error);
    throw new Error(`Failed to download video: ${error.message}`);
  }
}

/**
 * Refresh a YouTube playlist (update metadata and check for new videos)
 */
export async function refreshYoutubePlaylist(playlistId: string): Promise<Playlist> {
  try {
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }

    // Only refresh YouTube playlists
    if (playlist.source !== 'youtube' || !playlist.sourceUrl) {
      throw new Error('Only YouTube playlists can be refreshed');
    }

    // Get the latest videos from YouTube
    const videos = await ytDlpManager.getPlaylistVideos(playlist.sourceUrl);

    // Create a map of existing videos by ID for quick lookup
    const existingVideosMap = new Map<string, Video>();
    for (const video of playlist.videos) {
      existingVideosMap.set(video.id, video);
    }

    // Start a database transaction for all updates
    const db = dbManager.getDatabase();

    // Use a transaction to ensure all updates are atomic
    db.transaction(() => {
      // Process each video from YouTube
      for (const newVideo of videos) {
        const existingVideo = existingVideosMap.get(newVideo.id);

        if (existingVideo) {
          // Update existing video with new metadata but keep download status
          dbManager.updateVideo(newVideo.id, {
            title: newVideo.title,
            url: newVideo.url,
            thumbnail: newVideo.thumbnail,
            duration: newVideo.duration,
            status: newVideo.status
          });

          // Remove from map to track which videos are no longer in the playlist
          existingVideosMap.delete(newVideo.id);
        } else {
          // This is a new video, add it to the database
          dbManager.addVideo(playlistId, newVideo);
        }
      }

      // Get updated playlist info
      if (playlist.sourceUrl) {
        ytDlpManager.getPlaylistInfo(playlist.sourceUrl)
          .then(playlistInfo => {
          // Update playlist metadata
          dbManager.updatePlaylist(playlistId, {
            name: playlistInfo.title || playlist.name,
            description: playlistInfo.description || playlist.description,
            thumbnail: playlistInfo.thumbnailUrl || playlist.thumbnail,
            updatedAt: new Date().toISOString()
          });
        })
        .catch(error => {
          console.error(`Error getting updated playlist info for ${playlistId}:`, error);
        });
      }
    })();

    // Get the updated playlist
    const updatedPlaylist = await getPlaylistById(playlistId);
    if (!updatedPlaylist) {
      throw new Error(`Failed to get updated playlist with ID ${playlistId}`);
    }

    return updatedPlaylist;
  } catch (error: any) {
    console.error(`Error refreshing YouTube playlist with ID ${playlistId}:`, error);
    throw new Error(`Failed to refresh YouTube playlist: ${error.message}`);
  }
}

/**
 * Search for playlists
 */
export async function searchPlaylists(query: string): Promise<Playlist[]> {
  try {
    return dbManager.searchPlaylists(query);
  } catch (error: any) {
    console.error(`Error searching playlists with query "${query}":`, error);
    throw new Error(`Failed to search playlists: ${error.message}`);
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  playlistCount: number;
  videoCount: number;
  downloadedVideoCount: number;
  totalVideoSize: number;
}> {
  try {
    return dbManager.getDatabaseStats();
  } catch (error: any) {
    console.error('Error getting database stats:', error);
    throw new Error(`Failed to get database stats: ${error.message}`);
  }
}
