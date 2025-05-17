export interface Video {
  id: string;
  url: string;
  title: string;
  channel?: string; // From schema.sql (e.g. channel ID)
  duration?: number;
  thumbnail_url?: string; // Main thumbnail URL, now snake_case
  description?: string;
  channel_title?: string; // From yt-dlp, often same as channel or uploader (display name)
  upload_date?: string; // YYYY-MM-DD format after parsing, or YYYYMMDD from yt-dlp
  
  // Fields specific to playlist context (optional here, required in PlaylistVideo)
  added_to_playlist_at?: string; // ISO date string, when added to a specific playlist
  position_in_playlist?: number; // Position within a specific playlist

  // Fields from schema.sql for local state management & general video info
  is_available?: boolean;
  is_downloaded?: boolean;
  local_file_path?: string | null;
  download_status?: string | null; 
  download_progress?: number | null; 
  last_watched_at?: string | null; 
  watch_progress?: number | null; 
  added_at?: string; // ISO date string, when first added to the system (videos table)
  channel_id?: string; // Added from schema
  uploader_id?: string; // Added from schema
}

// Represents a video specifically within the context of a playlist
export interface PlaylistVideo extends Video {
  position: number; // Renamed from position_in_playlist for clarity in this context
  added_to_playlist_at: string; // Non-optional in this context
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
  thumbnail_url?: string;
  duration?: number; // seconds
  channel_name?: string;
  upload_date?: string; // MM-DD-YYYY MMDDYYYY
}


export interface VideoPreviewData {
  id: string;
  title: string;
  thumbnail_url: string;
  channel_name: string;
  channel_url?: string;
  duration?: number; // in seconds
  upload_date?: string; // MMDDYYYY from yt-dlp, or formatted as MM-DD-YYYY
  view_count?: number;
  like_count?: number;
  description?: string;
  webpage_url: string;
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