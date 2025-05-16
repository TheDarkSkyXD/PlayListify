// src/shared/constants/appConstants.ts

// Define the sort order structure, identical to the one in playlistStore.ts
// Consider moving this to a shared types file if used in more places than just store and constants.
interface PlaylistSortOrder {
  field: 'name' | 'createdAt' | 'updatedAt' | 'videoCount';
  direction: 'asc' | 'desc';
}

export const DEFAULT_PLAYLIST_VIEW_MODE: 'grid' | 'list' = 'grid';

export const DEFAULT_GLOBAL_PLAYLIST_SORT_ORDER: PlaylistSortOrder = {
  field: 'createdAt',
  direction: 'desc',
};

export const DEFAULT_CURRENT_PLAYLIST_SORT_ORDER: PlaylistSortOrder = {
  field: 'name',       // Default sort for videos within a playlist, e.g., by original order or title
  direction: 'asc',
};

export const PLAYLIST_SORTABLE_FIELDS: Array<PlaylistSortOrder['field']> = [
  'name',
  'createdAt',
  'updatedAt',
  'videoCount',
];

// Add other app-wide constants here as needed
// Example: Rate limit configurations
export const API_REQUEST_LIMIT = 100; // Max requests
export const API_REQUEST_INTERVAL = 60 * 1000; // Per minute

// Example: UI constants
export const DEFAULT_THUMBNAIL_FALLBACK = './assets/images/default-thumbnail.png'; // Path to a default image

// Example: File path constants (though many are handled by pathUtils or settingsService)
export const MAX_FILENAME_LENGTH = 200; 