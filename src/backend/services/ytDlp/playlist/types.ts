import { Playlist, Video } from '../../../../shared/types/appTypes';

/**
 * Playlist info returned from YouTube
 */
export interface PlaylistInfo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoCount: number;
}

/**
 * YouTube video info from flat-playlist mode
 */
export interface YouTubeVideoInfo {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  playlist?: string;
  playlist_title?: string;
  playlist_id?: string;
  playlist_uploader?: string;
  uploader?: string;
  channel?: string;
  channel_id?: string;
  upload_date?: string;
  view_count?: number;
  like_count?: number;
  dislike_count?: number;
  comment_count?: number;
  tags?: string[];
  categories?: string[];
  webpage_url?: string;
  original_url?: string;
  extractor?: string;
  extractor_key?: string;
  format_id?: string;
  format?: string;
  format_note?: string;
  width?: number;
  height?: number;
  resolution?: string;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  abr?: number;
  filesize?: number;
  filesize_approx?: number;
  tbr?: number;
  protocol?: string;
  ext?: string;
  language?: string;
  language_preference?: number;
  preference?: number;
  dynamic_range?: string;
  container?: string;
  vbr?: number;
  asr?: number;
  audio_channels?: number;
}

/**
 * Progress callback for playlist import
 */
export type PlaylistProgressCallback = (
  status: string,
  count?: number,
  total?: number
) => void;
