import { Playlist, Video, CreatePlaylistInput, PlaylistType } from '../shared/data-models';
export interface PlaylistWithVideoCount extends Playlist {
    videoCount: number;
    thumbnailUrl?: string;
}
export interface PlaylistWithVideos extends Playlist {
    videos: Video[];
    videoCount: number;
}
export interface PlaylistSearchOptions {
    query?: string;
    type?: PlaylistType;
    sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'videoCount';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}
export interface VideoSearchOptions {
    query?: string;
    playlistId: number;
    sortBy?: 'title' | 'uploadDate' | 'duration';
    sortOrder?: 'asc' | 'desc';
}
export declare class PlaylistService {
    /**
     * Get all playlists for the current user
     */
    getAllPlaylists(options?: PlaylistSearchOptions): Promise<PlaylistWithVideoCount[]>;
    /**
     * Get a specific playlist by ID with all its videos
     */
    getPlaylistById(playlistId: number): Promise<PlaylistWithVideos | null>;
    /**
     * Create a new custom playlist
     */
    createPlaylist(input: CreatePlaylistInput): Promise<Playlist>;
    /**
     * Update an existing playlist
     */
    updatePlaylist(playlistId: number, updates: Partial<Pick<Playlist, 'title' | 'description'>>): Promise<Playlist>;
    /**
     * Delete a playlist
     */
    deletePlaylist(playlistId: number): Promise<void>;
    /**
     * Search videos within a playlist
     */
    searchVideosInPlaylist(options: VideoSearchOptions): Promise<Video[]>;
    /**
     * Add a video to a playlist
     */
    addVideoToPlaylist(playlistId: number, videoId: string): Promise<void>;
    /**
     * Remove a video from a playlist
     */
    removeVideoFromPlaylist(playlistId: number, videoId: string): Promise<void>;
    /**
     * Reorder videos in a playlist
     */
    reorderVideos(playlistId: number, videoOrders: Array<{
        videoId: string;
        newOrder: number;
    }>): Promise<void>;
    /**
     * Get playlist statistics
     */
    getPlaylistStats(playlistId: number): Promise<{
        totalVideos: number;
        totalDuration: string;
        totalViews: number;
        lastUpdated: Date;
    }>;
    /**
     * Helper method to convert duration string (e.g., "3:33") to seconds
     */
    private durationToSeconds;
    /**
     * Helper method to convert seconds to duration string
     */
    private secondsToDuration;
}
export declare const playlistService: PlaylistService;
//# sourceMappingURL=playlistService.d.ts.map