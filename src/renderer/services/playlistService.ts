import { Playlist, Video } from '../../shared/types/appTypes';

/**
 * Service to manage playlists using the electron IPC bridge
 */
export const playlistService = {
  /**
   * Get all playlists
   */
  async getPlaylists(): Promise<Playlist[]> {
    try {
      if (!window.api) {
        throw new Error('IPC bridge not available');
      }
      return await window.api.invoke('playlist:getAll');
    } catch (error) {
      console.error('Error fetching playlists:', error);
      throw error;
    }
  },

  /**
   * Get a playlist by ID
   */
  async getPlaylist(id: string): Promise<Playlist | null> {
    try {
      if (!window.api) {
        throw new Error('IPC bridge not available');
      }
      return await window.api.invoke('playlist:getById', id);
    } catch (error) {
      console.error(`Error fetching playlist ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new playlist
   */
  async createPlaylist(playlistData: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Playlist> {
    try {
      if (!window.api) {
        throw new Error('IPC bridge not available');
      }
      
      const playlist = await window.api.invoke('playlist:create', 
        playlistData.name, 
        playlistData.description
      );
      
      // If there are videos in the playlist data, we need to add them
      if (playlistData.videos && playlistData.videos.length > 0) {
        // We'll need to do this one by one since the API doesn't support batch adding
        for (const video of playlistData.videos) {
          if (video.url) {
            await window.api.invoke('playlist:addVideo', playlist.id, video.url);
          }
        }
        
        // Fetch the updated playlist with videos
        return await window.api.invoke('playlist:getById', playlist.id) as Playlist;
      }
      
      return playlist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  },

  /**
   * Update an existing playlist
   */
  async updatePlaylist(playlist: Playlist): Promise<Playlist> {
    try {
      if (!window.api) {
        throw new Error('IPC bridge not available');
      }
      
      const { id, name, description, thumbnail, source, sourceUrl, tags } = playlist;
      
      return await window.api.invoke('playlist:update', id, {
        name,
        description,
        thumbnail,
        source,
        sourceUrl,
        tags,
      });
    } catch (error) {
      console.error(`Error updating playlist ${playlist.id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a playlist
   */
  async deletePlaylist(id: string): Promise<void> {
    try {
      if (!window.api) {
        throw new Error('IPC bridge not available');
      }
      
      await window.api.invoke('playlist:delete', id);
    } catch (error) {
      console.error(`Error deleting playlist ${id}:`, error);
      throw error;
    }
  },

  /**
   * Import a playlist from YouTube
   */
  async importPlaylist(url: string): Promise<Playlist> {
    try {
      if (!window.api) {
        throw new Error('IPC bridge not available');
      }
      
      return await window.api.invoke('yt:importPlaylist', url);
    } catch (error) {
      console.error('Error importing playlist:', error);
      throw error;
    }
  },

  /**
   * Add a video to a playlist
   */
  async addVideoToPlaylist(playlistId: string, video: Omit<Video, 'id'>): Promise<Playlist> {
    try {
      if (!video.url) {
        throw new Error('Video URL is required');
      }
      
      if (!window.api) {
        throw new Error('IPC bridge not available');
      }
      
      // Add the video to the playlist
      return await window.api.invoke('playlist:addVideo', playlistId, video.url);
    } catch (error) {
      console.error(`Error adding video to playlist ${playlistId}:`, error);
      throw error;
    }
  },

  /**
   * Remove a video from a playlist
   */
  async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<Playlist> {
    try {
      if (!window.api) {
        throw new Error('IPC bridge not available');
      }
      
      // Remove the video from the playlist
      return await window.api.invoke('playlist:removeVideo', playlistId, videoId);
    } catch (error) {
      console.error(`Error removing video ${videoId} from playlist ${playlistId}:`, error);
      throw error;
    }
  },

  /**
   * Download a video
   */
  async downloadVideo(
    playlistId: string, 
    videoId: string, 
    onProgress: (progress: number) => void
  ): Promise<string> {
    try {
      if (!window.api) {
        throw new Error('IPC bridge not available');
      }
      
      // Get the playlist and video
      const playlist = await this.getPlaylist(playlistId);
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      
      const video = playlist.videos.find(v => v.id === videoId);
      if (!video) {
        throw new Error('Video not found in playlist');
      }
      
      // Set up a progress event listener
      const progressHandler = (_event: any, progress: number) => {
        onProgress(progress);
      };
      
      // Register the handler for download progress
      window.api.receive(`download-progress-${videoId}`, progressHandler);
      
      // Start the download
      const downloadPath = await window.api.invoke('playlist:downloadVideo', playlistId, videoId);
      
      // Clean up the event listener
      // Note: In a real implementation, you'd need a way to remove listeners
      
      return downloadPath;
    } catch (error) {
      console.error(`Error downloading video ${videoId} from playlist ${playlistId}:`, error);
      throw new Error('Failed to download video');
    }
  },

  /**
   * Download all videos in a playlist
   */
  async downloadPlaylist(
    playlistId: string, 
    onProgress: (completed: number, total: number) => void
  ): Promise<string[]> {
    try {
      if (!window.api) {
        throw new Error('IPC bridge not available');
      }
      
      // Get the playlist
      const playlist = await this.getPlaylist(playlistId);
      if (!playlist) {
        throw new Error('Playlist not found');
      }
      
      const videos = playlist.videos;
      const total = videos.length;
      const downloadPaths: string[] = [];
      
      // Download each video sequentially
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        
        try {
          // Skip already downloaded videos
          if (video.downloaded) {
            onProgress(i + 1, total);
            continue;
          }
          
          const downloadPath = await window.api.invoke('playlist:downloadVideo', playlistId, video.id);
          downloadPaths.push(downloadPath);
          
          // Update progress after each video
          onProgress(i + 1, total);
        } catch (videoError) {
          console.error(`Error downloading video ${video.id}:`, videoError);
          // Continue with next video instead of failing the whole operation
        }
      }
      
      return downloadPaths;
    } catch (error) {
      console.error(`Error downloading playlist ${playlistId}:`, error);
      throw new Error('Failed to download playlist');
    }
  }
}; 