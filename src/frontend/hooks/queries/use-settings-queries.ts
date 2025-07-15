/**
 * Settings-related queries using React Query
 * 
 * This file contains all the queries and mutations related to application settings,
 * user preferences, and configuration management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../../lib/query-client';
import { useQueryState } from '../use-query-state';
import { 
  SettingsQuery, 
  AllSettingsQuery, 
  UpdateSettingMutation 
} from '../../../shared/types/query-types';
import { UserSettings } from '../../../shared/types';

/**
 * Query for getting a specific setting value
 */
export function useSetting<T = any>(key: string, defaultValue?: T) {
  const queryResult = useQuery({
    queryKey: queryKeys.settings.get(key),
    queryFn: async (): Promise<SettingsQuery<T>> => {
      const value = await window.electronAPI.settings.get<T>(key);
      const hasCustomValue = await window.electronAPI.settings.hasCustomValue(key);
      
      return {
        key,
        value: value ?? defaultValue,
        hasCustomValue,
        defaultValue: defaultValue as T,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return useQueryState(queryResult, {
    errorMessage: `Failed to get setting: ${key}`,
    retryable: true,
  });
}

/**
 * Query for getting all settings
 */
export function useAllSettings() {
  const queryResult = useQuery({
    queryKey: queryKeys.settings.getAll(),
    queryFn: async (): Promise<AllSettingsQuery> => {
      const settings = await window.electronAPI.settings.getAll();
      return settings as AllSettingsQuery;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  return useQueryState(queryResult, {
    errorMessage: 'Failed to get application settings',
    retryable: true,
    emptyCheck: (data) => !data || Object.keys(data).length === 0,
  });
}

/**
 * Query for getting theme setting
 */
export function useThemeSetting() {
  return useSetting<'light' | 'dark' | 'system'>('theme', 'system');
}

/**
 * Query for getting download location setting
 */
export function useDownloadLocationSetting() {
  return useSetting<string>('downloadLocation', '');
}

/**
 * Query for getting language setting
 */
export function useLanguageSetting() {
  return useSetting<string>('language', 'en');
}

/**
 * Query for getting auto-update setting
 */
export function useAutoUpdateSetting() {
  return useSetting<boolean>('autoUpdate', true);
}

/**
 * Mutation for updating a setting
 */
export function useUpdateSetting<T = any>() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: UpdateSettingMutation<T>) => {
      await window.electronAPI.settings.set(key, value);
      return { key, value };
    },
    onSuccess: ({ key, value }) => {
      // Update the specific setting in cache
      queryClient.setQueryData(queryKeys.settings.get(key), (old: SettingsQuery<T> | undefined) => {
        if (!old) return { key, value, hasCustomValue: true, defaultValue: value };
        return { ...old, value, hasCustomValue: true };
      });

      // Update all settings cache
      queryClient.setQueryData(queryKeys.settings.getAll(), (old: AllSettingsQuery | undefined) => {
        if (!old) return { [key]: value };
        return { ...old, [key]: value };
      });

      // Invalidate related queries
      invalidateQueries.setting(key);
    },
    onError: (error, { key }) => {
      console.error(`Failed to update setting ${key}:`, error);
      // Invalidate to refetch current value
      invalidateQueries.setting(key);
    },
  });
}

/**
 * Mutation for updating multiple settings at once
 */
export function useUpdateMultipleSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        await window.electronAPI.settings.set(key, value);
      }
      return settings;
    },
    onSuccess: (settings) => {
      // Update individual setting caches
      Object.entries(settings).forEach(([key, value]) => {
        queryClient.setQueryData(queryKeys.settings.get(key), (old: SettingsQuery<any> | undefined) => {
          if (!old) return { key, value, hasCustomValue: true, defaultValue: value };
          return { ...old, value, hasCustomValue: true };
        });
      });

      // Update all settings cache
      queryClient.setQueryData(queryKeys.settings.getAll(), (old: AllSettingsQuery | undefined) => {
        return { ...old, ...settings };
      });

      // Invalidate all settings
      invalidateQueries.settings();
    },
    onError: (error) => {
      console.error('Failed to update multiple settings:', error);
      // Invalidate all settings to refetch current values
      invalidateQueries.settings();
    },
  });
}

/**
 * Mutation for resetting settings to defaults
 */
export function useResetSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => window.electronAPI.settings.reset(),
    onSuccess: () => {
      // Clear all settings from cache to force refetch
      queryClient.removeQueries({ queryKey: queryKeys.settings.all });
      
      // Invalidate all settings queries
      invalidateQueries.settings();
    },
    onError: (error) => {
      console.error('Failed to reset settings:', error);
    },
  });
}

/**
 * Mutation for exporting settings
 */
export function useExportSettings() {
  return useMutation({
    mutationFn: () => window.electronAPI.settings.export(),
    onError: (error) => {
      console.error('Failed to export settings:', error);
    },
  });
}

/**
 * Mutation for importing settings
 */
export function useImportSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jsonString: string) => window.electronAPI.settings.import(jsonString),
    onSuccess: () => {
      // Clear all settings from cache to force refetch
      queryClient.removeQueries({ queryKey: queryKeys.settings.all });
      
      // Invalidate all settings queries
      invalidateQueries.settings();
    },
    onError: (error) => {
      console.error('Failed to import settings:', error);
    },
  });
}

/**
 * Mutation for initializing download location
 */
export function useInitializeDownloadLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => window.electronAPI.settings.initializeDownloadLocation(),
    onSuccess: () => {
      // Invalidate download location setting
      invalidateQueries.setting('downloadLocation');
    },
    onError: (error) => {
      console.error('Failed to initialize download location:', error);
    },
  });
}

/**
 * Hook for invalidating settings queries
 */
export function useInvalidateSettingsQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => invalidateQueries.settings(),
    invalidateSetting: (key: string) => invalidateQueries.setting(key),
    invalidateAllSettings: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.getAll() }),
    clearCache: () => queryClient.removeQueries({ queryKey: queryKeys.settings.all }),
  };
}

/**
 * Hook for prefetching common settings
 */
export function usePrefetchCommonSettings() {
  const queryClient = useQueryClient();

  return {
    prefetchTheme: () => queryClient.prefetchQuery({
      queryKey: queryKeys.settings.get('theme'),
      queryFn: () => window.electronAPI.settings.get('theme'),
    }),
    prefetchDownloadLocation: () => queryClient.prefetchQuery({
      queryKey: queryKeys.settings.get('downloadLocation'),
      queryFn: () => window.electronAPI.settings.get('downloadLocation'),
    }),
    prefetchLanguage: () => queryClient.prefetchQuery({
      queryKey: queryKeys.settings.get('language'),
      queryFn: () => window.electronAPI.settings.get('language'),
    }),
    prefetchAll: () => queryClient.prefetchQuery({
      queryKey: queryKeys.settings.getAll(),
      queryFn: () => window.electronAPI.settings.getAll(),
    }),
  };
}