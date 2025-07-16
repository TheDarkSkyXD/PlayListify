// src/frontend/stores/usePlaylistUIStore.ts

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
export type ViewMode = 'grid' | 'list' | 'compact';
export type SortBy =
  | 'name'
  | 'created_at'
  | 'updated_at'
  | 'song_count'
  | 'duration';
export type SortOrder = 'asc' | 'desc';

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

export interface PlaylistSelection {
  selectedIds: Set<string>;
  lastSelectedId?: string;
  selectionMode: boolean;
}

export interface PlaylistUIState {
  // View preferences
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  itemsPerPage: number;
  showThumbnails: boolean;
  showMetadata: boolean;
  compactMode: boolean;

  // Filters and search
  filters: PlaylistFilters;
  activeFilterCount: number;
  searchHistory: string[];
  savedFilters: Array<{
    id: string;
    name: string;
    filters: PlaylistFilters;
    createdAt: string;
  }>;

  // Selection state
  selection: PlaylistSelection;

  // UI state
  sidebarCollapsed: boolean;
  showFilterPanel: boolean;
  showBulkActions: boolean;
  currentPage: number;
  scrollPosition: number;

  // Recently viewed
  recentlyViewed: Array<{
    id: string;
    name: string;
    viewedAt: string;
  }>;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSorting: (sortBy: SortBy, sortOrder?: SortOrder) => void;
  setItemsPerPage: (count: number) => void;
  toggleThumbnails: () => void;
  toggleMetadata: () => void;
  toggleCompactMode: () => void;

  // Filter actions
  setSearch: (search: string) => void;
  setTags: (tags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setPrivacyFilter: (isPrivate?: boolean) => void;
  setSongCountRange: (min?: number, max?: number) => void;
  setDateRange: (start?: string, end?: string) => void;
  clearFilters: () => void;
  saveCurrentFilters: (name: string) => void;
  loadSavedFilters: (id: string) => void;
  deleteSavedFilters: (id: string) => void;
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;

  // Selection actions
  selectPlaylist: (id: string, multiSelect?: boolean) => void;
  deselectPlaylist: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  toggleSelection: (id: string) => void;
  setSelectionMode: (enabled: boolean) => void;

  // UI actions
  toggleSidebar: () => void;
  toggleFilterPanel: () => void;
  setCurrentPage: (page: number) => void;
  setScrollPosition: (position: number) => void;
  addToRecentlyViewed: (playlist: { id: string; name: string }) => void;

  // Computed getters
  getActiveFilters: () => Partial<PlaylistFilters>;
  getSelectedCount: () => number;
  isSelected: (id: string) => boolean;
  hasActiveFilters: () => boolean;
}

// Default state
const defaultFilters: PlaylistFilters = {
  search: '',
  tags: [],
  isPrivate: undefined,
  minSongCount: undefined,
  maxSongCount: undefined,
  dateRange: undefined,
};

const defaultSelection: PlaylistSelection = {
  selectedIds: new Set(),
  lastSelectedId: undefined,
  selectionMode: false,
};

// Create the store
export const usePlaylistUIStore = create<PlaylistUIState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      viewMode: 'grid',
      sortBy: 'updated_at',
      sortOrder: 'desc',
      itemsPerPage: 20,
      showThumbnails: true,
      showMetadata: true,
      compactMode: false,

      filters: defaultFilters,
      activeFilterCount: 0,
      searchHistory: [],
      savedFilters: [],

      selection: defaultSelection,

      sidebarCollapsed: false,
      showFilterPanel: false,
      showBulkActions: false,
      currentPage: 1,
      scrollPosition: 0,

      recentlyViewed: [],

      // View preference actions
      setViewMode: mode =>
        set(state => {
          state.viewMode = mode;
        }),

      setSorting: (sortBy, sortOrder) =>
        set(state => {
          state.sortBy = sortBy;
          state.sortOrder =
            sortOrder ||
            (state.sortBy === sortBy && state.sortOrder === 'asc'
              ? 'desc'
              : 'asc');
          state.currentPage = 1; // Reset to first page when sorting changes
        }),

      setItemsPerPage: count =>
        set(state => {
          state.itemsPerPage = count;
          state.currentPage = 1; // Reset to first page
        }),

