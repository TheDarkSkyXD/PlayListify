export interface YtDlpThumbnail {
  url: string;
  height?: number;
  width?: number;
  resolution?: string;
  id?: string;
  preference?: number;
}

export interface YtDlpVideoInfoRaw {
  id: string;
  title: string;
  url?: string; // This is often the direct media URL, not webpage_url
  webpage_url?: string;
  original_url?: string;
  thumbnail?: string; // URL of a thumbnail
  thumbnails?: YtDlpThumbnail[]; // Array of available thumbnails
  description?: string;
  duration?: number; // Duration in seconds
  uploader?: string; // Channel name
  uploader_id?: string; // Channel ID
  uploader_url?: string; // Channel URL
  channel?: string; // Alias for uploader
  channel_id?: string; // Alias for uploader_id
  channel_url?: string; // Alias for uploader_url
  channelName?: string; // Preferred field for channel display name
  timestamp?: number; // Unix timestamp of upload_date
  upload_date?: string; // YYYYMMDD format
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  age_limit?: number;
  is_live?: boolean;
  playlist_index?: number; // Index in the playlist (1-based)
  playlist_id?: string;
  playlist_title?: string;
  playlist_uploader?: string;
  playlist_uploader_id?: string;
  // yt-dlp can output many more fields, add as needed
  [key: string]: any; // Allow other properties
}

// Represents the direct output of yt-dlp --dump-single-json --flat-playlist
export interface YtDlpFlatPlaylistInfo {
  id: string;
  title: string;
  uploader?: string;
  channel?: string;
  webpage_url?: string;
  thumbnail?: string; // Playlist-level thumbnail
  thumbnails?: YtDlpThumbnail[];
  n_entries?: number; // Key for total item count
  playlist_count?: number; // Fallback for item count
  description?: string;
  tags?: string[];
  availability?: string;
  // Add other relevant top-level playlist fields from yt-dlp's flat output
  [key: string]: any;
}

// This type would represent the structure if --dump-single-json was used on a playlist
// WITHOUT --flat-playlist (i.e., one large JSON object for the whole playlist).
// Let's rename YtDlpPlaylistMetadataRaw to YtDlpFullPlaylistRawData for clarity
export interface YtDlpFullPlaylistRawData {
  id: string; // Playlist ID
  title: string; // Playlist title
  webpage_url?: string;
  description?: string;
  uploader?: string;
  uploader_id?: string;
  uploader_url?: string;
  channel?: string;
  channel_id?: string;
  channel_url?: string;
  availability?: string;
  modified_date?: string; // YYYYMMDD
  view_count?: number;
  playlist_count?: number; // Number of videos in the playlist
  entries: YtDlpVideoInfoRaw[]; // Array of video metadata objects
  thumbnails?: YtDlpThumbnail[];
  thumbnail?: string;
  // Allow other properties
  [key: string]: any;
} 

// Unified result type that getPlaylistMetadata will return
export interface ProcessedPlaylistMetadata {
  id: string;
  title: string;
  uploader?: string;
  webpage_url?: string;
  thumbnail?: string; // Determined thumbnail (playlist or first video from full fetch)
  entries: YtDlpVideoInfoRaw[]; // Empty for flat preview, filled for full fetch
  itemCount: number;
  totalDuration?: number; // In seconds, undefined if not calculated (flat preview)
  isDurationApproximate: boolean;
  description?: string;
  tags?: string[];
  availability?: string;
  channel?: string;
  channelId?: string;
  channel_url?: string;
  uploaderId?: string;
  uploader_url?: string;
}

// YtDlpPlaylistMetadata is no longer an alias for YtDlpVideoInfoRaw directly,
// as getPlaylistMetadata returns a more structured ProcessedPlaylistMetadata.
// However, individual entries within ProcessedPlaylistMetadata.entries are YtDlpVideoInfoRaw.
// For clarity, if YtDlpPlaylistMetadata was used elsewhere to refer to the output of getPlaylistMetadata,
// those usages might need to be updated to ProcessedPlaylistMetadata.
// For now, we remove the old alias for YtDlpPlaylistMetadata.
// export type YtDlpPlaylistMetadata = YtDlpVideoInfoRaw; 