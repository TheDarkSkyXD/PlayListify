/**
 * TanStack React Query configuration with optimal defaults for Playlistify
 * 
 * This configuration provides:
 * - 5 minute stale time for most queries
 * - No refetch on window focus (desktop app behavior)
 * - Proper error handling and retry logic
 * - Optimized caching strategies
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

// Default query options optimized for desktop application
const queryConfig: DefaultOptions = {
  queries: {
    // Data is considered fresh for 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // Cache data for 10 minutes after it becomes unused
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    
    // Don't refetch on window focus (desktop app behavior)
    refetchOnWindowFocus: false,
    
    // Don't refetch on reconnect for desktop app
    refetchOnReconnect: false,
    
    // Retry failed requests 3 times with exponential backoff
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    
    // Exponential backoff delay
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  
  mutations: {
    // Retry mutations once on failure
    retry: 1,
    
    // Shorter retry delay for mutations
    retryDelay: 1000,
  },
};

// Create and configure the query client
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
  
  // Global error handler for unhandled query errors
  // Note: logger is not available in newer versions of React Query
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Application queries
  app: {
    all: ['app'] as const,
    version: () => [...queryKeys.app.all, 'version'] as const,
  },
  
  // Settings queries
  settings: {
    all: ['settings'] as const,
    get: (key: string) => [...queryKeys.settings.all, 'get', key] as const,
    getAll: () => [...queryKeys.settings.all, 'getAll'] as const,
  },
  
  // Dependency queries
  dependencies: {
    all: ['dependencies'] as const,
    status: () => [...queryKeys.dependencies.all, 'status'] as const,
    version: (name: string) => [...queryKeys.dependencies.all, 'version', name] as const,
  },
  
  // File system queries
  fileSystem: {
    all: ['fileSystem'] as const,
    exists: (path: string) => [...queryKeys.fileSystem.all, 'exists', path] as const,
    stats: (path: string) => [...queryKeys.fileSystem.all, 'stats', path] as const,
    list: (path: string, type: 'files' | 'directories') => 
      [...queryKeys.fileSystem.all, 'list', type, path] as const,
  },
  
  // Future: Playlist queries (Phase 2)
  playlists: {
    all: ['playlists'] as const,
    list: () => [...queryKeys.playlists.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.playlists.all, 'detail', id] as const,
    videos: (id: number) => [...queryKeys.playlists.all, 'videos', id] as const,
    stats: (id: number) => [...queryKeys.playlists.all, 'stats', id] as const,
  },
  
  // Future: Video queries (Phase 2)
  videos: {
    all: ['videos'] as const,
    detail: (id: string) => [...queryKeys.videos.all, 'detail', id] as const,
    qualities: (id: string) => [...queryKeys.videos.all, 'qualities', id] as const,
  },
  
  // Future: YouTube queries (Phase 2)
  youtube: {
    all: ['youtube'] as const,
    metadata: (url: string) => [...queryKeys.youtube.all, 'metadata', url] as const,
    availability: () => [...queryKeys.youtube.all, 'availability'] as const,
  },
} as const;

// Utility functions for query invalidation
export const invalidateQueries = {
  // Invalidate all app-related queries
  app: () => queryClient.invalidateQueries({ queryKey: queryKeys.app.all }),
  
  // Invalidate all settings queries
  settings: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.all }),
  
  // Invalidate specific setting
  setting: (key: string) => queryClient.invalidateQueries({ queryKey: queryKeys.settings.get(key) }),
  
  // Invalidate all dependency queries
  dependencies: () => queryClient.invalidateQueries({ queryKey: queryKeys.dependencies.all }),
  
  // Invalidate all file system queries
  fileSystem: () => queryClient.invalidateQueries({ queryKey: queryKeys.fileSystem.all }),
  
  // Invalidate file system queries for specific path
  fileSystemPath: (path: string) => 
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.fileSystem.all,
      predicate: (query) => {
        const queryKey = query.queryKey as string[];
        return queryKey.includes(path);
      }
    }),
  
  // Future: Playlist invalidation
  playlists: () => queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all }),
  playlist: (id: number) => queryClient.invalidateQueries({ queryKey: queryKeys.playlists.detail(id) }),
  
  // Future: Video invalidation
  videos: () => queryClient.invalidateQueries({ queryKey: queryKeys.videos.all }),
  video: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.videos.detail(id) }),
};

// Prefetch utilities for common queries
export const prefetchQueries = {
  // Prefetch app version
  appVersion: () => queryClient.prefetchQuery({
    queryKey: queryKeys.app.version(),
    queryFn: () => window.electronAPI.app.getVersion(),
  }),
  
  // Prefetch dependency status
  dependencyStatus: () => queryClient.prefetchQuery({
    queryKey: queryKeys.dependencies.status(),
    queryFn: () => window.electronAPI.dependency.getStatus(),
  }),
  
  // Prefetch all settings
  allSettings: () => queryClient.prefetchQuery({
    queryKey: queryKeys.settings.getAll(),
    queryFn: () => window.electronAPI.settings.getAll(),
  }),
};

// Query client utilities
export const queryUtils = {
  // Clear all cached data
  clear: () => queryClient.clear(),
  
  // Remove all queries
  removeQueries: () => queryClient.removeQueries(),
  
  // Get cached data
  getQueryData: <T>(queryKey: readonly unknown[]) => 
    queryClient.getQueryData<T>(queryKey),
  
  // Set cached data
  setQueryData: <T>(queryKey: readonly unknown[], data: T) => 
    queryClient.setQueryData(queryKey, data),
  
  // Cancel outgoing queries
  cancelQueries: (queryKey?: readonly unknown[]) => 
    queryClient.cancelQueries({ queryKey }),
};