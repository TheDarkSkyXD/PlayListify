import { Playlist, Video } from '../../../shared/types/appTypes';

/**
 * Video operations for playlists
 */
export const videoOperations = {
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

        return filePath as unknown as string;
      } else {
        console.error('IPC bridge not available');
        throw new Error('IPC bridge not available');
      }
    } catch (error) {
      console.error(`Error downloading video ${videoId} from playlist ${playlistId}:`, error);
      throw error;
    }
  },
};
