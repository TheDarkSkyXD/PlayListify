// Types for import progress tracking
export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  downloaded: boolean;
  addedAt: string;
  status: 'available' | 'downloading' | 'downloaded' | 'error';
}

export interface ImportResult {
  videos: Video[];
}

export interface ImportJob {
  id: string;
  url: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  progress: number;
  totalVideos?: number;
  name?: string;
  error?: string;
  _notified?: boolean; // Flag to track if notification was sent
  _statusText?: string; // Custom status text to display in the UI
  _phase?: 'initializing' | 'processing' | 'completing'; // Track the current phase of the import process
  skippedVideos?: number; // Track number of skipped videos
  completedVideos?: number; // Track number of successfully added videos
  youtubeTitle?: string; // Store the original YouTube title
}
