import { Playlist, Video } from '../../../shared/types/appTypes';

/**
 * Quality operations for playlists
 */
export const qualityOperations = {
  /**
   * Update the quality information for a single video
   */
  async updateVideoQuality(playlistId: string, videoId: string): Promise<Video | null> {
    try {
      if (window.api && window.api.playlists) {
        const updatedVideo = await window.api.playlists.updateVideoQuality(playlistId, videoId);
        return updatedVideo;
      } else {
        console.error('IPC bridge not available');
        throw new Error('IPC bridge not available');
      }
    } catch (error) {
      console.error(`Error updating quality for video ${videoId} in playlist ${playlistId}:`, error);
      throw error;
    }
  },

  /**
   * Update the quality information for all videos in a playlist
   */
  async updatePlaylistVideoQualities(
    playlistId: string,
    onProgress?: (status: string, count?: number, total?: number) => void
  ): Promise<number> {
    try {
      if (window.api && window.api.playlists) {
        // Register progress handler if provided
        let unsubscribe: (() => void) | undefined;
        
        if (onProgress) {
          unsubscribe = window.api.playlists.onQualityUpdateProgress((data) => {
            onProgress(data.status, data.count, data.total);
          });
        }
        
        // Start the update
        const updatedCount = await window.api.playlists.updatePlaylistVideoQualities(playlistId);
        
        // Unsubscribe from progress updates
        if (unsubscribe) {
          unsubscribe();
        }
        
        return updatedCount;
      } else {
        console.error('IPC bridge not available');
        throw new Error('IPC bridge not available');
      }
    } catch (error) {
      console.error(`Error updating qualities for playlist ${playlistId}:`, error);
      throw error;
    }
  },

  /**
   * Update the quality information for all videos in all playlists
   */
  async updateAllVideoQualities(
    onProgress?: (status: string, count?: number, total?: number) => void
  ): Promise<number> {
    try {
      if (window.api && window.api.playlists) {
        // Register progress handler if provided
        let unsubscribe: (() => void) | undefined;
        
        if (onProgress) {
          unsubscribe = window.api.playlists.onQualityUpdateProgress((data) => {
            onProgress(data.status, data.count, data.total);
          });
        }
        
        // Start the update
        const updatedCount = await window.api.playlists.updateAllVideoQualities();
        
        // Unsubscribe from progress updates
        if (unsubscribe) {
          unsubscribe();
        }
        
        return updatedCount;
      } else {
        console.error('IPC bridge not available');
        throw new Error('IPC bridge not available');
      }
    } catch (error) {
      console.error('Error updating all video qualities:', error);
      throw error;
    }
  }
};
