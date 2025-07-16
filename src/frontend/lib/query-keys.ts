// src/frontend/lib/query-keys.ts

/**
 * Query keys factory for consistent cache management
 *
 * This factory provides a centralized way to generate query keys,
 * ensuring consistency across the application and making cache
 * invalidation more predictable.
 */

// Base query key types
export type QueryKeyBase = readonly unknown[];

// Playlist query keys
export const playlistKeys = {
  // All playlist-related queries
  all: ['playlists'] as const,

  // All playlists list queries
  lists: () => [...playlistKeys.all, 'list'] as const,

  // Specific playlist list query (with filters)
  list: (filters?: {
    search?: string;
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }) => [...playlistKeys.lists(), filters] as const,

  // All individual playlist queries
  details: () => [...playlistKeys.all, 'detail'] as const,

  // Specific playlist detail query
  detail: (id: string, options?: { includeMetadata?: boolean }) =>
    [...playlistKeys.details(), id, options] as const,

  // Playlist statistics
  stats: (id: string) => [...playlistKeys.detail(id), 'stats'] as const,

  // Playlist songs
  songs: (id: string) => [...playlistKeys.detail(id), 'songs'] as const,

  // Playlist validation/integrity
  integrity: (id: string) => [...playlistKeys.detail(id), 'integrity'] as const,

  // Search queries
  search: (query: string, filters?: any) =>
    [...playlistKeys.all, 'search', query, filters] as const,

  // Advanced search queries
  advancedSearch: (criteria: any) =>
    [...playlistKeys.all, 'advancedSearch', criteria] as const,

  // All tags
  tags: () => [...playlistKeys.all, 'tags'] as const,
} as const;

// Song query keys
export const songKeys = {
  // All song-related queries
  all: ['songs'] as const,

  // All songs list queries
  lists: () => [...songKeys.all, 'list'] as const,

  // Specific songs list query
  list: (filters?: {
    search?: string;
    artist?: string;
    album?: string;
    limit?: number;
    offset?: number;
  }) => [...songKeys.lists(), filters] as const,

  // All individual song queries
  details: () => [...songKeys.all, 'detail'] as const,

  // Specific song detail query
  detail: (id: string) => [...songKeys.details(), id] as const,

  // Song search queries
  search: (query: string) => [...songKeys.all, 'search', query] as const,
} as const;

// YouTube import query keys
export const youtubeKeys = {
  // All YouTube-related queries
  all: ['youtube'] as const,

  // URL validation
  validation: (url: string) => [...youtubeKeys.all, 'validation', url] as const,

  // Batch URL validation
  batchValidation: (urls: string[]) =>
    [...youtubeKeys.all, 'batchValidation', urls] as const,

  // Playlist preview
  preview: (playlistId: string) =>
    [...youtubeKeys.all, 'preview', playlistId] as const,

  // Rate limit status
  rateLimit: (userId?: string) =>
    [...youtubeKeys.all, 'rateLimit', userId] as const,

  // Import jobs
  imports: () => [...youtubeKeys.all, 'imports'] as const,

  // User's import jobs
  userImports: (userId: string) =>
    [...youtubeKeys.imports(), 'user', userId] as const,

  // Active import jobs
  activeImports: () => [...youtubeKeys.imports(), 'active'] as const,

  // Specific import job status
  importStatus: (jobId: string) =>
    [...youtubeKeys.imports(), 'status', jobId] as const,

  // Import statistics
  importStats: () => [...youtubeKeys.imports(), 'stats'] as const,
} as const;

// System/app query keys
export const systemKeys = {
  // All system-related queries
  all: ['system'] as const,

  // Database statistics
  dbStats: () => [...systemKeys.all, 'database', 'stats'] as const,

  // Application health
  health: () => [...systemKeys.all, 'health'] as const,

  // User preferences/settings
  preferences: (userId?: string) =>
    [...systemKeys.all, 'preferences', userId] as const,

  // Cache statistics
  cacheStats: () => [...systemKeys.all, 'cache', 'stats'] as const,
} as const;

