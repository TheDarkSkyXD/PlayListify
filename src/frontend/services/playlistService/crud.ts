import { Playlist } from '../../../shared/types/appTypes';

/**
 * CRUD operations for playlists
 */
export const crudOperations = {
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

        return updatedPlaylist as unknown as Playlist;
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
};
