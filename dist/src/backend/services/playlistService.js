"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playlistService = exports.PlaylistService = void 0;
class PlaylistService {
    /**
     * Get all playlists for the current user
     */
    async getAllPlaylists(options = {}) {
        // This will be implemented with actual database calls
        // For now, return mock data for testing
        const mockPlaylists = [
            {
                id: 1,
                userId: 1,
                title: 'My Favorite Music',
                description: 'A collection of my favorite songs',
                type: 'CUSTOM',
                videoCount: 15,
                thumbnailUrl: 'https://i.ytimg.com/vi/example/maxresdefault.jpg',
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-20'),
                lastHealthCheck: new Date('2024-01-20'),
            },
            {
                id: 2,
                userId: 1,
                title: 'Learning JavaScript',
                description: 'Educational videos about JavaScript programming',
                type: 'YOUTUBE',
                videoCount: 8,
                thumbnailUrl: 'https://i.ytimg.com/vi/example2/maxresdefault.jpg',
                createdAt: new Date('2024-01-10'),
                updatedAt: new Date('2024-01-18'),
                lastHealthCheck: new Date('2024-01-18'),
            },
        ];
        // Apply filtering and sorting based on options
        let filteredPlaylists = mockPlaylists;
        if (options.query) {
            const query = options.query.toLowerCase();
            filteredPlaylists = filteredPlaylists.filter(playlist => playlist.title.toLowerCase().includes(query) ||
                playlist.description.toLowerCase().includes(query));
        }
        if (options.type) {
            filteredPlaylists = filteredPlaylists.filter(playlist => playlist.type === options.type);
        }
        // Apply sorting
        if (options.sortBy) {
            filteredPlaylists.sort((a, b) => {
                const aValue = a[options.sortBy];
                const bValue = b[options.sortBy];
                let comparison = 0;
                if (aValue < bValue)
                    comparison = -1;
                if (aValue > bValue)
                    comparison = 1;
                return options.sortOrder === 'desc' ? -comparison : comparison;
            });
        }
        // Apply pagination
        if (options.offset !== undefined || options.limit !== undefined) {
            const start = options.offset || 0;
            const end = options.limit ? start + options.limit : undefined;
            filteredPlaylists = filteredPlaylists.slice(start, end);
        }
        return filteredPlaylists;
    }
    /**
     * Get a specific playlist by ID with all its videos
     */
    async getPlaylistById(playlistId) {
        // Mock implementation - will be replaced with database calls
        if (playlistId === 1) {
            return {
                id: 1,
                userId: 1,
                title: 'My Favorite Music',
                description: 'A collection of my favorite songs',
                type: 'CUSTOM',
                videoCount: 2,
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-20'),
                lastHealthCheck: new Date('2024-01-20'),
                videos: [
                    {
                        id: 'dQw4w9WgXcQ',
                        title: 'Rick Astley - Never Gonna Give You Up',
                        channelName: 'RickAstleyVEVO',
                        duration: '3:33',
                        viewCount: 1000000000,
                        uploadDate: new Date('2009-10-25'),
                        thumbnailURL: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
                        availabilityStatus: 'PUBLIC',
                        createdAt: new Date('2024-01-15'),
                        updatedAt: new Date('2024-01-15'),
                    },
                    {
                        id: 'kJQP7kiw5Fk',
                        title: 'Despacito - Luis Fonsi ft. Daddy Yankee',
                        channelName: 'LuisFonsiVEVO',
                        duration: '4:42',
                        viewCount: 8000000000,
                        uploadDate: new Date('2017-01-12'),
                        thumbnailURL: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
                        availabilityStatus: 'PUBLIC',
                        createdAt: new Date('2024-01-15'),
                        updatedAt: new Date('2024-01-15'),
                    },
                ],
            };
        }
        return null;
    }
    /**
     * Create a new custom playlist
     */
    async createPlaylist(input) {
        // Validate input
        if (!input.title.trim()) {
            throw new Error('Playlist title cannot be empty');
        }
        if (input.title.length > 255) {
            throw new Error('Playlist title cannot exceed 255 characters');
        }
        if (input.description && input.description.length > 1000) {
            throw new Error('Playlist description cannot exceed 1000 characters');
        }
        // Check for duplicate title (mock implementation)
        const existingPlaylists = await this.getAllPlaylists();
        const titleExists = existingPlaylists.some(playlist => playlist.title.toLowerCase() === input.title.toLowerCase());
        if (titleExists) {
            throw new Error('A playlist with this title already exists.');
        }
        // Create new playlist (mock implementation)
        const newPlaylist = {
            id: Date.now(), // In real implementation, this would be generated by the database
            userId: 1, // In real implementation, this would come from the current user session
            title: input.title.trim(),
            description: input.description?.trim() || '',
            type: input.type,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastHealthCheck: new Date(),
        };
        // In real implementation, this would save to database
        console.log('Created new playlist:', newPlaylist);
        return newPlaylist;
    }
    /**
     * Update an existing playlist
     */
    async updatePlaylist(playlistId, updates) {
        // Validate input
        if (updates.title !== undefined) {
            if (!updates.title.trim()) {
                throw new Error('Playlist title cannot be empty');
            }
            if (updates.title.length > 255) {
                throw new Error('Playlist title cannot exceed 255 characters');
            }
        }
        if (updates.description !== undefined && updates.description.length > 1000) {
            throw new Error('Playlist description cannot exceed 1000 characters');
        }
        // Get existing playlist
        const existingPlaylist = await this.getPlaylistById(playlistId);
        if (!existingPlaylist) {
            throw new Error('Playlist not found');
        }
        // Check for duplicate title if title is being updated
        if (updates.title && updates.title.toLowerCase() !== existingPlaylist.title.toLowerCase()) {
            const existingPlaylists = await this.getAllPlaylists();
            const titleExists = existingPlaylists.some(playlist => playlist.id !== playlistId && playlist.title.toLowerCase() === updates.title.toLowerCase());
            if (titleExists) {
                throw new Error('A playlist with this title already exists.');
            }
        }
        // Update playlist (mock implementation)
        const updatedPlaylist = {
            ...existingPlaylist,
            title: updates.title?.trim() ?? existingPlaylist.title,
            description: updates.description?.trim() ?? existingPlaylist.description,
            updatedAt: new Date(),
        };
        // In real implementation, this would update in database
        console.log('Updated playlist:', updatedPlaylist);
        return updatedPlaylist;
    }
    /**
     * Delete a playlist
     */
    async deletePlaylist(playlistId) {
        // Get existing playlist to verify it exists
        const existingPlaylist = await this.getPlaylistById(playlistId);
        if (!existingPlaylist) {
            throw new Error('Playlist not found');
        }
        // In real implementation, this would:
        // 1. Delete all playlist-video relationships
        // 2. Delete the playlist record
        // 3. Optionally clean up orphaned videos if they're not in other playlists
        console.log('Deleted playlist:', playlistId);
    }
    /**
     * Search videos within a playlist
     */
    async searchVideosInPlaylist(options) {
        const playlist = await this.getPlaylistById(options.playlistId);
        if (!playlist) {
            return [];
        }
        let videos = playlist.videos;
        // Apply search filter
        if (options.query) {
            const query = options.query.toLowerCase();
            videos = videos.filter(video => video.title.toLowerCase().includes(query) ||
                video.channelName.toLowerCase().includes(query));
        }
        // Apply sorting
        if (options.sortBy) {
            videos.sort((a, b) => {
                let aValue;
                let bValue;
                // Handle different data types
                if (options.sortBy === 'title') {
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                }
                else if (options.sortBy === 'uploadDate') {
                    aValue = new Date(a.uploadDate).getTime();
                    bValue = new Date(b.uploadDate).getTime();
                }
                else if (options.sortBy === 'duration') {
                    // Convert duration string to seconds for sorting
                    aValue = this.durationToSeconds(a.duration);
                    bValue = this.durationToSeconds(b.duration);
                }
                else {
                    return 0; // No sorting for unknown properties
                }
                let comparison = 0;
                if (aValue < bValue)
                    comparison = -1;
                if (aValue > bValue)
                    comparison = 1;
                return options.sortOrder === 'desc' ? -comparison : comparison;
            });
        }
        return videos;
    }
    /**
     * Add a video to a playlist
     */
    async addVideoToPlaylist(playlistId, videoId) {
        // Verify playlist exists
        const playlist = await this.getPlaylistById(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        // Check if video is already in playlist
        const videoExists = playlist.videos.some(video => video.id === videoId);
        if (videoExists) {
            throw new Error('Video is already in this playlist');
        }
        // In real implementation, this would:
        // 1. Verify the video exists in the videos table
        // 2. Add a record to the playlist_videos table with the next order number
        console.log(`Added video ${videoId} to playlist ${playlistId}`);
    }
    /**
     * Remove a video from a playlist
     */
    async removeVideoFromPlaylist(playlistId, videoId) {
        // Verify playlist exists
        const playlist = await this.getPlaylistById(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        // Check if video is in playlist
        const videoExists = playlist.videos.some(video => video.id === videoId);
        if (!videoExists) {
            throw new Error('Video is not in this playlist');
        }
        // In real implementation, this would:
        // 1. Remove the record from playlist_videos table
        // 2. Update the order of remaining videos if necessary
        console.log(`Removed video ${videoId} from playlist ${playlistId}`);
    }
    /**
     * Reorder videos in a playlist
     */
    async reorderVideos(playlistId, videoOrders) {
        // Verify playlist exists
        const playlist = await this.getPlaylistById(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        // Validate that all videos exist in the playlist
        for (const { videoId } of videoOrders) {
            const videoExists = playlist.videos.some(video => video.id === videoId);
            if (!videoExists) {
                throw new Error(`Video ${videoId} is not in this playlist`);
            }
        }
        // In real implementation, this would update the order field in playlist_videos table
        console.log(`Reordered videos in playlist ${playlistId}:`, videoOrders);
    }
    /**
     * Get playlist statistics
     */
    async getPlaylistStats(playlistId) {
        const playlist = await this.getPlaylistById(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        const totalVideos = playlist.videos.length;
        const totalViews = playlist.videos.reduce((sum, video) => sum + video.viewCount, 0);
        const totalDurationSeconds = playlist.videos.reduce((sum, video) => sum + this.durationToSeconds(video.duration), 0);
        const totalDuration = this.secondsToDuration(totalDurationSeconds);
        return {
            totalVideos,
            totalDuration,
            totalViews,
            lastUpdated: playlist.updatedAt,
        };
    }
    /**
     * Helper method to convert duration string (e.g., "3:33") to seconds
     */
    durationToSeconds(duration) {
        const parts = duration.split(':').map(Number);
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1]; // MM:SS
        }
        else if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
        }
        return 0;
    }
    /**
     * Helper method to convert seconds to duration string
     */
    secondsToDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
}
exports.PlaylistService = PlaylistService;
// Export a singleton instance
exports.playlistService = new PlaylistService();
//# sourceMappingURL=playlistService.js.map