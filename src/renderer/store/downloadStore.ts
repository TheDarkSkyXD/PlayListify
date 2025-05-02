import { create } from 'zustand';

export interface DownloadProgress {
  percent: number;
  totalSize?: string;
  downloadedBytes?: number;
  totalBytes?: number;
  speed?: string;
  eta?: string;
}

export interface DownloadItem {
  id: string;
  videoId: string;
  title: string;
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  filePath?: string;
  errorMessage?: string;
}

export interface QueueStatus {
  active: number;
  pending: number;
  completed: number;
  failed: number;
  activeDownloads: DownloadItem[];
}

interface DownloadState {
  // State
  downloads: Record<string, DownloadItem>;
  queueStatus: QueueStatus | null;
  selectedFormatId: string | null;
  isDownloadModalOpen: boolean;
  currentVideoId: string | null;
  
  // Actions
  setDownloadProgress: (id: string, progress: DownloadProgress) => void;
  setDownloadComplete: (id: string, status: DownloadItem['status'], filePath?: string, errorMessage?: string) => void;
  updateQueueStatus: (status: QueueStatus) => void;
  openDownloadModal: (videoId: string) => void;
  closeDownloadModal: () => void;
  setSelectedFormat: (formatId: string) => void;
  clearDownloads: () => void;
}

const useDownloadStore = create<DownloadState>((set) => ({
  // Initial state
  downloads: {},
  queueStatus: null,
  selectedFormatId: null,
  isDownloadModalOpen: false,
  currentVideoId: null,
  
  // Actions
  setDownloadProgress: (id, progress) => 
    set((state) => ({
      downloads: {
        ...state.downloads,
        [id]: {
          ...state.downloads[id],
          status: 'downloading' as const,
          progress: progress.percent,
        }
      }
    })),
  
  setDownloadComplete: (id, status, filePath, errorMessage) => 
    set((state) => {
      if (!state.downloads[id]) return state;
      
      return {
        downloads: {
          ...state.downloads,
          [id]: {
            ...state.downloads[id],
            status,
            progress: status === 'completed' ? 100 : state.downloads[id].progress,
            filePath,
            errorMessage
          }
        }
      };
    }),
  
  updateQueueStatus: (status) => 
    set(() => ({
      queueStatus: status
    })),
  
  openDownloadModal: (videoId) => 
    set(() => ({
      isDownloadModalOpen: true,
      currentVideoId: videoId,
      selectedFormatId: null
    })),
  
  closeDownloadModal: () => 
    set(() => ({
      isDownloadModalOpen: false,
      currentVideoId: null,
      selectedFormatId: null
    })),
  
  setSelectedFormat: (formatId) => 
    set(() => ({
      selectedFormatId: formatId
    })),
  
  clearDownloads: () => 
    set((state) => {
      // Only clear completed and failed downloads
      const newDownloads = { ...state.downloads };
      
      Object.keys(newDownloads).forEach(id => {
        if (['completed', 'failed', 'cancelled'].includes(newDownloads[id].status)) {
          delete newDownloads[id];
        }
      });
      
      return { downloads: newDownloads };
    })
}));

export default useDownloadStore; 