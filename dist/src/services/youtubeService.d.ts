export interface YouTubePlaylistMetadata {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    videoCount: number;
    uploader: string;
    uploaderUrl: string;
    availability: string;
}
export interface YouTubeVideoMetadata {
    id: string;
    title: string;
    description: string;
    duration: string;
    durationSeconds: number;
    thumbnailUrl: string;
    viewCount: number;
    uploadDate: string;
    uploader: string;
    uploaderUrl: string;
    availability: string;
    formats: Array<{
        format_id: string;
        ext: string;
        quality: string;
        filesize?: number;
    }>;
}
export interface ImportProgress {
    taskId: number;
    status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    progress: number;
    currentVideo?: string;
    totalVideos?: number;
    processedVideos?: number;
    errors?: string[];
}
export declare class YouTubeService {
    private ytDlpPath;
    constructor();
    /**
     * Validate if a URL is a valid YouTube playlist URL
     */
    isValidPlaylistUrl(url: string): boolean;
    /**
     * Extract playlist ID from YouTube URL
     */
    extractPlaylistId(url: string): string | null;
    /**
     * Get metadata for a YouTube playlist without downloading videos
     */
    getPlaylistMetadata(url: string): Promise<YouTubePlaylistMetadata>;
    /**
     * Get detailed metadata for videos in a playlist
     */
    getPlaylistVideos(url: string, progressCallback?: (progress: number, currentVideo: string) => void): Promise<YouTubeVideoMetadata[]>;
    /**
     * Get available video qualities for a specific video
     */
    getVideoQualities(videoId: string): Promise<Array<{
        quality: string;
        format: string;
        filesize?: number;
    }>>;
    /**
     * Check if yt-dlp is available and get version
     */
    checkYtDlpAvailability(): Promise<{
        available: boolean;
        version?: string;
        error?: string;
    }>;
    /**
     * Update yt-dlp to the latest version
     */
    updateYtDlp(): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Helper method to get the best quality thumbnail from thumbnails array
     */
    private getBestThumbnail;
    /**
     * Helper method to format duration from seconds to MM:SS or HH:MM:SS
     */
    private formatDuration;
    /**
     * Helper method to validate and sanitize YouTube URLs
     */
    sanitizeUrl(url: string): string;
}
export declare const youtubeService: YouTubeService;
//# sourceMappingURL=youtubeService.d.ts.map