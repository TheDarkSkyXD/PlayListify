"use strict";
/**
 * TanStack React Query configuration with optimal defaults for Playlistify
 *
 * This configuration provides:
 * - 5 minute stale time for most queries
 * - No refetch on window focus (desktop app behavior)
 * - Proper error handling and retry logic
 * - Optimized caching strategies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryUtils = exports.prefetchQueries = exports.invalidateQueries = exports.queryKeys = exports.queryClient = void 0;
const react_query_1 = require("@tanstack/react-query");
// Default query options optimized for desktop application
const queryConfig = {
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
        retry: (failureCount, error) => {
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
exports.queryClient = new react_query_1.QueryClient({
    defaultOptions: queryConfig,
    // Global error handler for unhandled query errors
    // Note: logger is not available in newer versions of React Query
});
// Query keys factory for consistent key management
exports.queryKeys = {
    // Application queries
    app: {
        all: ['app'],
        version: () => [...exports.queryKeys.app.all, 'version'],
    },
    // Settings queries
    settings: {
        all: ['settings'],
        get: (key) => [...exports.queryKeys.settings.all, 'get', key],
        getAll: () => [...exports.queryKeys.settings.all, 'getAll'],
    },
    // Dependency queries
    dependencies: {
        all: ['dependencies'],
        status: () => [...exports.queryKeys.dependencies.all, 'status'],
        version: (name) => [...exports.queryKeys.dependencies.all, 'version', name],
    },
    // File system queries
    fileSystem: {
        all: ['fileSystem'],
        exists: (path) => [...exports.queryKeys.fileSystem.all, 'exists', path],
        stats: (path) => [...exports.queryKeys.fileSystem.all, 'stats', path],
        list: (path, type) => [...exports.queryKeys.fileSystem.all, 'list', type, path],
    },
    // Future: Playlist queries (Phase 2)
    playlists: {
        all: ['playlists'],
        list: () => [...exports.queryKeys.playlists.all, 'list'],
        detail: (id) => [...exports.queryKeys.playlists.all, 'detail', id],
        videos: (id) => [...exports.queryKeys.playlists.all, 'videos', id],
        stats: (id) => [...exports.queryKeys.playlists.all, 'stats', id],
    },
    // Future: Video queries (Phase 2)
    videos: {
        all: ['videos'],
        detail: (id) => [...exports.queryKeys.videos.all, 'detail', id],
        qualities: (id) => [...exports.queryKeys.videos.all, 'qualities', id],
    },
    // Future: YouTube queries (Phase 2)
    youtube: {
        all: ['youtube'],
        metadata: (url) => [...exports.queryKeys.youtube.all, 'metadata', url],
        availability: () => [...exports.queryKeys.youtube.all, 'availability'],
    },
};
// Utility functions for query invalidation
exports.invalidateQueries = {
    // Invalidate all app-related queries
    app: () => exports.queryClient.invalidateQueries({ queryKey: exports.queryKeys.app.all }),
    // Invalidate all settings queries
    settings: () => exports.queryClient.invalidateQueries({ queryKey: exports.queryKeys.settings.all }),
    // Invalidate specific setting
    setting: (key) => exports.queryClient.invalidateQueries({ queryKey: exports.queryKeys.settings.get(key) }),
    // Invalidate all dependency queries
    dependencies: () => exports.queryClient.invalidateQueries({ queryKey: exports.queryKeys.dependencies.all }),
    // Invalidate all file system queries
    fileSystem: () => exports.queryClient.invalidateQueries({ queryKey: exports.queryKeys.fileSystem.all }),
    // Invalidate file system queries for specific path
    fileSystemPath: (path) => exports.queryClient.invalidateQueries({
        queryKey: exports.queryKeys.fileSystem.all,
        predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey.includes(path);
        }
    }),
    // Future: Playlist invalidation
    playlists: () => exports.queryClient.invalidateQueries({ queryKey: exports.queryKeys.playlists.all }),
    playlist: (id) => exports.queryClient.invalidateQueries({ queryKey: exports.queryKeys.playlists.detail(id) }),
    // Future: Video invalidation
    videos: () => exports.queryClient.invalidateQueries({ queryKey: exports.queryKeys.videos.all }),
    video: (id) => exports.queryClient.invalidateQueries({ queryKey: exports.queryKeys.videos.detail(id) }),
};
// Prefetch utilities for common queries
exports.prefetchQueries = {
    // Prefetch app version
    appVersion: () => exports.queryClient.prefetchQuery({
        queryKey: exports.queryKeys.app.version(),
        queryFn: () => window.electronAPI.app.getVersion(),
    }),
    // Prefetch dependency status
    dependencyStatus: () => exports.queryClient.prefetchQuery({
        queryKey: exports.queryKeys.dependencies.status(),
        queryFn: () => window.electronAPI.dependency.getStatus(),
    }),
    // Prefetch all settings
    allSettings: () => exports.queryClient.prefetchQuery({
        queryKey: exports.queryKeys.settings.getAll(),
        queryFn: () => window.electronAPI.settings.getAll(),
    }),
};
// Query client utilities
exports.queryUtils = {
    // Clear all cached data
    clear: () => exports.queryClient.clear(),
    // Remove all queries
    removeQueries: () => exports.queryClient.removeQueries(),
    // Get cached data
    getQueryData: (queryKey) => exports.queryClient.getQueryData(queryKey),
    // Set cached data
    setQueryData: (queryKey, data) => exports.queryClient.setQueryData(queryKey, data),
    // Cancel outgoing queries
    cancelQueries: (queryKey) => exports.queryClient.cancelQueries({ queryKey }),
};
//# sourceMappingURL=query-client.js.map