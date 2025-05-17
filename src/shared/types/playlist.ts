import { Video, PlaylistVideo, VideoAddDetails } from './video'; // Import canonical types

export interface Playlist {
  id: string; // Or use name if names are unique identifiers
  name: string;
  description?: string;
  videos: Video[]; // Uses imported Video type
  thumbnail?: string; // URL or path to a representative thumbnail
  source_url?: string; // Original URL if imported from YouTube, etc.
  source: 'custom' | 'youtube'; // Added to distinguish playlist origin
  item_count: number;            // Added to store the number of videos
  youtube_playlist_id?: string; // Optional: Store the original YouTube Playlist ID
  // Add other playlist-specific properties
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  total_duration_seconds?: number; // Total duration of all videos in seconds
}

// Payload for creating a new custom playlist from UI
export interface CreatePlaylistPayload {
  name: string;
  description?: string;
  // source will be 'custom' by default, youtube_playlist_id will be null
}

// Payload for importing a YouTube playlist
export interface ImportYouTubePlaylistPayload {
  youtubePlaylistUrl: string;
  customName?: string; // Added for passing fetched title as a suggestion
  // name, description, source, youtube_playlist_id will be derived from the URL fetch
}

// Represents a video entry in a playlist preview
export interface PlaylistEntryPreview {
  id?: string; // yt-dlp often provides id for entries
  title?: string;
  duration?: number; // in seconds
  thumbnail?: string; // URL for the video's thumbnail - This can be a fallback or primary if simple
  thumbnails?: Array<{ url: string; height?: number; width?: number; [key: string]: any; }>; // For multiple thumbnail options from yt-dlp
  // Add other relevant fields from yt-dlp entry if needed
}

// New interface for the playlist preview data
export interface PlaylistPreviewData {
  id: string;
  title: string;
  thumbnailUrl?: string; // For the playlist's main thumbnail (remains camelCase as per previous specific fixes for this DTO)
  videoCount: number; // Made non-optional, will be accurate from n_entries
  total_duration_seconds?: number; // Ensuring this is snake_case
  uploader?: string;
  webpage_url?: string; // To link back to YouTube
  // entries?: PlaylistEntryPreview[]; // Commented out: not provided by flat preview
  // previewEntry?: PlaylistEntryPreview; // Commented out: not provided by flat preview
  isDurationApproximate?: boolean; // Added to indicate if totalDurationSeconds is missing/approximate
  // privacy?: 'public' | 'unlisted' | 'private' | 'unknown'; // Still TBD if easily available
}

// New type for playlist creation details via IPC
export interface PlaylistCreationDetails {
  name: string;
  description?: string;
  source: 'custom' | 'youtube'; // 'custom' for new empty, 'youtube' for import by ID
  youtube_playlist_id?: string;   // if source is 'youtube' and importing by ID
  source_url?: string;           // if source is 'youtube' and importing by playlist URL
  thumbnail?: string;           // Added for playlist thumbnail
  // isPrivate?: boolean;          // Removed
}

export interface UpdatePlaylistPayload {
  id: string;
  name?: string;
  description?: string;
  thumbnail?: string;           // Added for playlist thumbnail
  // Potentially add other fields like 'isPrivate' in the future
}

export interface AddVideoByUrlPayload {
  playlistId: string;
  videoUrl: string;
}

export interface AddVideoToCustomPlaylistPayload {
  playlistId: string;
  videoUrl: string; // The URL of the video to fetch and add
} 