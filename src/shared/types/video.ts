export interface Video {
  id: string;
  url: string;
  title: string;
  channel?: string; // From schema.sql (e.g. channel ID)
  duration?: number;
  thumbnail?: string; // Main thumbnail URL (was thumbnailUrl in schema)
  description?: string;
  channelTitle?: string; // From yt-dlp, often same as channel or uploader (display name)
  uploadDate?: string; // YYYY-MM-DD format after parsing, or YYYYMMDD from yt-dlp
  
  // Fields specific to playlist context (optional here, required in PlaylistVideo)
  addedToPlaylistAt?: string; // ISO date string, when added to a specific playlist
  positionInPlaylist?: number; // Position within a specific playlist

  // Fields from schema.sql for local state management & general video info
  isAvailable?: boolean;
  isDownloaded?: boolean;
  localFilePath?: string | null;
  downloadStatus?: string | null; 
  downloadProgress?: number | null; 
  lastWatchedAt?: string | null; 
  watchProgress?: number | null; 
  addedAt?: string; // ISO date string, when first added to the system (videos table)
  channelId?: string; // Added from schema
  uploaderId?: string; // Added from schema
}

// Represents a video specifically within the context of a playlist
export interface PlaylistVideo extends Video {
  position: number; // Renamed from positionInPlaylist for clarity in this context
  addedToPlaylistAt: string; // Non-optional in this context
}


// Raw data structure from yt-dlp --dump-json
// Add fields as needed based on what you extract
// This is a partial representation. Add more fields as you use them.
// export interface YtDlpVideoInfoRaw {
//   id: string;
//   title: string;
//   webpage_url?: string;
//   thumbnail?: string; // URL of the default thumbnail
//   thumbnails?: YtDlpThumbnail[]; // Array of available thumbnails
//   duration?: number; // in seconds
//   description?: string;
//   uploader?: string; // Channel name (often)
//   uploader_id?: string;
//   uploader_url?: string;
//   channel?: string; // Another field for channel name
//   channel_id?: string;
//   channel_url?: string;
//   upload_date?: string; // YYYYMMDD format
//   view_count?: number;
//   like_count?: number;
//   comment_count?: number;
//   age_limit?: number;
//   is_live?: boolean;
//   format?: string; // Description of the best format (e.g., "22 - 720p (mp4)")
//   formats?: YtDlpFormat[]; // Array of available formats
//   // ... and many more fields from yt-dlp
// }

// export interface YtDlpThumbnail {
//   id: string; // e.g., '0', '1', '2', '3' or 'sddefault', 'mqdefault', 'hqdefault', 'maxresdefault'
//   url: string;
//   preference?: number;
//   width?: number;
//   height?: number;
//   resolution?: string;
// }

// export interface YtDlpFormat {
//   format_id?: string;
//   url?: string;
//   ext?: string;
//   acodec?: string;
//   vcodec?: string;
//   width?: number;
//   height?: number;
//   // ... and more format fields
// }


// Used when adding a video to a playlist, primarily for custom playlists
export interface VideoAddDetails {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number; // seconds
  channelName?: string;
  uploadDate?: string; // MM-DD-YYYY MMDDYYYY
}


export interface VideoPreviewData {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  channelUrl?: string;
  duration?: number; // in seconds
  uploadDate?: string; // MMDDYYYY from yt-dlp, or formatted as MM-DD-YYYY
  viewCount?: number;
  likeCount?: number;
  description?: string;
  webpageUrl: string;
}

// Raw structure from yt-dlp --dump-json for a single video (subset of fields)
// This should be expanded based on the actual fields yt-dlp provides and we need.
export interface YtDlpSingleVideoInfoRaw {
  id: string;
  title: string;
  thumbnail?: string; // Direct thumbnail URL (often low res)
  thumbnails?: Array<{
    url: string;
    height?: number;
    width?: number;
    resolution?: string;
    id?: string;
  }>; // Array of available thumbnails
  description?: string;
  uploader?: string; // Channel name
  uploader_id?: string;
  uploader_url?: string; // Channel URL
  channel?: string; // Sometimes used instead of uploader
  channel_id?: string;
  channel_url?: string;
  duration?: number; // Duration in seconds
  upload_date?: string; // YYYYMMDD
  view_count?: number;
  like_count?: number;
  webpage_url: string;
  original_url?: string; // URL provided by user
  formats?: Array<any>; // We might parse this for best thumbnail or other info
  // Add other fields as needed from yt-dlp output
} 