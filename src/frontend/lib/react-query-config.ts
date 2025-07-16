// src/frontend/lib/react-query-config.ts

import {
  DefaultOptions,
  MutationCache,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Query configuration constants
export const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: (failureCount: number, error: any) => {
    // Don't retry on 4xx errors (client errors)
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    // Retry up to 3 times for other errors
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

// Default query options
const defaultQueryOptions: DefaultOptions = {
  queries: {
    staleTime: QUERY_CONFIG.staleTime,
    cacheTime: QUERY_CONFIG.cacheTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
    refetchOnReconnect: QUERY_CONFIG.refetchOnReconnect,
    retry: QUERY_CONFIG.retry,
    retryDelay: QUERY_CONFIG.retryDelay,
    useErrorBoundary: (error: any) => {
      // Use error boundary for server errors (5xx) but not client errors (4xx)
      return error?.status >= 500;
    },
  },
  mutations: {
    retry: (failureCount: number, error: any) => {
      // Don't retry mutations on client errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry once for server errors
      return failureCount < 1;
    },
    useErrorBoundary: false, // Handle mutation errors manually
    onError: (error: any) => {
      // Show toast notification for mutation errors
      const message =
        error?.userMessage || error?.message || 'An error occurred';
      toast.error(message);
    },
  },
};

// Query cache configuration
const queryCache = new QueryCache({
  onError: (error: any, query) => {
    // Log query errors
    console.error('Query error:', {
      queryKey: query.queryKey,
      error: error?.message || error,
      timestamp: new Date().toISOString(),
    });

    // Show toast for background query errors (not initial loads)
    if (query.state.data !== undefined) {
      const message = error?.userMessage || 'Failed to fetch updated data';
      toast.error(message);
    }
  },
  onSuccess: (data, query) => {
    // Log successful queries in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('Query success:', {
        queryKey: query.queryKey,
        dataType: typeof data,
        timestamp: new Date().toISOString(),
      });
    }
  },
});

// Mutation cache configuration
const mutationCache = new MutationCache({
  onError: (error: any, variables, context, mutation) => {
    console.error('Mutation error:', {
      mutationKey: mutation.options.mutationKey,
      error: error?.message || error,
      variables,
      timestamp: new Date().toISOString(),
    });
  },
  onSuccess: (data, variables, context, mutation) => {
    // Log successful mutations in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('Mutation success:', {
        mutationKey: mutation.options.mutationKey,
        timestamp: new Date().toISOString(),
      });
    }
  },
});

// Create and configure QueryClient
export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
    queryCache,
    mutationCache,
  });
};

// Global query client instance
export const queryClient = createQueryClient();

// Query client utilities
export const queryClientUtils = {
  /**
   * Invalidate all queries
   */
  invalidateAll: () => {
    return queryClient.invalidateQueries();
  },

  /**
   * Clear all cached data
   */
  clearAll: () => {
    queryClient.clear();
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'loading').length,
      cacheSize: queries.reduce((size, query) => {
        const dataSize = JSON.stringify(query.state.data || {}).length;
        return size + dataSize;
      }, 0),
    };
  },

  /**
   * Prefetch query
   */
  prefetch: <T>(queryKey: any[], queryFn: () => Promise<T>, options?: any) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
      ...options,
    });
  },

  /**
   * Set query data
   */
  setQueryData: <T>(queryKey: any[], data: T) => {
    queryClient.setQueryData(queryKey, data);
  },

  /**
   * Get query data
   */
  getQueryData: <T>(queryKey: any[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  },

  /**
   * Remove query
   */
  removeQuery: (queryKey: any[]) => {
    queryClient.removeQueries({ queryKey });
  },

  /**
   * Cancel queries
   */
  cancelQueries: (queryKey?: any[]) => {
    return queryClient.cancelQueries({ queryKey });
  },
};

// Development tools
if (process.env.NODE_ENV === 'development') {
  // Add query client to window for debugging
  (window as any).queryClient = queryClient;
  (window as any).queryClientUtils = queryClientUtils;
}
