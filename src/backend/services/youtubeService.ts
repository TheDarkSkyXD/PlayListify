import { exec } from 'child_process';
import { promisify } from 'util';
import { Video, Playlist, BackgroundTask } from '../shared/data-models';

const execAsync = promisify(exec);

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

export class YouTubeService {
  private ytDlpPath: string;

  constructor() {
    // In production, this should be the path to the bundled yt-dlp executable
    this.ytDlpPath = 'yt-dlp';
  }

  /**
   * Validate if a URL is a valid YouTube playlist URL
   */
  isValidPlaylistUrl(url: string): boolean {
    const playlistRegex = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/(playlist\?list=|watch\?.*list=)([a-zA-Z0-9_-]+)/;
    return playlistRegex.test(url);
  }

  /**
   * Extract playlist ID from YouTube URL
   */
  extractPlaylistId(url: string): string | null {
    const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  /**
   * Get metadata for a YouTube playlist without downloading videos
   */
  async getPlaylistMetadata(url: string): Promise<YouTubePlaylistMetadata> {
    if (!this.isValidPlaylistUrl(url)) {
      throw new Error('Invalid YouTube playlist URL');
    }

    try {
      const command = `${this.ytDlpPath} --dump-json --flat-playlist "${url}"`;
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`yt-dlp error: ${stderr}`);
      }

      // Parse the output - yt-dlp returns one JSON object per line
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('No playlist data found');
      }

      // The first line usually contains playlist metadata
      const firstEntry = JSON.parse(lines[0]);
      
      // Get additional playlist info with a separate command
      const playlistInfoCommand = `${this.ytDlpPath} --dump-json --playlist-items 0 "${url}"`;
      const { stdout: playlistStdout } = await execAsync(playlistInfoCommand, { 
        timeout: 15000,
        maxBuffer: 1024 * 1024 * 5
      });

      let playlistInfo: any = {};
      if (playlistStdout.trim()) {
        try {
          playlistInfo = JSON.parse(playlistStdout.trim().split('\n')[0]);
        } catch (e) {
          console.warn('Could not parse playlist info, using fallback data');
        }
      }

      const metadata: YouTubePlaylistMetadata = {
        id: this.extractPlaylistId(url) || firstEntry.playlist_id || '',
        title: playlistInfo.playlist_title || firstEntry.playlist_title || 'Unknown Playlist',
        description: playlistInfo.description || firstEntry.description || '',
        thumbnailUrl: this.getBestThumbnail(playlistInfo.thumbnails || firstEntry.thumbnails || []),
        videoCount: lines.length,
        uploader: playlistInfo.uploader || firstEntry.uploader || 'Unknown',
        uploaderUrl: playlistInfo.uploader_url || firstEntry.uploader_url || '',
        availability: playlistInfo.availability || firstEntry.availability || 'unknown',
      };

