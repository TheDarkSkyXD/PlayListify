import * as ytDlpManager from './ytDlpManager';
import * as fileUtils from '../utils/fileUtils';
import { Playlist, Video } from '../../shared/types/appTypes';
import fs from 'fs-extra';
import path from 'path';
import { getSetting } from './settingsManager';
import { BrowserWindow } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';

// Promisify exec for async/await usage
const execAsync = promisify(exec);

/**
 * Create a new empty playlist
 */
export async function createEmptyPlaylist(name: string, description?: string): Promise<Playlist> {
  try {
    const playlistId = fileUtils.createPlaylistId();
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

    // Create the playlist directory
    await fileUtils.createPlaylistDir(playlistId, name);

    // Save the playlist metadata
    await fileUtils.writePlaylistMetadata(playlistId, name, playlist);

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
  progressCallback?: (status: string, count?: number, total?: number) => void,
  playlistInfo?: any
): Promise<Playlist> {
  try {
    // Create a wrapper progress callback that both calls the provided callback and sends updates to all windows
    const combinedProgressCallback = (status: string, count?: number, total?: number) => {
      // Log the progress update
      console.log(`Progress update: status=${status}, count=${count}, total=${total}`);

      // Call the provided callback if it exists
      if (progressCallback) {
        progressCallback(status, count, total);
      }

      // Send progress updates to all windows
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        // Send the update to all windows
        for (const win of windows) {
          if (!win.isDestroyed()) {
            // Make sure we're sending valid data
            const data = {
              status: status || 'Processing...',
              count: typeof count === 'number' ? count : 0,
              total: typeof total === 'number' ? total : 0
            };

            // Log what we're sending
            console.log(`Sending to window: ${JSON.stringify(data)}`);

            win.webContents.send('yt:importProgress', data);
          }
        }
      } else {
        console.warn('No browser windows available for progress updates');
      }
    };

    // Call the ytDlpManager with the combined callback and playlist info
    return await ytDlpManager.importYoutubePlaylist(playlistUrl, combinedProgressCallback, playlistInfo);
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
    return await fileUtils.getAllPlaylists();
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
    // First try to find the playlist in the list of all playlists
    const playlists = await getAllPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);

    if (playlist) {
      return playlist;
    }

    // If not found, try to find the playlist directory directly
    const playlistDir = await fileUtils.findPlaylistDirById(playlistId);
    if (playlistDir) {
      // If found, read the metadata from the directory
      const metadataPath = path.join(playlistDir, 'metadata', 'playlist-info.json');
      if (await fs.pathExists(metadataPath)) {
        const metadata = await fs.readJson(metadataPath);
        return metadata;
      }
    }

    return null;
  } catch (error: any) {
    console.error(`Error getting playlist with ID ${playlistId}:`, error);
    throw new Error(`Failed to get playlist: ${error.message}`);
  }
}

/**
 * Delete a playlist
 */
