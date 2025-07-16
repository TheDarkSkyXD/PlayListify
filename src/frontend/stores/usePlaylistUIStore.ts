// src/frontend/stores/usePlaylistUIStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORE_CONFIG } from './store-utils';

// Types
export type SortBy =
  | 'name'
  | 'created_at'
  | 'updated_at'
  | 'song_count'
  | 'duration';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';

export interface PlaylistFilters {
  search: string;
  tags: string[];
  isPrivate?: boolean;
  minSongCount?: number;
  maxSongCount?: number;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export interface SavedFilter {
  name: string;
  filters: PlaylistFilters;
  createdAt: string;
}

export interface PlaylistUIState {
  // Search and Filters
  filters: PlaylistFilters;
  searchHistory: string[];
  savedFilters: SavedFilter[];

  // Sorting
  sortBy: SortBy;
  sortOrder: SortOrder;

  // View Mode
  viewMode: ViewMode;

  // Pagination
  currentPage: number;
  itemsPerPage: number;

  // Selection State
  selectedPlaylists: string[];
  isSelectionMode: boolean;

  // UI State
  showFilterPanel: boolean;

  // Actions
  setSearch: (search: string) => void;
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;

  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setTags: (tags: string[]) => void;

  setPrivacyFilter: (isPrivate?: boolean) => void;
  setSongCountRange: (min?: number, max?: number) => void;
  setDateRange: (start?: string, end?: string) => void;

  setSorting: (sortBy: SortBy, sortOrder?: SortOrder) => void;
  setViewMode: (viewMode: ViewMode) => void;

  setCurrentPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;

  // Selection Actions
  togglePlaylistSelection: (id: string) => void;
  selectAllPlaylists: (ids: string[]) => void;
  clearSelection: () => void;
  setSelectionMode: (enabled: boolean) => void;

  toggleFilterPanel: () => void;

  clearFilters: () => void;
  hasActiveFilters: () => boolean;
  activeFilterCount: number;

