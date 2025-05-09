export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number; // in seconds
  description?: string;
  // Add other video-specific properties as needed
  downloadPath?: string; // Local path if downloaded
  downloadedFormat?: string;
  actualDownloadedQuality?: string;
}

export interface Playlist {
  id: string; // Or use name if names are unique identifiers
  name: string;
  description?: string;
  videos: Video[];
  thumbnail?: string; // URL or path to a representative thumbnail
  sourceUrl?: string; // Original URL if imported from YouTube, etc.
  isYoutubePlaylist?: boolean;
  // Add other playlist-specific properties
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
} 