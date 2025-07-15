/**
 * Application-level queries using React Query
 * 
 * This file contains all the queries related to application state,
 * version information, and general app functionality.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../../lib/query-client';
import { useQueryState } from '../use-query-state';
import { AppVersionQuery } from '../../../shared/types/query-types';

/**
 * Query for getting application version
 */
export function useAppVersion() {
  const queryResult = useQuery({
    queryKey: queryKeys.app.version(),
    queryFn: async (): Promise<AppVersionQuery> => {
      const version = await window.electronAPI.app.getVersion();
      return {
        version,
        buildDate: new Date().toISOString(), // TODO: Get actual build date
        environment: process.env.NODE_ENV as 'development' | 'production',
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - version rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  return useQueryState(queryResult, {
    errorMessage: 'Failed to get application version',
    retryable: true,
  });
}

/**
 * Query for checking if app is maximized
 */
export function useAppMaximizedState() {
  const queryResult = useQuery({
    queryKey: [...queryKeys.app.all, 'maximized'],
    queryFn: () => window.electronAPI.app.isMaximized(),
    staleTime: 0, // Always fresh - window state changes frequently
    gcTime: 1000, // Short cache time
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  return useQueryState(queryResult, {
    errorMessage: 'Failed to get window state',
    retryable: false,
  });
}

/**
 * Mutation for minimizing the app
 */
export function useMinimizeApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => window.electronAPI.app.minimize(),
    onSuccess: () => {
      // Invalidate window state queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.app.all, 'maximized'] });
    },
    onError: (error) => {
      console.error('Failed to minimize app:', error);
    },
  });
}

/**
 * Mutation for maximizing the app
 */
export function useMaximizeApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => window.electronAPI.app.maximize(),
    onSuccess: () => {
      // Invalidate window state queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.app.all, 'maximized'] });
    },
    onError: (error) => {
      console.error('Failed to maximize app:', error);
    },
  });
}

/**
 * Mutation for unmaximizing the app
 */
export function useUnmaximizeApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => window.electronAPI.app.unmaximize(),
    onSuccess: () => {
      // Invalidate window state queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.app.all, 'maximized'] });
    },
    onError: (error) => {
      console.error('Failed to unmaximize app:', error);
    },
  });
}

/**
 * Mutation for closing the app
 */
export function useCloseApp() {
  return useMutation({
    mutationFn: () => window.electronAPI.app.close(),
    onError: (error) => {
      console.error('Failed to close app:', error);
    },
  });
}

/**
 * Mutation for quitting the app
 */
export function useQuitApp() {
  return useMutation({
    mutationFn: () => window.electronAPI.app.quit(),
    onError: (error) => {
      console.error('Failed to quit app:', error);
    },
  });
}

/**
 * Hook for invalidating all app-related queries
 */
export function useInvalidateAppQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => invalidateQueries.app(),
    invalidateVersion: () => queryClient.invalidateQueries({ queryKey: queryKeys.app.version() }),
    invalidateWindowState: () => queryClient.invalidateQueries({ 
      queryKey: [...queryKeys.app.all, 'maximized'] 
    }),
  };
}