// Query key utilities
export const queryKeyUtils = {
  /**
   * Check if a query key matches a pattern
   */
  matches: (queryKey: QueryKeyBase, pattern: QueryKeyBase): boolean => {
    if (pattern.length > queryKey.length) return false;

    return pattern.every((part, index) => {
      const keyPart = queryKey[index];
      return part === keyPart || part === undefined;
    });
  },

  /**
   * Get all query keys that match a pattern
   */
  getMatchingKeys: (
    pattern: QueryKeyBase,
    allKeys: QueryKeyBase[],
  ): QueryKeyBase[] => {
    return allKeys.filter(key => queryKeyUtils.matches(key, pattern));
  },

  /**
   * Create a query key hash for debugging
   */
  hash: (queryKey: QueryKeyBase): string => {
    return JSON.stringify(queryKey);
  },

  /**
   * Extract entity ID from query key
   */
  extractId: (
    queryKey: QueryKeyBase,
    position: number = 2,
  ): string | undefined => {
    return queryKey[position] as string | undefined;
  },

  /**
   * Check if query key is for a list query
   */
  isList: (queryKey: QueryKeyBase): boolean => {
    return queryKey.includes('list');
  },

  /**
   * Check if query key is for a detail query
   */
  isDetail: (queryKey: QueryKeyBase): boolean => {
    return queryKey.includes('detail');
  },

  /**
   * Check if query key is for a search query
   */
  isSearch: (queryKey: QueryKeyBase): boolean => {
    return queryKey.includes('search');
  },
};

// Query invalidation helpers
export const invalidationHelpers = {
  /**
   * Invalidate all playlist-related queries
   */
  playlists: {
    all: () => playlistKeys.all,
    lists: () => playlistKeys.lists(),
    detail: (id: string) => playlistKeys.detail(id),
    search: () => [...playlistKeys.all, 'search'],
  },

  /**
   * Invalidate all song-related queries
   */
  songs: {
    all: () => songKeys.all,
    lists: () => songKeys.lists(),
    detail: (id: string) => songKeys.detail(id),
    search: () => [...songKeys.all, 'search'],
  },

  /**
   * Invalidate all YouTube-related queries
   */
  youtube: {
    all: () => youtubeKeys.all,
    imports: () => youtubeKeys.imports(),
    userImports: (userId: string) => youtubeKeys.userImports(userId),
    validation: () => [...youtubeKeys.all, 'validation'],
  },

  /**
   * Invalidate queries after playlist mutation
   */
  afterPlaylistMutation: (playlistId?: string) => [
    playlistKeys.all,
    ...(playlistId ? [playlistKeys.detail(playlistId)] : []),
  ],

  /**
   * Invalidate queries after song mutation
   */
  afterSongMutation: (songId?: string, playlistId?: string) => [
    songKeys.all,
    ...(songId ? [songKeys.detail(songId)] : []),
    ...(playlistId ? [playlistKeys.songs(playlistId)] : []),
  ],

  /**
   * Invalidate queries after import completion
   */
  afterImportCompletion: (userId?: string) => [
    playlistKeys.all,
    youtubeKeys.imports(),
    ...(userId ? [youtubeKeys.userImports(userId)] : []),
  ],
};

// Type exports for better TypeScript support
export type PlaylistQueryKey = ReturnType<
  (typeof playlistKeys)[keyof typeof playlistKeys]
>;
export type SongQueryKey = ReturnType<(typeof songKeys)[keyof typeof songKeys]>;
export type YouTubeQueryKey = ReturnType<
  (typeof youtubeKeys)[keyof typeof youtubeKeys]
>;
export type SystemQueryKey = ReturnType<
  (typeof systemKeys)[keyof typeof systemKeys]
>;

export type AnyQueryKey =
  | PlaylistQueryKey
  | SongQueryKey
  | YouTubeQueryKey
  | SystemQueryKey;

// Development helpers
if (process.env.NODE_ENV === 'development') {
  // Add query keys to window for debugging
  (window as any).queryKeys = {
    playlist: playlistKeys,
    song: songKeys,
    youtube: youtubeKeys,
    system: systemKeys,
    utils: queryKeyUtils,
    invalidation: invalidationHelpers,
  };
}
