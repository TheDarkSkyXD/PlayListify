"use strict";
/**
 * Settings-related queries using React Query
 *
 * This file contains all the queries and mutations related to application settings,
 * user preferences, and configuration management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSetting = useSetting;
exports.useAllSettings = useAllSettings;
exports.useThemeSetting = useThemeSetting;
exports.useDownloadLocationSetting = useDownloadLocationSetting;
exports.useLanguageSetting = useLanguageSetting;
exports.useAutoUpdateSetting = useAutoUpdateSetting;
exports.useUpdateSetting = useUpdateSetting;
exports.useUpdateMultipleSettings = useUpdateMultipleSettings;
exports.useResetSettings = useResetSettings;
exports.useExportSettings = useExportSettings;
exports.useImportSettings = useImportSettings;
exports.useInitializeDownloadLocation = useInitializeDownloadLocation;
exports.useInvalidateSettingsQueries = useInvalidateSettingsQueries;
exports.usePrefetchCommonSettings = usePrefetchCommonSettings;
const react_query_1 = require("@tanstack/react-query");
const query_client_1 = require("../../lib/query-client");
const use_query_state_1 = require("../use-query-state");
/**
 * Query for getting a specific setting value
 */
function useSetting(key, defaultValue) {
    const queryResult = (0, react_query_1.useQuery)({
        queryKey: query_client_1.queryKeys.settings.get(key),
        queryFn: async () => {
            const value = await window.electronAPI.settings.get(key);
            const hasCustomValue = await window.electronAPI.settings.hasCustomValue(key);
            return {
                key,
                value: value ?? defaultValue,
                hasCustomValue,
                defaultValue: defaultValue,
            };
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
    return (0, use_query_state_1.useQueryState)(queryResult, {
        errorMessage: `Failed to get setting: ${key}`,
        retryable: true,
    });
}
/**
 * Query for getting all settings
 */
function useAllSettings() {
    const queryResult = (0, react_query_1.useQuery)({
        queryKey: query_client_1.queryKeys.settings.getAll(),
        queryFn: async () => {
            const settings = await window.electronAPI.settings.getAll();
            return settings;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 15 * 60 * 1000, // 15 minutes
    });
    return (0, use_query_state_1.useQueryState)(queryResult, {
        errorMessage: 'Failed to get application settings',
        retryable: true,
        emptyCheck: (data) => !data || Object.keys(data).length === 0,
    });
}
/**
 * Query for getting theme setting
 */
function useThemeSetting() {
    return useSetting('theme', 'system');
}
/**
 * Query for getting download location setting
 */
function useDownloadLocationSetting() {
    return useSetting('downloadLocation', '');
}
/**
 * Query for getting language setting
 */
function useLanguageSetting() {
    return useSetting('language', 'en');
}
/**
 * Query for getting auto-update setting
 */
function useAutoUpdateSetting() {
    return useSetting('autoUpdate', true);
}
/**
 * Mutation for updating a setting
 */
function useUpdateSetting() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: async ({ key, value }) => {
            await window.electronAPI.settings.set(key, value);
            return { key, value };
        },
        onSuccess: ({ key, value }) => {
            // Update the specific setting in cache
            queryClient.setQueryData(query_client_1.queryKeys.settings.get(key), (old) => {
                if (!old)
                    return { key, value, hasCustomValue: true, defaultValue: value };
                return { ...old, value, hasCustomValue: true };
            });
            // Update all settings cache
            queryClient.setQueryData(query_client_1.queryKeys.settings.getAll(), (old) => {
                if (!old)
                    return { [key]: value };
                return { ...old, [key]: value };
            });
            // Invalidate related queries
            query_client_1.invalidateQueries.setting(key);
        },
        onError: (error, { key }) => {
            console.error(`Failed to update setting ${key}:`, error);
            // Invalidate to refetch current value
            query_client_1.invalidateQueries.setting(key);
        },
    });
}
/**
 * Mutation for updating multiple settings at once
 */
function useUpdateMultipleSettings() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: async (settings) => {
            // Update each setting
            for (const [key, value] of Object.entries(settings)) {
                await window.electronAPI.settings.set(key, value);
            }
            return settings;
        },
        onSuccess: (settings) => {
            // Update individual setting caches
            Object.entries(settings).forEach(([key, value]) => {
                queryClient.setQueryData(query_client_1.queryKeys.settings.get(key), (old) => {
                    if (!old)
                        return { key, value, hasCustomValue: true, defaultValue: value };
                    return { ...old, value, hasCustomValue: true };
                });
            });
            // Update all settings cache
            queryClient.setQueryData(query_client_1.queryKeys.settings.getAll(), (old) => {
                return { ...old, ...settings };
            });
            // Invalidate all settings
            query_client_1.invalidateQueries.settings();
        },
        onError: (error) => {
            console.error('Failed to update multiple settings:', error);
            // Invalidate all settings to refetch current values
            query_client_1.invalidateQueries.settings();
        },
    });
}
/**
 * Mutation for resetting settings to defaults
 */