export async function deletePlaylist(playlistId: string): Promise<void> {
  try {
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }

    await fileUtils.deletePlaylist(playlistId, playlist.name);
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

    const updatedPlaylist: Playlist = {
      ...playlist,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // The writePlaylistMetadata function now handles directory renaming internally
    await fileUtils.writePlaylistMetadata(
      playlistId,
      updatedPlaylist.name,
      updatedPlaylist
    );

    console.log(`Playlist ${playlistId} updated successfully`);
    console.log('Updated playlist:', updatedPlaylist);

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

    // Get the path to the bundled yt-dlp binary
    const ytDlpPath = ytDlpManager.getBundledYtDlpPath();

    // Initialize yt-dlp if needed (this will be a no-op if already initialized)
    await ytDlpManager.initYtDlp(undefined, true);

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

      // Use the direct command approach instead of relying on file output
      // Add --no-check-certificate to avoid SSL issues
      const { stdout } = await execAsync(`"${ytDlpPath}" --dump-json --no-playlist --no-check-certificate "${videoUrl}"`, {
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      if (!stdout || stdout.trim() === '') {
        throw new Error('No data returned from yt-dlp');
      }

      // Parse video info
      const videoInfo = JSON.parse(stdout);
      const currentDate = new Date().toISOString();

      const video: Video = {
        id: videoInfo.id,
        title: videoInfo.title,
        url: videoInfo.webpage_url || videoUrl,
        thumbnail: videoInfo.thumbnail,
        duration: videoInfo.duration,
        downloaded: false,
        addedAt: currentDate,
        status: 'available'
      };

      // Check if video already exists in playlist
      if (playlist.videos.some(v => v.id === video.id)) {
        throw new Error(`Video with ID ${video.id} already exists in the playlist`);
      }

      // Add video to playlist
      playlist.videos.push(video);
      playlist.updatedAt = currentDate;

      // Update playlist thumbnail with the first video's thumbnail if:
      // 1. This is a custom playlist (not from YouTube)
      // 2. The playlist doesn't already have a thumbnail
      // 3. The video has a thumbnail
      if (!playlist.sourceUrl && !playlist.thumbnail && video.thumbnail) {
        console.log(`Setting playlist thumbnail to first video's thumbnail: ${video.thumbnail}`);
        playlist.thumbnail = video.thumbnail;
      }

      // Save updated playlist
      await fileUtils.writePlaylistMetadata(playlistId, playlist.name, playlist);

      return playlist;
    } catch (error) {
      console.error('Error executing yt-dlp:', error);
      throw new Error(`Failed to extract video info: ${error instanceof Error ? error.message : String(error)}`);
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

    // Check if video exists in playlist
    const videoIndex = playlist.videos.findIndex(v => v.id === videoId);
    if (videoIndex === -1) {
      throw new Error(`Video with ID ${videoId} not found in the playlist`);
    }

    // Store the video being removed
    const removedVideo = playlist.videos[videoIndex];

    // Remove video from playlist
    playlist.videos.splice(videoIndex, 1);
    playlist.updatedAt = new Date().toISOString();

    // If this was a custom playlist and we're removing the video that provided the thumbnail,
    // update the thumbnail to use the next available video's thumbnail
    if (!playlist.sourceUrl && playlist.thumbnail === removedVideo.thumbnail) {
      // Find the first video with a thumbnail
      const nextVideoWithThumbnail = playlist.videos.find(v => v.thumbnail);
      if (nextVideoWithThumbnail) {
        console.log(`Updating playlist thumbnail to next video's thumbnail: ${nextVideoWithThumbnail.thumbnail}`);
        playlist.thumbnail = nextVideoWithThumbnail.thumbnail;
      } else {
        // No videos with thumbnails left, remove the thumbnail
        console.log('Removing playlist thumbnail as no videos with thumbnails remain');
        playlist.thumbnail = undefined;
      }
    }

    // Save updated playlist
    await fileUtils.writePlaylistMetadata(playlistId, playlist.name, playlist);

    // Remove actual video file if it exists
    try {
      const videoPath = fileUtils.getVideoFilePath(playlistId, playlist.name, videoId);
      if (await fs.pathExists(videoPath)) {
        await fs.remove(videoPath);
      }
    } catch (e) {
      // Just log, don't throw
      console.error(`Failed to remove video file for ${videoId}:`, e);
    }

    return playlist;
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
  options?: { format?: string; quality?: string }
): Promise<string> {
  try {
    const playlist = await getPlaylistById(playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }

    // Find the video in the playlist
    const video = playlist.videos.find(v => v.id === videoId);
    if (!video) {
      throw new Error(`Video with ID ${videoId} not found in the playlist`);
    }

    // Get the playlist video directory
    const playlistDir = path.join(getSetting('playlistLocation'), `${playlistId}-${fileUtils.sanitizeFileName(playlist.name)}`);
    const videoDir = path.join(playlistDir, 'videos');

    // Download the video
    const outputPath = await ytDlpManager.downloadVideo(video.url, videoDir, video.id, options);

    // Update video status in the playlist
    video.downloaded = true;
    video.downloadPath = outputPath;
    video.downloadStatus = 'completed';
    playlist.updatedAt = new Date().toISOString();

    // Save updated playlist
    await fileUtils.writePlaylistMetadata(playlistId, playlist.name, playlist);

    return outputPath;
  } catch (error: any) {
    console.error(`Error downloading video from playlist with ID ${playlistId}:`, error);
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

    // Merge existing videos with new ones
    const mergedVideos: Video[] = [];
    for (const newVideo of videos) {
      const existingVideo = existingVideosMap.get(newVideo.id);
      if (existingVideo) {
        // Keep download status and other user-specific properties
        mergedVideos.push({
          ...newVideo,
          downloaded: existingVideo.downloaded,
          downloadPath: existingVideo.downloadPath,
          downloadStatus: existingVideo.downloadStatus,
          // Keep the original addedAt date
          addedAt: existingVideo.addedAt
        });
        // Remove from map to track which videos are no longer in the playlist
        existingVideosMap.delete(newVideo.id);
      } else {
        // This is a new video
        mergedVideos.push(newVideo);
      }
    }

    // Get updated playlist info
    const playlistInfo = await ytDlpManager.getPlaylistInfo(playlist.sourceUrl);

    // Update the playlist
    const updatedPlaylist: Playlist = {
      ...playlist,
      name: playlistInfo.title || playlist.name,
      description: playlistInfo.description || playlist.description,
      thumbnail: playlistInfo.thumbnailUrl || playlist.thumbnail,
      videos: mergedVideos,
      updatedAt: new Date().toISOString()
    };

    // Save the updated playlist
    await fileUtils.writePlaylistMetadata(playlistId, updatedPlaylist.name, updatedPlaylist);

    return updatedPlaylist;
  } catch (error: any) {
    console.error(`Error refreshing YouTube playlist with ID ${playlistId}:`, error);
    throw new Error(`Failed to refresh YouTube playlist: ${error.message}`);
  }
}