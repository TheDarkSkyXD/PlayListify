/**
 * Types for the ytDlp service
 */

/**
 * Options for downloading a video
 */
export interface DownloadOptions {
  format?: string;
  quality?: string;
  downloadId?: string;
  onProgress?: (progress: number, speed?: string, eta?: string) => void;
}

/**
 * Video format information
 */
export interface VideoFormat {
  id: string;
  ext: string;
  resolution: string;
  fps: number;
  filesize: string;
  tbr: number;
  protocol: string;
  vcodec: string;
  acodec: string;
  isAudioOnly: boolean;
  isVideoOnly: boolean;
  height: number;
  line: string;
}

/**
 * Video information
 */
export interface VideoInfo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  channel?: string;
  maxQuality?: string; // Maximum available quality for this video (e.g., '1080p', '4K')
}

/**
 * Result of checking a video's status
 */
export interface VideoStatusResult {
  available: boolean;
  info?: VideoInfo;
  error?: string;
}

/**
 * Format analysis result
 */
export interface FormatAnalysisResult {
  availableFormats: VideoFormat[];
  hasHlsStreams: boolean;
  hasMergedFormats: boolean;
  maxAvailableHeight: number;
}
