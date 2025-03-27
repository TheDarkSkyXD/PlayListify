import { Playlist, Video } from '../../shared/types/appTypes';
import { v4 as uuidv4 } from 'uuid';

// Helper function to simulate API request delay (for development)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Service to manage playlists using the electron IPC bridge
 */
export const playlistService = {
  /**
   * Get all playlists
   */
  async getPlaylists(): Promise<Playlist[]> {
    try {
      // Check if the IPC bridge is available
      if (window.api && window.api.playlists) {
        const playlists = await window.api.playlists.getAll();
        return playlists;
      } else {
        console.error('IPC bridge not available');
        return [];
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      return [];
    }
  },

  /**
   * Get a playlist by ID
   */
  async getPlaylist(id: string): Promise<Playlist | null> {
    try {
      // Check if the IPC bridge is available
      if (window.api && window.api.playlists) {
        const playlist = await window.api.playlists.getById(id);
        return playlist;
      } else {
        console.error('IPC bridge not available');
        return null;
      }
    } catch (error) {
      console.error(`Error fetching playlist ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new playlist
   */
  async createPlaylist(playlistData: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Playlist> {
    try {
      if (window.api && window.api.playlists) {
        const playlist = await window.api.playlists.create(
          playlistData.name, 
          playlistData.description
        );
        
        // If there are videos in the playlist data, we need to add them
        if (playlistData.videos && playlistData.videos.length > 0) {
          // We'll need to do this one by one since the API doesn't support batch adding
          for (const video of playlistData.videos) {
            if (video.url) {
              await window.api.playlists.addVideo(playlist.id, video.url);
            }
          }
          
          // Fetch the updated playlist with videos
          const updatedPlaylist = await window.api.playlists.getById(playlist.id);
          return updatedPlaylist || playlist;
        }
        
        return playlist;
      } else {
        console.error('IPC bridge not available');
        throw new Error('IPC bridge not available');
      }
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
      if (window.api && window.api.playlists) {
        const { id, name, description, thumbnail, source, sourceUrl, tags } = playlist;
        
        const updatedPlaylist = await window.api.playlists.update(id, {
          name,
          description,
          thumbnail,
          source,
          sourceUrl,
          tags,
        });
        
        return updatedPlaylist;
      } else {
        console.error('IPC bridge not available');
        throw new Error('IPC bridge not available');
      }
    } catch (error) {
      console.error(`Error updating playlist ${playlist.id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a playlist by ID
   */
  async deletePlaylist(id: string): Promise<void> {
    try {
      if (window.api && window.api.playlists) {
        await window.api.playlists.delete(id);
      } else {
        console.error('IPC bridge not available');
        throw new Error('IPC bridge not available');
      }
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
      if (window.api && window.api.youtube) {
        const playlist = await window.api.youtube.importPlaylist(url);
        return playlist;
      } else {
        console.error('IPC bridge not available');
        throw new Error('IPC bridge not available');
      }
    } catch (error) {
      console.error(`Error importing playlist from ${url}:`, error);
      throw error;
    }
  },

  /**
   * Add a video to a playlist
   */
  async addVideoToPlaylist(playlistId: string, video: Omit<Video, 'id'>): Promise<Playlist> {
    try {
      if (window.api && window.api.playlists) {
        // We need the URL to add a video
        if (!video.url) {
          throw new Error('Video URL is required');
        }
        
        await window.api.playlists.addVideo(playlistId, video.url);
        
        // Fetch the updated playlist
        const updatedPlaylist = await window.api.playlists.getById(playlistId);
        if (!updatedPlaylist) {
          throw new Error(`Playlist ${playlistId} not found after adding video`);
        }
        return updatedPlaylist;
      } else {
        console.error('IPC bridge not available');
        throw new Error('IPC bridge not available');
      }
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
      if (window.api && window.api.playlists) {
        await window.api.playlists.removeVideo(playlistId, videoId);
        
        // Fetch the updated playlist
        const updatedPlaylist = await window.api.playlists.getById(playlistId);
        if (!updatedPlaylist) {
          throw new Error(`Playlist ${playlistId} not found after removing video`);
        }
        return updatedPlaylist;
      } else {
        console.error('IPC bridge not available');
        throw new Error('IPC bridge not available');
      }
    } catch (error) {
      console.error(`Error removing video ${videoId} from playlist ${playlistId}:`, error);
      throw error;
    }
  },

  /**
   * Download a video from a playlist
   */
  async downloadVideo(
    playlistId: string, 
    videoId: string, 
    onProgress: (progress: number) => void
  ): Promise<string> {
    try {
      if (window.api && window.api.playlists) {
        // Register progress handler
        const progressHandler = (_event: any, progress: number) => {
          onProgress(progress);
        };
        
        window.api.receive(`download-progress-${videoId}`, progressHandler);
        
        // Start the download
        const filePath = await window.api.playlists.downloadVideo(playlistId, videoId);
        
        return filePath;
      } else {
        console.error('IPC bridge not available');
        throw new Error('IPC bridge not available');
      }
    } catch (error) {
      console.error(`Error downloading video ${videoId} from playlist ${playlistId}:`, error);
      throw error;
    }
  },
  
  /**
   * Download an entire playlist
   */
  async downloadPlaylist(
    playlistId: string, 
    onProgress: (completed: number, total: number) => void
  ): Promise<string[]> {
    try {
      if (window.api && window.api.playlists) {
        // Get the playlist to find out how many videos are in it
        const playlist = await window.api.playlists.getById(playlistId);
        if (!playlist) {
          throw new Error(`Playlist ${playlistId} not found`);
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
            
            const downloadPath = await window.api.playlists.downloadVideo(playlistId, video.id);
            downloadPaths.push(downloadPath);
            
            // Update progress after each video
            onProgress(i + 1, total);
          } catch (videoError) {
            console.error(`Error downloading video ${video.id}:`, videoError);
            // Continue with next video instead of failing the whole operation
          }
        }
        
        return downloadPaths;
      } else {
        console.error('IPC bridge not available');
        throw new Error('IPC bridge not available');
      }
    } catch (error) {
      console.error(`Error downloading playlist ${playlistId}:`, error);
      throw error;
    }
  }
}; 