      toggleThumbnails: () =>
        set(state => {
          state.showThumbnails = !state.showThumbnails;
        }),

      toggleMetadata: () =>
        set(state => {
          state.showMetadata = !state.showMetadata;
        }),

      toggleCompactMode: () =>
        set(state => {
          state.compactMode = !state.compactMode;
        }),

      // Filter actions
      setSearch: search =>
        set(state => {
          state.filters.search = search;
          state.currentPage = 1;
          state.activeFilterCount = calculateActiveFilterCount(state.filters);
        }),

      setTags: tags =>
        set(state => {
          state.filters.tags = tags;
          state.currentPage = 1;
          state.activeFilterCount = calculateActiveFilterCount(state.filters);
        }),

      addTag: tag =>
        set(state => {
          if (!state.filters.tags.includes(tag)) {
            state.filters.tags.push(tag);
            state.currentPage = 1;
            state.activeFilterCount = calculateActiveFilterCount(state.filters);
          }
        }),

      removeTag: tag =>
        set(state => {
          state.filters.tags = state.filters.tags.filter(t => t !== tag);
          state.currentPage = 1;
          state.activeFilterCount = calculateActiveFilterCount(state.filters);
        }),

      setPrivacyFilter: isPrivate =>
        set(state => {
          state.filters.isPrivate = isPrivate;
          state.currentPage = 1;
          state.activeFilterCount = calculateActiveFilterCount(state.filters);
        }),

      setSongCountRange: (min, max) =>
        set(state => {
          state.filters.minSongCount = min;
          state.filters.maxSongCount = max;
          state.currentPage = 1;
          state.activeFilterCount = calculateActiveFilterCount(state.filters);
        }),

      setDateRange: (start, end) =>
        set(state => {
          state.filters.dateRange = start || end ? { start, end } : undefined;
          state.currentPage = 1;
          state.activeFilterCount = calculateActiveFilterCount(state.filters);
        }),

      clearFilters: () =>
        set(state => {
          state.filters = { ...defaultFilters };
          state.currentPage = 1;
          state.activeFilterCount = 0;
        }),

