import { Playlist } from '../../../shared/types/appTypes';

/**
 * Import operations for playlists
 */
export const importOperations = {
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
};
