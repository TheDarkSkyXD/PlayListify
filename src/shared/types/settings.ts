export type VideoQuality =
    | 'best'
    | '4320p' // 8K
    | '2160p' // 4K
    | '1440p' // 2K
    | '1080p'
    | '720p'
    | '480p'
    | '360p'
    | '240p'
    | '144p';

export type Theme = 'light' | 'dark';

export interface UserSettings {
  downloadLocation: string;
  maxConcurrentDownloads: number;
  defaultQuality: VideoQuality;
  theme: Theme;
  notifyOnDownloadComplete: boolean;
  autoStartDownloads: boolean;
  minimizeToTray: boolean;
  developerMode: boolean;
  downloadFormat?: 'mp4' | 'webm' | 'mp3' | 'opus' | 'flac' | 'wav' | 'best';
  // Add other settings as needed
} 