  saveCurrentFilters: (name: string) => void;
  loadSavedFilters: (name: string) => void;
  deleteSavedFilters: (name: string) => void;
}

const initialFilters: PlaylistFilters = {
  search: '',
  tags: [],
  isPrivate: undefined,
  minSongCount: undefined,
  maxSongCount: undefined,
  dateRange: undefined,
};

export const usePlaylistUIStore = create<PlaylistUIState>()(
  persist(
    (set, get) => ({
      // Initial State
      filters: initialFilters,
      searchHistory: [],
      savedFilters: [],
      sortBy: 'updated_at',
      sortOrder: 'desc',
      viewMode: 'grid',
      currentPage: 1,
      itemsPerPage: 12,
      selectedPlaylists: [],
      isSelectionMode: false,
      showFilterPanel: false,
      activeFilterCount: 0,

      // Search Actions
      setSearch: (search: string) => {
        set(state => ({
          filters: { ...state.filters, search },
          currentPage: 1, // Reset to first page when searching
          activeFilterCount: calculateActiveFilterCount({
            ...state.filters,
            search,
          }),
        }));
      },

      addToSearchHistory: (query: string) => {
        set(state => {
          const trimmedQuery = query.trim();
          if (!trimmedQuery) return state;

          const newHistory = [
            trimmedQuery,
            ...state.searchHistory.filter(item => item !== trimmedQuery),
          ].slice(0, STORE_CONFIG.limits.maxSearchHistory);

          return { searchHistory: newHistory };
        });
      },

      clearSearchHistory: () => {
        set({ searchHistory: [] });
      },

      // Tag Actions
      addTag: (tag: string) => {
        set(state => {
          const trimmedTag = tag.trim().toLowerCase();
          if (!trimmedTag || state.filters.tags.includes(trimmedTag))
            return state;

          const newTags = [...state.filters.tags, trimmedTag];
          return {
            filters: { ...state.filters, tags: newTags },
            currentPage: 1,
            activeFilterCount: calculateActiveFilterCount({
              ...state.filters,
              tags: newTags,
            }),
          };
        });
      },

      removeTag: (tag: string) => {
        set(state => {
          const newTags = state.filters.tags.filter(t => t !== tag);
          return {
            filters: { ...state.filters, tags: newTags },
            currentPage: 1,
            activeFilterCount: calculateActiveFilterCount({
              ...state.filters,
              tags: newTags,
            }),
          };
        });
      },

      setTags: (tags: string[]) => {
        set(state => ({
          filters: { ...state.filters, tags },
          currentPage: 1,
          activeFilterCount: calculateActiveFilterCount({
            ...state.filters,
            tags,
          }),
        }));
      },

      // Filter Actions
      setPrivacyFilter: (isPrivate?: boolean) => {
        set(state => ({
          filters: { ...state.filters, isPrivate },
          currentPage: 1,
          activeFilterCount: calculateActiveFilterCount({
            ...state.filters,
            isPrivate,
          }),
        }));
      },

      setSongCountRange: (min?: number, max?: number) => {
        set(state => ({
          filters: {
            ...state.filters,
            minSongCount: min,
            maxSongCount: max,
          },
          currentPage: 1,
          activeFilterCount: calculateActiveFilterCount({
            ...state.filters,
            minSongCount: min,
            maxSongCount: max,
          }),
        }));
      },

      setDateRange: (start?: string, end?: string) => {
        set(state => ({
          filters: {
            ...state.filters,
            dateRange: start || end ? { start, end } : undefined,
          },
          currentPage: 1,
          activeFilterCount: calculateActiveFilterCount({
            ...state.filters,
            dateRange: start || end ? { start, end } : undefined,
          }),
        }));
      },

      // Sorting Actions
      setSorting: (sortBy: SortBy, sortOrder?: SortOrder) => {
        set(state => ({
          sortBy,
          sortOrder:
            sortOrder ||
            (state.sortBy === sortBy && state.sortOrder === 'asc'
              ? 'desc'
              : 'asc'),
          currentPage: 1,
        }));
      },

      // View Mode Actions
      setViewMode: (viewMode: ViewMode) => {
        set({ viewMode });
      },

      // Pagination Actions
      setCurrentPage: (page: number) => {
        set({ currentPage: Math.max(1, page) });
      },

      setItemsPerPage: (itemsPerPage: number) => {
        set({
          itemsPerPage: Math.max(1, itemsPerPage),
          currentPage: 1,
        });
      },

      // Selection Actions
      togglePlaylistSelection: (id: string) => {
        set(state => {
          const isSelected = state.selectedPlaylists.includes(id);
          const newSelection = isSelected
            ? state.selectedPlaylists.filter(playlistId => playlistId !== id)
            : [...state.selectedPlaylists, id];

          return {
            selectedPlaylists: newSelection,
            isSelectionMode: newSelection.length > 0,
          };
        });
      },

      selectAllPlaylists: (ids: string[]) => {
        set({
          selectedPlaylists: ids,
          isSelectionMode: ids.length > 0,
        });
      },

      clearSelection: () => {
        set({
          selectedPlaylists: [],
          isSelectionMode: false,
        });
      },

      setSelectionMode: (enabled: boolean) => {
        set(state => ({
          isSelectionMode: enabled,
          selectedPlaylists: enabled ? state.selectedPlaylists : [],
        }));
      },

      // UI Actions
      toggleFilterPanel: () => {
        set(state => ({ showFilterPanel: !state.showFilterPanel }));
      },

      // Filter Management
      clearFilters: () => {
        set({
          filters: initialFilters,
          currentPage: 1,
          activeFilterCount: 0,
        });
      },

      hasActiveFilters: () => {
        const { filters } = get();
        return calculateActiveFilterCount(filters) > 0;
      },

      saveCurrentFilters: (name: string) => {
        set(state => {
          const newSavedFilter: SavedFilter = {
            name: name.trim(),
            filters: { ...state.filters },
            createdAt: new Date().toISOString(),
          };

          const existingIndex = state.savedFilters.findIndex(
            f => f.name === name.trim(),
          );
          const newSavedFilters =
            existingIndex >= 0
              ? state.savedFilters.map((f, i) =>
                  i === existingIndex ? newSavedFilter : f,
                )
              : [...state.savedFilters, newSavedFilter];

          return { savedFilters: newSavedFilters };
        });
      },

      loadSavedFilters: (name: string) => {
        set(state => {
          const savedFilter = state.savedFilters.find(f => f.name === name);
          if (!savedFilter) return state;

          return {
            filters: { ...savedFilter.filters },
            currentPage: 1,
            activeFilterCount: calculateActiveFilterCount(savedFilter.filters),
          };
        });
      },

      deleteSavedFilters: (name: string) => {
        set(state => ({
          savedFilters: state.savedFilters.filter(f => f.name !== name),
        }));
      },
    }),
    {
      name: 'playlist-ui-store',
      version: STORE_CONFIG.persistence.version,
      partialize: state => ({
        filters: state.filters,
        searchHistory: state.searchHistory,
        savedFilters: state.savedFilters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        viewMode: state.viewMode,
        itemsPerPage: state.itemsPerPage,
      }),
    },
  ),
);

// Helper function to calculate active filter count
function calculateActiveFilterCount(filters: PlaylistFilters): number {
  let count = 0;

  if (filters.search.trim()) count++;
  if (filters.tags.length > 0) count += filters.tags.length;
  if (filters.isPrivate !== undefined) count++;
  if (filters.minSongCount !== undefined || filters.maxSongCount !== undefined)
    count++;
  if (filters.dateRange?.start || filters.dateRange?.end) count++;

  return count;
}

// Selector hooks for better performance
export const usePlaylistFilters = () =>
  usePlaylistUIStore(state => state.filters);
export const usePlaylistSorting = () =>
  usePlaylistUIStore(state => ({
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
  }));
export const usePlaylistViewMode = () =>
  usePlaylistUIStore(state => state.viewMode);
export const usePlaylistSelection = () =>
  usePlaylistUIStore(state => ({
    selectedPlaylists: state.selectedPlaylists,
    isSelectionMode: state.isSelectionMode,
  }));
