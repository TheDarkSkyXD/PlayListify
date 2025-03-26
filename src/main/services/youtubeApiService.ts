import axios from 'axios';
import { getSetting } from './settingsManager';
import { rateLimiter } from './rateLimiter';
import { Playlist, Video } from '../../shared/types/appTypes';

// YouTube API base URL
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Interface definitions for YouTube API responses
interface YouTubeApiResponse<T> {
  kind: string;
  etag: string;
  items?: T[];
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
  nextPageToken?: string;
}

interface YouTubePlaylistItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    publishedAt: string;
  };
  contentDetails: {
    itemCount: number;
  };
}

interface YouTubePlaylistItemsListItem {
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
  };
  contentDetails: {
    videoId: string;
  };
}

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      standard?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    channelTitle: string;
    channelId: string;
    publishedAt: string;
  };
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount?: string;
    likeCount?: string;
    dislikeCount?: string;
    commentCount?: string;
  };
}

/**
 * Fetch data from YouTube API with rate limiting
 */
async function fetchFromYouTubeApi<T>(endpoint: string, params: Record<string, any>): Promise<YouTubeApiResponse<T>> {
  // Get API key from settings
  const apiKey = getSetting('youtubeApiKey');
  if (!apiKey) {
    throw new Error('YouTube API key not configured. Please set it in settings.');
  }

  // Use rate limiter to execute this API call
  return rateLimiter.execute('youtube-api', async () => {
    try {
      const response = await axios.get<YouTubeApiResponse<T>>(`${YOUTUBE_API_BASE}/${endpoint}`, {
        params: {
          ...params,
          key: apiKey
        }
      });
      
      return response.data;
    } catch (error: any) {
      // Handle API errors
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 403) {
          throw new Error(`YouTube API quota exceeded. Please try again later.`);
        } else if (status === 404) {
          throw new Error(`Resource not found: ${data.error?.message || 'Unknown error'}`);
        } else {
          throw new Error(`YouTube API error: ${data.error?.message || error.message}`);
        }
      }
      
      throw new Error(`Network error: ${error.message}`);
    }
  });
}

/**
 * Get YouTube playlist basic information
 */
export async function getPlaylistInfo(playlistId: string): Promise<{
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoCount: number;
}> {
  // Extract playlist ID from URL if a full URL was provided
  const extractedId = playlistId.includes('list=') 
    ? new URLSearchParams(playlistId.split('?')[1]).get('list') 
    : playlistId;

  if (!extractedId) {
    throw new Error('Invalid playlist URL or ID');
  }

  const data = await fetchFromYouTubeApi<YouTubePlaylistItem>('playlists', {
    part: 'snippet,contentDetails',
    id: extractedId
  });

  if (!data.items || data.items.length === 0) {
    throw new Error('Playlist not found or is private');
  }

  const playlist = data.items[0];
  
  return {
    id: playlist.id,
    title: playlist.snippet.title,
    description: playlist.snippet.description,
    thumbnailUrl: playlist.snippet.thumbnails.high?.url || playlist.snippet.thumbnails.default?.url || '',
    videoCount: playlist.contentDetails.itemCount
  };
}

/**
 * Get all videos in a YouTube playlist
 */
export async function getPlaylistVideos(playlistId: string): Promise<Video[]> {
  // Extract playlist ID from URL if a full URL was provided
  const extractedId = playlistId.includes('list=') 
    ? new URLSearchParams(playlistId.split('?')[1]).get('list') 
    : playlistId;

  if (!extractedId) {
    throw new Error('Invalid playlist URL or ID');
  }

  const videos: Video[] = [];
  let pageToken: string | undefined = undefined;
  const currentDate = new Date().toISOString();

  // Loop through all pages of results
  do {
    const data: YouTubeApiResponse<YouTubePlaylistItemsListItem> = await fetchFromYouTubeApi<YouTubePlaylistItemsListItem>('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId: extractedId,
      maxResults: 50,
      pageToken: pageToken
    });

    // Process videos
    if (data.items) {
      for (const item of data.items) {
        // Skip deleted or private videos
        if (item.snippet.title === 'Deleted video' || 
            item.snippet.title === 'Private video') {
          continue;
        }

        // Add video to the list
        videos.push({
          id: item.contentDetails.videoId,
          title: item.snippet.title,
          url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
          // Other fields will be populated with defaults
          downloaded: false,
          addedAt: currentDate,
          status: 'available'
        });
      }
    }

    // Get next page token for pagination
    pageToken = data.nextPageToken;
  } while (pageToken);

  return videos;
}

/**
 * Import a YouTube playlist using the API
 */
export async function importYoutubePlaylist(playlistId: string): Promise<{
  playlistInfo: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    videoCount: number;
  };
  videos: Video[];
}> {
  // Get playlist info
  const playlistInfo = await getPlaylistInfo(playlistId);
  
  // Get all videos
  const videos = await getPlaylistVideos(playlistId);
  
  return {
    playlistInfo,
    videos
  };
}

/**
 * Check if a YouTube video is available
 */
export async function checkVideoAvailability(videoId: string): Promise<boolean> {
  try {
    // Extract video ID from URL if a full URL was provided
    const extractedId = videoId.includes('watch?v=') 
      ? new URLSearchParams(videoId.split('?')[1]).get('v') 
      : videoId;

    if (!extractedId) {
      return false;
    }

    const data = await fetchFromYouTubeApi<YouTubeVideoItem>('videos', {
      part: 'status',
      id: extractedId
    });

    return !!(data.items && data.items.length > 0);
  } catch (error) {
    console.error('Error checking video availability:', error);
    return false;
  }
}

/**
 * Get detailed video information
 */
export async function getVideoDetails(videoId: string): Promise<{
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  viewCount: number;
  publishedAt: string;
  channelTitle: string;
  channelId: string;
} | null> {
  try {
    // Extract video ID from URL if a full URL was provided
    const extractedId = videoId.includes('watch?v=') 
      ? new URLSearchParams(videoId.split('?')[1]).get('v') 
      : videoId;

    if (!extractedId) {
      return null;
    }

    const data = await fetchFromYouTubeApi<YouTubeVideoItem>('videos', {
      part: 'snippet,contentDetails,statistics',
      id: extractedId
    });

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const video = data.items[0];
    
    // Parse duration from ISO 8601 format
    const duration = isoDurationToSeconds(video.contentDetails.duration);

    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url || '',
      duration,
      viewCount: parseInt(video.statistics.viewCount || '0', 10),
      publishedAt: video.snippet.publishedAt,
      channelTitle: video.snippet.channelTitle,
      channelId: video.snippet.channelId
    };
  } catch (error) {
    console.error('Error getting video details:', error);
    return null;
  }
}

/**
 * Convert ISO 8601 duration to seconds
 * @param isoDuration ISO 8601 duration string (e.g., "PT1H2M3S")
 * @returns Duration in seconds
 */
function isoDurationToSeconds(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) {
    return 0;
  }
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
} 