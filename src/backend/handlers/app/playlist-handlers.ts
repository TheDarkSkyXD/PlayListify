import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { playlistService, PlaylistSearchOptions, VideoSearchOptions } from '../services/playlistService';
import { youtubeService } from '../services/youtubeService';
import { CreatePlaylistInput } from '../shared/data-models';

export const registerPlaylistHandlers = (): void => {
  
  // Get all playlists
  ipcMain.handle('playlist:getAll', async (event: IpcMainInvokeEvent, options?: PlaylistSearchOptions) => {
    try {
      const playlists = await playlistService.getAllPlaylists(options);
      return { success: true, data: playlists };
    } catch (error) {
      console.error('Playlist getAll error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get playlist by ID
  ipcMain.handle('playlist:getById', async (event: IpcMainInvokeEvent, playlistId: number) => {
    try {
      const playlist = await playlistService.getPlaylistById(playlistId);
      if (!playlist) {
        return { success: false, error: 'Playlist not found' };
      }
      return { success: true, data: playlist };
    } catch (error) {
      console.error('Playlist getById error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Create a new playlist
  ipcMain.handle('playlist:create', async (event: IpcMainInvokeEvent, input: CreatePlaylistInput) => {
    try {
      const playlist = await playlistService.createPlaylist(input);
      return { success: true, data: playlist };
    } catch (error) {
      console.error('Playlist create error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Update a playlist
  ipcMain.handle('playlist:update', async (event: IpcMainInvokeEvent, playlistId: number, updates: { title?: string; description?: string }) => {
    try {
      const playlist = await playlistService.updatePlaylist(playlistId, updates);
      return { success: true, data: playlist };
    } catch (error) {
      console.error('Playlist update error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Delete a playlist
  ipcMain.handle('playlist:delete', async (event: IpcMainInvokeEvent, playlistId: number) => {
    try {
      await playlistService.deletePlaylist(playlistId);
      return { success: true };
    } catch (error) {
      console.error('Playlist delete error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Search videos in a playlist
  ipcMain.handle('playlist:searchVideos', async (event: IpcMainInvokeEvent, options: VideoSearchOptions) => {
    try {
      const videos = await playlistService.searchVideosInPlaylist(options);
      return { success: true, data: videos };
    } catch (error) {
      console.error('Playlist searchVideos error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Add video to playlist
  ipcMain.handle('playlist:addVideo', async (event: IpcMainInvokeEvent, playlistId: number, videoId: string) => {
    try {
      await playlistService.addVideoToPlaylist(playlistId, videoId);
      return { success: true };
    } catch (error) {
      console.error('Playlist addVideo error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Remove video from playlist
  ipcMain.handle('playlist:removeVideo', async (event: IpcMainInvokeEvent, playlistId: number, videoId: string) => {
    try {
      await playlistService.removeVideoFromPlaylist(playlistId, videoId);
      return { success: true };
    } catch (error) {
      console.error('Playlist removeVideo error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Reorder videos in playlist
  ipcMain.handle('playlist:reorderVideos', async (event: IpcMainInvokeEvent, playlistId: number, videoOrders: Array<{ videoId: string; newOrder: number }>) => {
    try {
      await playlistService.reorderVideos(playlistId, videoOrders);
      return { success: true };
    } catch (error) {
      console.error('Playlist reorderVideos error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get playlist statistics
  ipcMain.handle('playlist:getStats', async (event: IpcMainInvokeEvent, playlistId: number) => {
    try {
      const stats = await playlistService.getPlaylistStats(playlistId);
      return { success: true, data: stats };
    } catch (error) {
      console.error('Playlist getStats error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // YouTube-related handlers

  // Get YouTube playlist metadata
  ipcMain.handle('youtube:getPlaylistMetadata', async (event: IpcMainInvokeEvent, url: string) => {
    try {
      const metadata = await youtubeService.getPlaylistMetadata(url);
      return { success: true, data: metadata };
    } catch (error) {
      console.error('YouTube getPlaylistMetadata error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Import YouTube playlist
  ipcMain.handle('youtube:importPlaylist', async (event: IpcMainInvokeEvent, url: string) => {
    try {
      // First validate the URL
      if (!youtubeService.isValidPlaylistUrl(url)) {
        return { success: false, error: 'Invalid YouTube playlist URL' };
      }

      // Sanitize the URL
      const sanitizedUrl = youtubeService.sanitizeUrl(url);

      // Get playlist metadata
      const metadata = await youtubeService.getPlaylistMetadata(sanitizedUrl);

      // Create a new playlist record
      const playlist = await playlistService.createPlaylist({
        title: metadata.title,
        description: metadata.description,
        type: 'YOUTUBE',
      });

      // Get video details (this could be a background task in a real implementation)
      const videos = await youtubeService.getPlaylistVideos(sanitizedUrl, (progress, currentVideo) => {
        // Emit progress events to the renderer
        event.sender.send('youtube:importProgress', {
          playlistId: playlist.id,
          progress,
          currentVideo,
          status: 'IN_PROGRESS',
        });
      });

      // In a real implementation, we would save the videos to the database here
      // For now, we'll just log them
      console.log(`Imported ${videos.length} videos for playlist "${playlist.title}"`);

      // Emit completion event
      event.sender.send('youtube:importProgress', {
        playlistId: playlist.id,
        progress: 100,
        status: 'COMPLETED',
        totalVideos: videos.length,
      });

      return { success: true, data: { playlist, videoCount: videos.length } };
    } catch (error) {
      console.error('YouTube importPlaylist error:', error);
      
      // Emit error event
      event.sender.send('youtube:importProgress', {
        progress: 0,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Get video qualities
  ipcMain.handle('youtube:getVideoQualities', async (event: IpcMainInvokeEvent, videoId: string) => {
    try {
      const qualities = await youtubeService.getVideoQualities(videoId);
      return { success: true, data: qualities };
    } catch (error) {
      console.error('YouTube getVideoQualities error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Check yt-dlp availability
  ipcMain.handle('youtube:checkAvailability', async (event: IpcMainInvokeEvent) => {
    try {
      const status = await youtubeService.checkYtDlpAvailability();
      return { success: true, data: status };
    } catch (error) {
      console.error('YouTube checkAvailability error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Update yt-dlp
  ipcMain.handle('youtube:updateYtDlp', async (event: IpcMainInvokeEvent) => {
    try {
      const result = await youtubeService.updateYtDlp();
      return { success: true, data: result };
    } catch (error) {
      console.error('YouTube updateYtDlp error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Validate YouTube URL
  ipcMain.handle('youtube:validateUrl', async (event: IpcMainInvokeEvent, url: string) => {
    try {
      const isValid = youtubeService.isValidPlaylistUrl(url);
      const playlistId = isValid ? youtubeService.extractPlaylistId(url) : null;
      
      return { 
        success: true, 
        data: { 
          isValid, 
          playlistId,
          sanitizedUrl: isValid ? youtubeService.sanitizeUrl(url) : null
        } 
      };
    } catch (error) {
      console.error('YouTube validateUrl error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  console.log('Playlist IPC handlers registered');
};