import { Video } from './video'; // Assuming Video might have some base fields

export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled';

export interface DownloadQueueItem {
  id: string; // Unique ID for the download item (e.g., videoId or a UUID)
  url: string; // Video URL to download
  title: string;
  thumbnailUrl?: string;
  playlistId?: string; // Optional: if part of a playlist download
  outputPath: string;   // Full path where the file will be saved
  
  status: DownloadStatus;
  progress: number; // 0-100
  speed?: string; // e.g., "1.5MiB/s"
  eta?: string; // e.g., "00:05:30"
  totalSize?: string; // e.g., "100MiB"
  downloadedBytes?: number;
  error?: string; // Error message if status is 'error'

  // Potentially other fields from yt-dlp metadata or app specific
  duration?: number; // Video duration in seconds
  addedAt: string; // ISO date string when item was added to queue
  startedAt?: string; // ISO date string
  completedAt?: string; // ISO date string
  
  // Fields for specific requested format/quality, if different from general settings
  requestedFormat?: string;
  requestedQuality?: string;
}

// Details needed to add an item to the download queue
export interface DownloadAddItemDetails extends Pick<Video, 'id' | 'url' | 'title' | 'thumbnail' | 'duration'> {
  playlistId?: string; // Optional: if the video belongs to a playlist being downloaded
  outputPath: string;   // Pre-determined full path where the file will be saved
  // Optional: if specific format/quality is requested for this item, overriding global settings
  requestedFormat?: string; 
  requestedQuality?: string;
  // Any other necessary preliminary info before it becomes a full DownloadQueueItem
} 