import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import playlistService from '../services/playlistService';
import youtubePlaylistService from '../services/youtubePlaylistService';
import logger from '../services/logService';
import { Playlist } from '../database/playlistQueries';

// Register playlist-related IPC handlers
export const registerPlaylistHandlers = () => {
  // Create a custom playlist
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_CREATE, async (_, { name, description }: { name: string; description?: string }) => {
    logger.debug(`Creating custom playlist: ${name}`);
    try {
      const playlistId = await playlistService.createCustomPlaylist(name, description);
      return { success: true, playlistId };
    } catch (error) {
      logger.error('Failed to create custom playlist:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });

  // Get YouTube playlist info (before import)
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_GET_YOUTUBE_INFO, async (_, { url }: { url: string }) => {
    logger.debug(`Fetching YouTube playlist info: ${url}`);
    try {
      const playlistInfo = await youtubePlaylistService.getYouTubePlaylistInfo(url);
      return { 
        success: true, 
        playlistInfo: {
          id: playlistInfo.id,
          title: playlistInfo.title,
          description: playlistInfo.description,
          thumbnailUrl: playlistInfo.thumbnailUrl,
          channelTitle: playlistInfo.channelTitle,
          videoCount: playlistInfo.videoCount
        }
      };
    } catch (error) {
      logger.error('Failed to fetch YouTube playlist info:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });

  // Import a YouTube playlist
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_IMPORT, async (_, { url }: { url: string }) => {
    logger.debug(`Importing YouTube playlist: ${url}`);
    try {
      const playlistId = await playlistService.importYouTubePlaylist(url);
      return { success: true, playlistId };
    } catch (error) {
      logger.error('Failed to import YouTube playlist:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });

  // Get all playlists
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_GET_ALL, async () => {
    logger.debug('Getting all playlists');
    try {
      const playlists = await playlistService.getAllPlaylistsService();
      return { success: true, playlists };
    } catch (error) {
      logger.error('Failed to get all playlists:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });

  // Get playlist details
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_GET, async (_, { playlistId }: { playlistId: number }) => {
    logger.debug(`Getting playlist details: ${playlistId}`);
    try {
      const details = await playlistService.getPlaylistDetails(playlistId);
      return { success: true, details };
    } catch (error) {
      logger.error(`Failed to get playlist details for ID ${playlistId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });

  // Update playlist
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_UPDATE, async (_, { playlistId, updates }: { playlistId: number; updates: Partial<Playlist> }) => {
    logger.debug(`Updating playlist: ${playlistId}`);
    try {
      const success = await playlistService.updatePlaylistInfo(playlistId, updates);
      return { success };
    } catch (error) {
      logger.error(`Failed to update playlist ID ${playlistId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });

  // Delete playlist
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_DELETE, async (_, { playlistId }: { playlistId: number }) => {
    logger.debug(`Deleting playlist: ${playlistId}`);
    try {
      const success = await playlistService.deletePlaylistService(playlistId);
      return { success };
    } catch (error) {
      logger.error(`Failed to delete playlist ID ${playlistId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });

  // Refresh YouTube playlist
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_REFRESH, async (_, { playlistId }: { playlistId: number }) => {
    logger.debug(`Refreshing playlist: ${playlistId}`);
    try {
      const success = await playlistService.refreshPlaylist(playlistId);
      return { success };
    } catch (error) {
      logger.error(`Failed to refresh playlist ID ${playlistId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });

  // Export playlist to JSON
  ipcMain.handle(IPC_CHANNELS.PLAYLIST_EXPORT, async (_, { playlistId }: { playlistId: number }) => {
    logger.debug(`Exporting playlist: ${playlistId}`);
    try {
      const jsonData = await playlistService.exportPlaylistToJson(playlistId);
      return { success: true, jsonData };
    } catch (error) {
      logger.error(`Failed to export playlist ID ${playlistId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });

  // Add video to playlist
  ipcMain.handle(IPC_CHANNELS.VIDEO_ADD, async (_, { playlistId, videoData }: { playlistId: number; videoData: { video_id: string; title: string; duration_seconds?: number; thumbnail?: string; author?: string } }) => {
    logger.debug(`Adding video to playlist: ${playlistId}`);
    try {
      const playlistVideoId = await playlistService.addVideoToPlaylistService(playlistId, videoData);
      return { success: true, playlistVideoId };
    } catch (error) {
      logger.error(`Failed to add video to playlist ID ${playlistId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });

  // Remove video from playlist
  ipcMain.handle(IPC_CHANNELS.VIDEO_REMOVE, async (_, { playlistId, videoId }: { playlistId: number; videoId: number }) => {
    logger.debug(`Removing video ID ${videoId} from playlist ID ${playlistId}`);
    try {
      const success = await playlistService.removeVideoFromPlaylistService(playlistId, videoId);
      return { success };
    } catch (error) {
      logger.error(`Failed to remove video ID ${videoId} from playlist ID ${playlistId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });

  // Update video position in playlist
  ipcMain.handle(IPC_CHANNELS.VIDEO_UPDATE_POSITION, async (_, { playlistId, videoId, newPosition }: { playlistId: number; videoId: number; newPosition: number }) => {
    logger.debug(`Updating position of video ID ${videoId} in playlist ID ${playlistId} to ${newPosition}`);
    try {
      const success = await playlistService.updateVideoPositionService(playlistId, videoId, newPosition);
      return { success };
    } catch (error) {
      logger.error(`Failed to update position of video ID ${videoId} in playlist ID ${playlistId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });
}; 