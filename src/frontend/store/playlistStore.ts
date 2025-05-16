import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  DEFAULT_PLAYLIST_VIEW_MODE,
  DEFAULT_GLOBAL_PLAYLIST_SORT_ORDER,
  DEFAULT_CURRENT_PLAYLIST_SORT_ORDER
} from '../../shared/constants/appConstants';

// Define the state structure
interface PlaylistSortOrder {
  field: 'name' | 'createdAt' | 'updatedAt' | 'videoCount'; // Add more as needed
  direction: 'asc' | 'desc';
}

interface PlaylistState {
  activePlaylistId: string | null;
  playlistViewMode: 'grid' | 'list';
  selectedVideoIds: string[]; // For batch operations within a playlist view
  currentPlaylistSearchTerm: string; // Search term specific to the current playlist view
  globalPlaylistSearchTerm: string; // Search term for the main playlist list (e.g., MyPlaylistsPage)
  currentPlaylistSortOrder: PlaylistSortOrder;
  globalPlaylistSortOrder: PlaylistSortOrder;
  lastInteractedPlaylistId: string | null; // For "resume where you left off" or similar features
  // Example for video status tracking if not handled elsewhere or needs client-side override
  // videoPlaybackStatus: Record<string, { progress?: number; lastPlayedAt?: string }>;
}

// Define the actions
interface PlaylistActions {
  setActivePlaylistId: (id: string | null) => void;
  setPlaylistViewMode: (mode: 'grid' | 'list') => void;
  toggleVideoSelection: (playlistId: string, videoId: string) => void; // Context of playlist might be needed
  clearVideoSelections: (playlistId: string) => void;
  setVideoSelections: (playlistId: string, videoIds: string[]) => void;
  setCurrentPlaylistSearchTerm: (term: string) => void;
  setGlobalPlaylistSearchTerm: (term: string) => void;
  setCurrentPlaylistSortOrder: (sortOrder: PlaylistSortOrder) => void;
  setGlobalPlaylistSortOrder: (sortOrder: PlaylistSortOrder) => void;
  setLastInteractedPlaylistId: (id: string | null) => void;
  // setVideoPlaybackProgress: (videoId: string, progress: number) => void;
}

// Create the store with persistence for UI preferences
export const usePlaylistStore = create<PlaylistState & PlaylistActions>()(
  persist(
    (set, get) => ({
      // Initial state - using constants
      activePlaylistId: null,
      playlistViewMode: DEFAULT_PLAYLIST_VIEW_MODE,
      selectedVideoIds: [], 
      currentPlaylistSearchTerm: '',
      globalPlaylistSearchTerm: '',
      currentPlaylistSortOrder: DEFAULT_CURRENT_PLAYLIST_SORT_ORDER,
      globalPlaylistSortOrder: DEFAULT_GLOBAL_PLAYLIST_SORT_ORDER,
      lastInteractedPlaylistId: null,
      // videoPlaybackStatus: {},

      // Actions
      setActivePlaylistId: (id) => set({ activePlaylistId: id }),
      setPlaylistViewMode: (mode) => set({ playlistViewMode: mode }),
      
      // Simplified selectedVideoIds for now - assumes selection is global or context is handled by component
      // For per-playlist selection, state structure and actions would need to be more complex
      // e.g., selectedVideoIds: Record<string, string[]>
      // and actions would take playlistId
      toggleVideoSelection: (_playlistId, videoId) => set((state) => ({
        selectedVideoIds: state.selectedVideoIds.includes(videoId)
          ? state.selectedVideoIds.filter((id) => id !== videoId)
          : [...state.selectedVideoIds, videoId],
      })),
      clearVideoSelections: (_playlistId) => set({ selectedVideoIds: [] }),
      setVideoSelections: (_playlistId, videoIds) => set({ selectedVideoIds: videoIds}),

      setCurrentPlaylistSearchTerm: (term) => set({ currentPlaylistSearchTerm: term }),
      setGlobalPlaylistSearchTerm: (term) => set({ globalPlaylistSearchTerm: term }),
      setCurrentPlaylistSortOrder: (sortOrder) => set({ currentPlaylistSortOrder: sortOrder }),
      setGlobalPlaylistSortOrder: (sortOrder) => set({ globalPlaylistSortOrder: sortOrder }),
      setLastInteractedPlaylistId: (id) => set({ lastInteractedPlaylistId: id }),
      
      // setVideoPlaybackProgress: (videoId, progress) => set((state) => ({
      //   videoPlaybackStatus: {
      //     ...state.videoPlaybackStatus,
      //     [videoId]: { ...state.videoPlaybackStatus[videoId], progress, lastPlayedAt: new Date().toISOString() },
      //   },
      // })), 
    }),
    {
      name: 'playlist-ui-preferences', // Name for localStorage key
      storage: createJSONStorage(() => localStorage), // Specify localStorage
      // Only persist UI-specific settings, not transient states like activePlaylistId or selectedVideoIds
      partialize: (state) => ({
        playlistViewMode: state.playlistViewMode,
        globalPlaylistSearchTerm: state.globalPlaylistSearchTerm, // Persist global search
        // currentPlaylistSearchTerm is probably too specific to persist globally
        globalPlaylistSortOrder: state.globalPlaylistSortOrder, // Persist global sort
        // currentPlaylistSortOrder is also too specific
        lastInteractedPlaylistId: state.lastInteractedPlaylistId, // Useful for resume
        // videoPlaybackStatus: state.videoPlaybackStatus, // If we implement and want to persist this
      }),
    }
  )
);

// Example usage in a component:
// const { activePlaylistId, setActivePlaylistId } = usePlaylistStore();
// const playlistViewMode = usePlaylistStore((state) => state.playlistViewMode); 