      saveCurrentFilters: name =>
        set(state => {
          const id = `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          state.savedFilters.push({
            id,
            name,
            filters: { ...state.filters },
            createdAt: new Date().toISOString(),
          });
        }),

      loadSavedFilters: id =>
        set(state => {
          const savedFilter = state.savedFilters.find(f => f.id === id);
          if (savedFilter) {
            state.filters = { ...savedFilter.filters };
            state.currentPage = 1;
            state.activeFilterCount = calculateActiveFilterCount(state.filters);
          }
        }),

      deleteSavedFilters: id =>
        set(state => {
          state.savedFilters = state.savedFilters.filter(f => f.id !== id);
        }),

      addToSearchHistory: query =>
        set(state => {
          if (query.trim() && !state.searchHistory.includes(query)) {
            state.searchHistory.unshift(query);
            // Keep only last 10 searches
            state.searchHistory = state.searchHistory.slice(0, 10);
          }
        }),

      clearSearchHistory: () =>
        set(state => {
          state.searchHistory = [];
        }),

      // Selection actions
      selectPlaylist: (id, multiSelect = false) =>
        set(state => {
          if (!multiSelect) {
            state.selection.selectedIds.clear();
          }
          state.selection.selectedIds.add(id);
          state.selection.lastSelectedId = id;
          state.showBulkActions = state.selection.selectedIds.size > 0;
        }),

      deselectPlaylist: id =>
        set(state => {
          state.selection.selectedIds.delete(id);
          if (state.selection.lastSelectedId === id) {
            state.selection.lastSelectedId = undefined;
          }
          state.showBulkActions = state.selection.selectedIds.size > 0;
        }),

      selectAll: ids =>
        set(state => {
          state.selection.selectedIds = new Set(ids);
          state.showBulkActions = state.selection.selectedIds.size > 0;
        }),

      deselectAll: () =>
        set(state => {
          state.selection.selectedIds.clear();
          state.selection.lastSelectedId = undefined;
          state.showBulkActions = false;
        }),

      toggleSelection: id =>
        set(state => {
          if (state.selection.selectedIds.has(id)) {
            state.selection.selectedIds.delete(id);
            if (state.selection.lastSelectedId === id) {
              state.selection.lastSelectedId = undefined;
            }
          } else {
            state.selection.selectedIds.add(id);
            state.selection.lastSelectedId = id;
          }
          state.showBulkActions = state.selection.selectedIds.size > 0;
        }),

      setSelectionMode: enabled =>
        set(state => {
          state.selection.selectionMode = enabled;
          if (!enabled) {
            state.selection.selectedIds.clear();
            state.selection.lastSelectedId = undefined;
            state.showBulkActions = false;
          }
        }),

      // UI actions
      toggleSidebar: () =>
        set(state => {
          state.sidebarCollapsed = !state.sidebarCollapsed;
        }),

      toggleFilterPanel: () =>
        set(state => {
          state.showFilterPanel = !state.showFilterPanel;
        }),

      setCurrentPage: page =>
        set(state => {
          state.currentPage = page;
        }),

      setScrollPosition: position =>
        set(state => {
          state.scrollPosition = position;
        }),

      addToRecentlyViewed: playlist =>
        set(state => {
          // Remove if already exists
          state.recentlyViewed = state.recentlyViewed.filter(
            p => p.id !== playlist.id,
          );

          // Add to beginning
          state.recentlyViewed.unshift({
            ...playlist,
            viewedAt: new Date().toISOString(),
          });

          // Keep only last 20
          state.recentlyViewed = state.recentlyViewed.slice(0, 20);
        }),

      // Computed getters
      getActiveFilters: () => {
        const state = get();
        const activeFilters: Partial<PlaylistFilters> = {};

        if (state.filters.search) activeFilters.search = state.filters.search;
        if (state.filters.tags.length > 0)
          activeFilters.tags = state.filters.tags;
        if (state.filters.isPrivate !== undefined)
          activeFilters.isPrivate = state.filters.isPrivate;
        if (state.filters.minSongCount !== undefined)
          activeFilters.minSongCount = state.filters.minSongCount;
        if (state.filters.maxSongCount !== undefined)
          activeFilters.maxSongCount = state.filters.maxSongCount;
        if (state.filters.dateRange)
          activeFilters.dateRange = state.filters.dateRange;

        return activeFilters;
      },

      getSelectedCount: () => {
        const state = get();
        return state.selection.selectedIds.size;
      },

      isSelected: id => {
        const state = get();
        return state.selection.selectedIds.has(id);
      },

      hasActiveFilters: () => {
        const state = get();
        return state.activeFilterCount > 0;
      },
    })),
    {
      name: 'playlist-ui-store',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        // Persist only UI preferences, not temporary state
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        itemsPerPage: state.itemsPerPage,
        showThumbnails: state.showThumbnails,
        showMetadata: state.showMetadata,
        compactMode: state.compactMode,
        sidebarCollapsed: state.sidebarCollapsed,
        searchHistory: state.searchHistory,
        savedFilters: state.savedFilters,
        recentlyViewed: state.recentlyViewed,
      }),
    },
  ),
);

// Helper function to calculate active filter count
function calculateActiveFilterCount(filters: PlaylistFilters): number {
  let count = 0;

  if (filters.search) count++;
  if (filters.tags.length > 0) count++;
  if (filters.isPrivate !== undefined) count++;
  if (filters.minSongCount !== undefined || filters.maxSongCount !== undefined)
    count++;
  if (filters.dateRange) count++;

  return count;
}

// Selector hooks for better performance
export const usePlaylistViewMode = () =>
  usePlaylistUIStore(state => state.viewMode);
export const usePlaylistSorting = () =>
  usePlaylistUIStore(state => ({
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
  }));
export const usePlaylistFilters = () =>
  usePlaylistUIStore(state => state.filters);
export const usePlaylistSelection = () =>
  usePlaylistUIStore(state => state.selection);
export const usePlaylistUIPreferences = () =>
  usePlaylistUIStore(state => ({
    showThumbnails: state.showThumbnails,
    showMetadata: state.showMetadata,
    compactMode: state.compactMode,
    itemsPerPage: state.itemsPerPage,
  }));
