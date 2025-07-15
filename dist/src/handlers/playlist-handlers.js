"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlaylistHandlers = void 0;
const electron_1 = require("electron");
const playlistService_1 = require("../services/playlistService");
const youtubeService_1 = require("../services/youtubeService");
const registerPlaylistHandlers = () => {
    // Get all playlists
    electron_1.ipcMain.handle('playlist:getAll', async (event, options) => {
        try {
            const playlists = await playlistService_1.playlistService.getAllPlaylists(options);
            return { success: true, data: playlists };
        }
        catch (error) {
            console.error('Playlist getAll error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Get playlist by ID
    electron_1.ipcMain.handle('playlist:getById', async (event, playlistId) => {
        try {
            const playlist = await playlistService_1.playlistService.getPlaylistById(playlistId);
            if (!playlist) {
                return { success: false, error: 'Playlist not found' };
            }
            return { success: true, data: playlist };
        }
        catch (error) {
            console.error('Playlist getById error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Create a new playlist
    electron_1.ipcMain.handle('playlist:create', async (event, input) => {
        try {
            const playlist = await playlistService_1.playlistService.createPlaylist(input);
            return { success: true, data: playlist };
        }
        catch (error) {
            console.error('Playlist create error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Update a playlist
    electron_1.ipcMain.handle('playlist:update', async (event, playlistId, updates) => {
        try {
            const playlist = await playlistService_1.playlistService.updatePlaylist(playlistId, updates);
            return { success: true, data: playlist };
        }
        catch (error) {
            console.error('Playlist update error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Delete a playlist
    electron_1.ipcMain.handle('playlist:delete', async (event, playlistId) => {
        try {
            await playlistService_1.playlistService.deletePlaylist(playlistId);
            return { success: true };
        }
        catch (error) {
            console.error('Playlist delete error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Search videos in a playlist
    electron_1.ipcMain.handle('playlist:searchVideos', async (event, options) => {
        try {
            const videos = await playlistService_1.playlistService.searchVideosInPlaylist(options);
            return { success: true, data: videos };
        }
        catch (error) {
            console.error('Playlist searchVideos error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Add video to playlist
    electron_1.ipcMain.handle('playlist:addVideo', async (event, playlistId, videoId) => {
        try {
            await playlistService_1.playlistService.addVideoToPlaylist(playlistId, videoId);
            return { success: true };
        }
        catch (error) {
            console.error('Playlist addVideo error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Remove video from playlist
    electron_1.ipcMain.handle('playlist:removeVideo', async (event, playlistId, videoId) => {
        try {
            await playlistService_1.playlistService.removeVideoFromPlaylist(playlistId, videoId);
            return { success: true };
        }
        catch (error) {
            console.error('Playlist removeVideo error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Reorder videos in playlist
    electron_1.ipcMain.handle('playlist:reorderVideos', async (event, playlistId, videoOrders) => {
        try {
            await playlistService_1.playlistService.reorderVideos(playlistId, videoOrders);
            return { success: true };
        }
        catch (error) {
            console.error('Playlist reorderVideos error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Get playlist statistics
    electron_1.ipcMain.handle('playlist:getStats', async (event, playlistId) => {
        try {
            const stats = await playlistService_1.playlistService.getPlaylistStats(playlistId);
            return { success: true, data: stats };
        }
        catch (error) {
            console.error('Playlist getStats error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // YouTube-related handlers
    // Get YouTube playlist metadata
    electron_1.ipcMain.handle('youtube:getPlaylistMetadata', async (event, url) => {
        try {
            const metadata = await youtubeService_1.youtubeService.getPlaylistMetadata(url);
            return { success: true, data: metadata };
        }
        catch (error) {
            console.error('YouTube getPlaylistMetadata error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Import YouTube playlist
    electron_1.ipcMain.handle('youtube:importPlaylist', async (event, url) => {
        try {
            // First validate the URL
            if (!youtubeService_1.youtubeService.isValidPlaylistUrl(url)) {
                return { success: false, error: 'Invalid YouTube playlist URL' };
            }
            // Sanitize the URL
            const sanitizedUrl = youtubeService_1.youtubeService.sanitizeUrl(url);
            // Get playlist metadata
            const metadata = await youtubeService_1.youtubeService.getPlaylistMetadata(sanitizedUrl);
            // Create a new playlist record
            const playlist = await playlistService_1.playlistService.createPlaylist({
                title: metadata.title,
                description: metadata.description,
                type: 'YOUTUBE',
            });
            // Get video details (this could be a background task in a real implementation)
            const videos = await youtubeService_1.youtubeService.getPlaylistVideos(sanitizedUrl, (progress, currentVideo) => {
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
        }
        catch (error) {
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
    electron_1.ipcMain.handle('youtube:getVideoQualities', async (event, videoId) => {
        try {
            const qualities = await youtubeService_1.youtubeService.getVideoQualities(videoId);
            return { success: true, data: qualities };
        }
        catch (error) {
            console.error('YouTube getVideoQualities error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Check yt-dlp availability
    electron_1.ipcMain.handle('youtube:checkAvailability', async (event) => {
        try {
            const status = await youtubeService_1.youtubeService.checkYtDlpAvailability();
            return { success: true, data: status };
        }
        catch (error) {
            console.error('YouTube checkAvailability error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Update yt-dlp
    electron_1.ipcMain.handle('youtube:updateYtDlp', async (event) => {
        try {
            const result = await youtubeService_1.youtubeService.updateYtDlp();
            return { success: true, data: result };
        }
        catch (error) {
            console.error('YouTube updateYtDlp error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    // Validate YouTube URL
    electron_1.ipcMain.handle('youtube:validateUrl', async (event, url) => {
        try {
            const isValid = youtubeService_1.youtubeService.isValidPlaylistUrl(url);
            const playlistId = isValid ? youtubeService_1.youtubeService.extractPlaylistId(url) : null;
            return {
                success: true,
                data: {
                    isValid,
                    playlistId,
                    sanitizedUrl: isValid ? youtubeService_1.youtubeService.sanitizeUrl(url) : null
                }
            };
        }
        catch (error) {
            console.error('YouTube validateUrl error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });
    console.log('Playlist IPC handlers registered');
};
exports.registerPlaylistHandlers = registerPlaylistHandlers;
//# sourceMappingURL=playlist-handlers.js.map