      return metadata;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Request timed out. The playlist might be too large or the connection is slow.');
        } else if (error.message.includes('Private video')) {
          throw new Error('This playlist contains private videos or is private itself.');
        } else if (error.message.includes('Video unavailable')) {
          throw new Error('This playlist is unavailable or has been deleted.');
        }
        throw new Error(`Failed to fetch playlist metadata: ${error.message}`);
      }
      throw new Error('An unexpected error occurred while fetching playlist metadata');
    }
  }

  /**
   * Get detailed metadata for videos in a playlist
   */
  async getPlaylistVideos(url: string, progressCallback?: (progress: number, currentVideo: string) => void): Promise<YouTubeVideoMetadata[]> {
    if (!this.isValidPlaylistUrl(url)) {
      throw new Error('Invalid YouTube playlist URL');
    }

    try {
      // First get the flat playlist to know how many videos we're dealing with
      const flatCommand = `${this.ytDlpPath} --dump-json --flat-playlist "${url}"`;
      const { stdout: flatStdout } = await execAsync(flatCommand, { 
        timeout: 30000,
        maxBuffer: 1024 * 1024 * 10
      });

      const flatEntries = flatStdout.trim().split('\n').filter(line => line.trim());
      const totalVideos = flatEntries.length;

      if (totalVideos === 0) {
        return [];
      }

      // Now get detailed info for each video
      const command = `${this.ytDlpPath} --dump-json "${url}"`;
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 60000 * Math.max(1, Math.ceil(totalVideos / 10)), // Dynamic timeout based on video count
        maxBuffer: 1024 * 1024 * 50 // 50MB buffer for large playlists
      });

      if (stderr && !stderr.includes('WARNING')) {
        console.warn('yt-dlp warnings:', stderr);
      }

      const lines = stdout.trim().split('\n').filter(line => line.trim());
      const videos: YouTubeVideoMetadata[] = [];

      for (let i = 0; i < lines.length; i++) {
        try {
          const videoData = JSON.parse(lines[i]);
          
          const video: YouTubeVideoMetadata = {
            id: videoData.id,
            title: videoData.title || 'Unknown Title',
            description: videoData.description || '',
            duration: this.formatDuration(videoData.duration || 0),
            durationSeconds: videoData.duration || 0,
            thumbnailUrl: this.getBestThumbnail(videoData.thumbnails || []),
            viewCount: videoData.view_count || 0,
            uploadDate: videoData.upload_date || new Date().toISOString().slice(0, 10).replace(/-/g, ''),
            uploader: videoData.uploader || 'Unknown',
            uploaderUrl: videoData.uploader_url || '',
            availability: videoData.availability || 'unknown',
            formats: (videoData.formats || []).map((format: any) => ({
              format_id: format.format_id,
              ext: format.ext,
              quality: format.quality || format.height ? `${format.height}p` : 'unknown',
              filesize: format.filesize,
            })),
          };

          videos.push(video);

          // Report progress
          if (progressCallback) {
            const progress = Math.round(((i + 1) / lines.length) * 100);
            progressCallback(progress, video.title);
          }
        } catch (parseError) {
          console.warn(`Failed to parse video data at index ${i}:`, parseError);
          // Continue processing other videos
        }
      }

      return videos;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('Request timed out. The playlist might be too large or contain many unavailable videos.');
        }
        throw new Error(`Failed to fetch playlist videos: ${error.message}`);
      }
      throw new Error('An unexpected error occurred while fetching playlist videos');
    }
  }

  /**
   * Get available video qualities for a specific video
   */
  async getVideoQualities(videoId: string): Promise<Array<{ quality: string; format: string; filesize?: number }>> {
    try {
      const command = `${this.ytDlpPath} --list-formats --dump-json "https://www.youtube.com/watch?v=${videoId}"`;
      const { stdout } = await execAsync(command, { timeout: 15000 });

      const videoData = JSON.parse(stdout.trim());
      const formats = videoData.formats || [];

      // Filter for video formats only (exclude audio-only)
      const videoFormats = formats
        .filter((format: any) => format.vcodec && format.vcodec !== 'none' && format.ext === 'mp4')
        .map((format: any) => ({
          quality: format.height ? `${format.height}p` : 'unknown',
          format: format.format_id,
          filesize: format.filesize,
        }))
        .sort((a: any, b: any) => {
          const aHeight = parseInt(a.quality) || 0;
          const bHeight = parseInt(b.quality) || 0;
          return bHeight - aHeight; // Sort by quality descending
        });

      return videoFormats;
    } catch (error) {
      console.error('Failed to get video qualities:', error);
      return [];
    }
  }

  /**
   * Check if yt-dlp is available and get version
   */
  async checkYtDlpAvailability(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      const { stdout } = await execAsync(`${this.ytDlpPath} --version`, { timeout: 5000 });
      return {
        available: true,
        version: stdout.trim(),
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update yt-dlp to the latest version
   */
  async updateYtDlp(): Promise<{ success: boolean; message: string }> {
    try {
      const { stdout, stderr } = await execAsync(`${this.ytDlpPath} --update`, { timeout: 60000 });
      return {
        success: true,
        message: stdout + stderr,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }

  /**
   * Helper method to get the best quality thumbnail from thumbnails array
   */
  private getBestThumbnail(thumbnails: any[]): string {
    if (!thumbnails || thumbnails.length === 0) {
      return '';
    }

    // Prefer maxresdefault, then hqdefault, then the largest available
    const preferred = thumbnails.find(t => t.id === 'maxresdefault') ||
                     thumbnails.find(t => t.id === 'hqdefault') ||
                     thumbnails.reduce((best, current) => 
                       (current.width || 0) > (best.width || 0) ? current : best
                     );

    return preferred?.url || thumbnails[0]?.url || '';
  }

  /**
   * Helper method to format duration from seconds to MM:SS or HH:MM:SS
   */
  private formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Helper method to validate and sanitize YouTube URLs
   */
  sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Ensure it's a YouTube URL
      if (!['youtube.com', 'www.youtube.com', 'youtu.be'].includes(urlObj.hostname)) {
        throw new Error('Not a YouTube URL');
      }

      // For playlist URLs, ensure we have the list parameter
      if (urlObj.pathname === '/playlist' || urlObj.searchParams.has('list')) {
        const listId = urlObj.searchParams.get('list');
        if (!listId) {
          throw new Error('Missing playlist ID');
        }
        return `https://www.youtube.com/playlist?list=${listId}`;
      }

      // For watch URLs with playlist, convert to playlist URL
      if (urlObj.pathname === '/watch' && urlObj.searchParams.has('list')) {
        const listId = urlObj.searchParams.get('list');
        return `https://www.youtube.com/playlist?list=${listId}`;
      }

      throw new Error('URL does not appear to be a playlist');
    } catch (error) {
      throw new Error(`Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export a singleton instance
export const youtubeService = new YouTubeService();