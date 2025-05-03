import { useMutation, useQuery } from '@tanstack/react-query';
import { VideoFormat } from '../../backend/services/downloadService';

interface DownloadVideoOptions {
  videoId: string;
  formatId?: string;
  quality?: 'best' | 'worst' | '1080p' | '720p' | '480p' | '360p' | 'audio';
  downloadPath?: string;
  filename?: string;
  audioOnly?: boolean;
}

interface DownloadPlaylistOptions {
  playlistId: string;
  formatId?: string;
  quality?: 'best' | 'worst' | '1080p' | '720p' | '480p' | '360p' | 'audio';
  downloadPath?: string;
  audioOnly?: boolean;
}

// Hook to fetch available formats for a video
export const useVideoFormats = (videoId: string | null) => {
  return useQuery({
    queryKey: ['videoFormats', videoId],
    queryFn: async () => {
      if (!videoId) return [];
      const formats = await window.electron.ipcRenderer.invoke('download:get-formats', { videoId });
      return formats as VideoFormat[];
    },
    enabled: !!videoId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook to start a video download
export const useStartVideoDownload = () => {
  return useMutation({
    mutationFn: async (options: DownloadVideoOptions) => {
      return await window.electron.ipcRenderer.invoke('download:start-video', options);
    }
  });
};

// Hook to start a playlist download
export const useStartPlaylistDownload = () => {
  return useMutation({
    mutationFn: async (options: DownloadPlaylistOptions) => {
      return await window.electron.ipcRenderer.invoke('download:start-playlist', options);
    }
  });
};

// Hook to get the current download queue status
export const useDownloadQueueStatus = () => {
  return useQuery({
    queryKey: ['downloadQueueStatus'],
    queryFn: async () => {
      return await window.electron.ipcRenderer.invoke('download:get-queue-status');
    },
    refetchInterval: 1000, // Poll every second
  });
};

// Hook to cancel a download
export const useCancelDownload = () => {
  return useMutation({
    mutationFn: async (downloadId: string) => {
      return await window.electron.ipcRenderer.invoke('download:cancel', { downloadId });
    }
  });
};

// Hook to retry a failed download
export const useRetryDownload = () => {
  return useMutation({
    mutationFn: async (downloadId: string) => {
      return await window.electron.ipcRenderer.invoke('download:retry', { downloadId });
    }
  });
};

// Hook to clear completed/failed downloads
export const useClearDownloads = () => {
  return useMutation({
    mutationFn: async () => {
      return await window.electron.ipcRenderer.invoke('download:clear-completed');
    }
  });
}; 