function useResetSettings() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: () => window.electronAPI.settings.reset(),
        onSuccess: () => {
            // Clear all settings from cache to force refetch
            queryClient.removeQueries({ queryKey: query_client_1.queryKeys.settings.all });
            // Invalidate all settings queries
            query_client_1.invalidateQueries.settings();
        },
        onError: (error) => {
            console.error('Failed to reset settings:', error);
        },
    });
}
/**
 * Mutation for exporting settings
 */
function useExportSettings() {
    return (0, react_query_1.useMutation)({
        mutationFn: () => window.electronAPI.settings.export(),
        onError: (error) => {
            console.error('Failed to export settings:', error);
        },
    });
}
/**
 * Mutation for importing settings
 */
function useImportSettings() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: (jsonString) => window.electronAPI.settings.import(jsonString),
        onSuccess: () => {
            // Clear all settings from cache to force refetch
            queryClient.removeQueries({ queryKey: query_client_1.queryKeys.settings.all });
            // Invalidate all settings queries
            query_client_1.invalidateQueries.settings();
        },
        onError: (error) => {
            console.error('Failed to import settings:', error);
        },
    });
}
/**
 * Mutation for initializing download location
 */
function useInitializeDownloadLocation() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: () => window.electronAPI.settings.initializeDownloadLocation(),
        onSuccess: () => {
            // Invalidate download location setting
            query_client_1.invalidateQueries.setting('downloadLocation');
        },
        onError: (error) => {
            console.error('Failed to initialize download location:', error);
        },
    });
}
/**
 * Hook for invalidating settings queries
 */
function useInvalidateSettingsQueries() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return {
        invalidateAll: () => query_client_1.invalidateQueries.settings(),
        invalidateSetting: (key) => query_client_1.invalidateQueries.setting(key),
        invalidateAllSettings: () => queryClient.invalidateQueries({ queryKey: query_client_1.queryKeys.settings.getAll() }),
        clearCache: () => queryClient.removeQueries({ queryKey: query_client_1.queryKeys.settings.all }),
    };
}
/**
 * Hook for prefetching common settings
 */
function usePrefetchCommonSettings() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return {
        prefetchTheme: () => queryClient.prefetchQuery({
            queryKey: query_client_1.queryKeys.settings.get('theme'),
            queryFn: () => window.electronAPI.settings.get('theme'),
        }),
        prefetchDownloadLocation: () => queryClient.prefetchQuery({
            queryKey: query_client_1.queryKeys.settings.get('downloadLocation'),
            queryFn: () => window.electronAPI.settings.get('downloadLocation'),
        }),
        prefetchLanguage: () => queryClient.prefetchQuery({
            queryKey: query_client_1.queryKeys.settings.get('language'),
            queryFn: () => window.electronAPI.settings.get('language'),
        }),
        prefetchAll: () => queryClient.prefetchQuery({
            queryKey: query_client_1.queryKeys.settings.getAll(),
            queryFn: () => window.electronAPI.settings.getAll(),
        }),
    };
}
//# sourceMappingURL=use-settings-queries.js.map