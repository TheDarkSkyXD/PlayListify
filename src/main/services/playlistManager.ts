import * as ytDlpManager from './ytDlpManager';
import * as fileUtils from '../utils/fileUtils';
import { Playlist, Video } from '../../shared/types/appTypes';
import fs from 'fs-extra';
import path from 'path';
import { getSetting } from './settingsManager';
import { IpcMainInvokeEvent } from 'electron';

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
export async function importYoutubePlaylist(playlistUrl: string, event?: IpcMainInvokeEvent): Promise<Playlist> {
  try {
    return await ytDlpManager.importYoutubePlaylist(playlistUrl, (status, count, total) => {
      // Send progress updates via a separate channel if event is provided
      if (event?.sender) {
        event.sender.send('yt:importProgress', { status, count, total });
      }
    });
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
    const playlists = await getAllPlaylists();
    return playlists.find(playlist => playlist.id === playlistId) || null;
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
    
    await fileUtils.writePlaylistMetadata(playlistId, updatedPlaylist.name, updatedPlaylist);
    
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
    
    // Initialize yt-dlp if needed
    await ytDlpManager.initYtDlp();
    
    // Use yt-dlp to get video info
    const tempFile = fileUtils.getTempFilePath('json');
    const ytDlp = new (require('yt-dlp-wrap').default)();
    await ytDlp.execPromise(['--dump-json', '--no-playlist', '-o', tempFile, videoUrl]);
    
    const jsonStr = await fs.readFile(tempFile, 'utf-8');
    await fs.remove(tempFile);
    
    // Parse video info
    const videoInfo = JSON.parse(jsonStr);
    const currentDate = new Date().toISOString();
    
    const video: Video = {
      id: videoInfo.id,
      title: videoInfo.title,
      url: videoInfo.webpage_url,
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
    
    // Save updated playlist
    await fileUtils.writePlaylistMetadata(playlistId, playlist.name, playlist);
    
    return playlist;
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
    
    // Remove video from playlist
    playlist.videos.splice(videoIndex, 1);
    playlist.updatedAt = new Date().toISOString();
    
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