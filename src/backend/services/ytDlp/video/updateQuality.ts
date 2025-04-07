import { Video } from '../../../shared/types/appTypes';
import { checkVideoStatus } from './checkStatus';
import * as dbManager from '../../databaseManager';

/**
 * Update the maxQuality field for a single video
 *
 * @param video The video to update
 * @returns The updated video or null if the update failed
 */
export async function updateVideoQuality(video: Video): Promise<Video | null> {
  try {
    console.log(`Checking quality for video: ${video.title} (${video.id})`);

    // Skip videos that already have maxQuality information
    if (video.maxQuality && video.maxQuality !== 'unknown') {
      console.log(`Video ${video.id} already has quality information: ${video.maxQuality}`);
      return video;
    }

    console.log(`Updating quality information for video: ${video.title} (${video.id})`);

    // Check the video status to get the maxQuality
    console.log(`Checking status for video ${video.id} at URL: ${video.url}`);
    const videoStatus = await checkVideoStatus(video.url);

    if (!videoStatus.available || !videoStatus.info) {
      console.warn(`Video ${video.id} is not available: ${videoStatus.error || 'Unknown error'}`);

      // Even if we can't get the status, update with a default quality
      // This prevents repeated attempts to check unavailable videos
      const defaultQuality = '720p';
      console.log(`Using default quality for unavailable video ${video.id}: ${defaultQuality}`);

      // Update the video in the database with the default quality
      const updatedVideo = dbManager.updateVideo(video.id, {
        maxQuality: defaultQuality
      });

      if (!updatedVideo) {
        console.error(`Failed to update video ${video.id} in database with default quality`);
        return null;
      }

      // Return the updated video with the default quality
      return {
        ...video,
        maxQuality: defaultQuality
      };
    }

    // Update the video in the database
    const updatedVideo = dbManager.updateVideo(video.id, {
      maxQuality: videoStatus.info.maxQuality
    });

    if (!updatedVideo) {
      console.error(`Failed to update video ${video.id} in database`);
      return null;
    }

    // Return the updated video with the new maxQuality
    const result = {
      ...video,
      maxQuality: videoStatus.info.maxQuality
    };

    console.log(`Updated quality information for video ${video.id}: ${result.maxQuality}`);
    return result;
  } catch (error: any) {
    console.error(`Error updating quality for video ${video.id}:`, error);
    console.error(`Error details: ${error.message || 'Unknown error'}`);

    // Even if we encounter an error, update with a default quality
    // This prevents repeated attempts to check problematic videos
    try {
      const defaultQuality = '720p';
      console.log(`Using default quality due to error for video ${video.id}: ${defaultQuality}`);

      // Update the video in the database with the default quality
      const updatedVideo = dbManager.updateVideo(video.id, {
        maxQuality: defaultQuality
      });

      if (!updatedVideo) {
        console.error(`Failed to update video ${video.id} in database with default quality`);
        return null;
      }

      // Return the updated video with the default quality
      return {
        ...video,
        maxQuality: defaultQuality
      };
    } catch (fallbackError) {
      console.error(`Error in fallback quality update for video ${video.id}:`, fallbackError);
      return null;
    }
  }
}

/**
 * Update the maxQuality field for all videos in a playlist
 *
 * @param playlistId The ID of the playlist to update
 * @param progressCallback Optional callback to report progress
 * @returns The number of videos successfully updated
 */
export async function updatePlaylistVideoQualities(
  playlistId: string,
  progressCallback?: (message: string, progress?: number, total?: number) => void
): Promise<number> {
  try {
    // Get the playlist
    const playlist = dbManager.getPlaylistById(playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }

    const videos = playlist.videos;
    let updatedCount = 0;

    // Update each video
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];

      // Report progress
      if (progressCallback) {
        progressCallback(
          `Updating quality information for ${video.title}`,
          i + 1,
          videos.length
        );
      }

      // Skip videos that already have maxQuality information
      if (video.maxQuality && video.maxQuality !== 'unknown') {
        continue;
      }

      const updatedVideo = await updateVideoQuality(video);
      if (updatedVideo) {
        updatedCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Report completion
    if (progressCallback) {
      progressCallback(`Updated quality information for ${updatedCount} videos`, videos.length, videos.length);
    }

    return updatedCount;
  } catch (error) {
    console.error(`Error updating playlist ${playlistId} video qualities:`, error);
    throw error;
  }
}

/**
 * Update the maxQuality field for all videos in all playlists
 *
 * @param progressCallback Optional callback to report progress
 * @returns The number of videos successfully updated
 */
export async function updateAllVideoQualities(
  progressCallback?: (message: string, progress?: number, total?: number) => void
): Promise<number> {
  try {
    // Get all playlists
    const playlists = dbManager.getAllPlaylists();
    let totalUpdated = 0;

    // Update each playlist
    for (let i = 0; i < playlists.length; i++) {
      const playlist = playlists[i];

      // Report progress
      if (progressCallback) {
        progressCallback(
          `Updating playlist ${i + 1} of ${playlists.length}: ${playlist.name}`,
          i + 1,
          playlists.length
        );
      }

      const updatedCount = await updatePlaylistVideoQualities(
        playlist.id,
        progressCallback
      );

      totalUpdated += updatedCount;
    }

    return totalUpdated;
  } catch (error) {
    console.error('Error updating all video qualities:', error);
    throw error;
  }
}
