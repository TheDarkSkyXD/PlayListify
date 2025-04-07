import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DownloadItem, DownloadStatus } from '../../shared/types/appTypes';
import { STORAGE_KEYS } from '../../shared/constants/storageKeys';

interface DownloadState {
  // State
  downloads: DownloadItem[];
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  addDownload: (download: DownloadItem) => void;
  updateDownload: (id: string, updates: Partial<DownloadItem>) => void;
  removeDownload: (id: string) => void;
  clearCompleted: () => void;

  // Selectors
  getDownloadById: (id: string) => DownloadItem | undefined;
  getDownloadsByStatus: (status: DownloadStatus | DownloadStatus[]) => DownloadItem[];
  getDownloadsByPlaylist: (playlistId: string) => DownloadItem[];
  getQueueStats: () => {
    pending: number;
    downloading: number;
    paused: number;
    completed: number;
    failed: number;
    canceled: number;
    total: number;
  };
}

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      // Initial state
      downloads: [] as DownloadItem[],
      isInitialized: false,

      // Actions
      initialize: async () => {
        try {
          console.log('=== DOWNLOAD STORE INITIALIZE START ===');
          console.log('Initializing download store...');
          // Check if the downloads API is available
          const api = window.api as any; // Use type assertion to access the downloads API
          if (api && api.downloads && typeof api.downloads.getAll === 'function') {
            // Get all downloads from the backend
            console.log('Fetching downloads from backend...');
            console.log('Calling api.downloads.getAll()...');
            const downloads = await api.downloads.getAll();
            console.log('api.downloads.getAll() returned');

            // Log details about the downloads
            console.log('Type of downloads:', typeof downloads);
            console.log('Is array:', Array.isArray(downloads));

            // Only log details if we have downloads to reduce noise
            if (Array.isArray(downloads) && downloads.length > 0) {
              console.log(`Received ${downloads.length} downloads:`, downloads);
            } else {
              console.log('Received downloads: []');
            }

            // Set up listener for download updates if available
            // We'll use a static variable to track if we've already set up the listener
            // to avoid creating multiple listeners
            if (!window.downloadUpdateListenerSetup && typeof api.downloads.onDownloadUpdate === 'function') {
              console.log('Setting up download update listener...');
              window.downloadUpdateListenerSetup = true;

              api.downloads.onDownloadUpdate((download: DownloadItem) => {
                if (!download || !download.id) {
                  console.warn('Received invalid download update:', download);
                  return;
                }

                console.log(`Received download update: ${download.id}, status: ${download.status}, progress: ${download.progress}`);

                set(state => {
                  // Check if the download already exists in the array
                  const existingIndex = state.downloads.findIndex(d => d.id === download.id);

                  if (existingIndex >= 0) {
                    // Update existing download
                    console.log(`Updating existing download: ${download.id}, status: ${download.status}, progress: ${download.progress}`);
                    const updatedDownloads = [...state.downloads];
                    updatedDownloads[existingIndex] = download;
                    return { downloads: updatedDownloads };
                  } else {
                    // Add new download
                    console.log(`Adding new download to store: ${download.id}, status: ${download.status}`);
                    return { downloads: [...state.downloads, download] };
                  }
                });
              });
            } else if (window.downloadUpdateListenerSetup) {
              console.log('Download update listener already set up');
            } else {
              console.warn('Download update listener not available');
            }

            // Make sure downloads is an array
            const downloadsArray = Array.isArray(downloads) ? downloads : [];

            // Only retry if we're expecting downloads but didn't receive any
            // This reduces unnecessary logging when there are no downloads
            const currentDownloads = get().downloads;
            if (downloadsArray.length === 0 && currentDownloads.length > 0) {
              console.log('Expected downloads but received none, trying again in 1 second...');
              // Wait a second and try again
              setTimeout(async () => {
                try {
                  const retryDownloads = await api.downloads.getAll();
                  const retryDownloadsArray = Array.isArray(retryDownloads) ? retryDownloads : [];
                  if (retryDownloadsArray.length > 0) {
                    console.log(`Retry received ${retryDownloadsArray.length} downloads`);
                    set({ downloads: retryDownloadsArray });
                  } else {
                    console.log('Retry received no downloads');
                  }
                } catch (retryError) {
                  console.error('Failed to retry fetching downloads:', retryError);
                }
              }, 1000);
            }

            set({ downloads: downloadsArray, isInitialized: true });
            console.log(`Download store initialized with ${downloadsArray.length} downloads`);
            console.log('=== DOWNLOAD STORE INITIALIZE COMPLETE ===');
          } else {
            console.warn('Downloads API not available. Using empty downloads array.');
            set({ downloads: [], isInitialized: true });
            console.log('=== DOWNLOAD STORE INITIALIZE COMPLETE (NO API) ===');
          }
        } catch (error) {
          console.error('Failed to initialize download store:', error);
          set({ isInitialized: true });
          console.log('=== DOWNLOAD STORE INITIALIZE ERROR ===');
        }
      },

      addDownload: (download) => {
        set((state) => ({
          downloads: [...state.downloads, download]
        }));
      },

      updateDownload: (id, updates) => {
        console.log('Updating download:', id, updates);
        set((state) => {
          // Check if the download already exists in the array
          const existingIndex = state.downloads.findIndex(d => d.id === id);

          if (existingIndex >= 0) {
            // Update existing download
            console.log('Updating existing download:', id);
            const updatedDownloads = [...state.downloads];
            updatedDownloads[existingIndex] = {
              ...state.downloads[existingIndex],
              ...updates
            };
            return { downloads: updatedDownloads };
          } else {
            // Add new download if it's a complete download item
            if ('id' in updates && 'status' in updates) {
              console.log('Download not found in store, adding it:', id);
              return {
                downloads: [...state.downloads, updates as DownloadItem]
              };
            } else {
              console.warn('Cannot add incomplete download item:', updates);
              return state;
            }
          }
        });
      },

      removeDownload: (id) => {
        set((state) => ({
          downloads: state.downloads.filter((download) => download.id !== id)
        }));
      },

      clearCompleted: () => {
        set((state) => ({
          downloads: state.downloads.filter(
            (download) => download.status !== 'completed'
          )
        }));
      },

      // Selectors
      getDownloadById: (id) => {
        return get().downloads.find((download) => download.id === id);
      },

      getDownloadsByStatus: (status) => {
        const statuses = Array.isArray(status) ? status : [status];
        return get().downloads.filter((download) =>
          statuses.includes(download.status)
        );
      },

      getDownloadsByPlaylist: (playlistId) => {
        return get().downloads.filter(
          (download) => download.playlistId === playlistId
        );
      },

      getQueueStats: () => {
        // Make sure downloads is an array
        const downloadsArray = Array.isArray(get().downloads) ? get().downloads : [];

        // Filter out any invalid downloads
        const validDownloads = downloadsArray.filter(d => d && d.id && d.status);

        return {
          pending: validDownloads.filter((d) => d.status === 'pending').length,
          downloading: validDownloads.filter((d) => d.status === 'downloading').length,
          paused: validDownloads.filter((d) => d.status === 'paused').length,
          completed: validDownloads.filter((d) => d.status === 'completed').length,
          failed: validDownloads.filter((d) => d.status === 'failed').length,
          canceled: validDownloads.filter((d) => d.status === 'canceled').length,
          total: validDownloads.length
        };
      }
    }),
    {
      name: STORAGE_KEYS.DOWNLOADS,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ downloads: state.downloads }),
    }
  )
);

// Don't initialize the store when this module is imported
// This will be handled by the components that need it

export default useDownloadStore;
