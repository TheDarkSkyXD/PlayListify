/**
 * Settings-related queries using React Query
 *
 * This file contains all the queries and mutations related to application settings,
 * user preferences, and configuration management.
 */
import { SettingsQuery, AllSettingsQuery, UpdateSettingMutation } from '../../../shared/types/query-types';
/**
 * Query for getting a specific setting value
 */
export declare function useSetting<T = any>(key: string, defaultValue?: T): import("../use-query-state").QueryStateResult<SettingsQuery<T>>;
/**
 * Query for getting all settings
 */
export declare function useAllSettings(): import("../use-query-state").QueryStateResult<AllSettingsQuery>;
/**
 * Query for getting theme setting
 */
export declare function useThemeSetting(): import("../use-query-state").QueryStateResult<SettingsQuery<"light" | "dark" | "system">>;
/**
 * Query for getting download location setting
 */
export declare function useDownloadLocationSetting(): import("../use-query-state").QueryStateResult<SettingsQuery<string>>;
/**
 * Query for getting language setting
 */
export declare function useLanguageSetting(): import("../use-query-state").QueryStateResult<SettingsQuery<string>>;
/**
 * Query for getting auto-update setting
 */
export declare function useAutoUpdateSetting(): import("../use-query-state").QueryStateResult<SettingsQuery<boolean>>;
/**
 * Mutation for updating a setting
 */
export declare function useUpdateSetting<T = any>(): import("@tanstack/react-query").UseMutationResult<{
    key: string;
    value: T;
}, Error, UpdateSettingMutation<T>, unknown>;
/**
 * Mutation for updating multiple settings at once
 */
export declare function useUpdateMultipleSettings(): import("@tanstack/react-query").UseMutationResult<Record<string, any>, Error, Record<string, any>, unknown>;
/**
 * Mutation for resetting settings to defaults
 */
export declare function useResetSettings(): import("@tanstack/react-query").UseMutationResult<unknown, Error, void, unknown>;
/**
 * Mutation for exporting settings
 */
export declare function useExportSettings(): import("@tanstack/react-query").UseMutationResult<unknown, Error, void, unknown>;
/**
 * Mutation for importing settings
 */
export declare function useImportSettings(): import("@tanstack/react-query").UseMutationResult<unknown, Error, string, unknown>;
/**
 * Mutation for initializing download location
 */
export declare function useInitializeDownloadLocation(): import("@tanstack/react-query").UseMutationResult<unknown, Error, void, unknown>;
/**
 * Hook for invalidating settings queries
 */
export declare function useInvalidateSettingsQueries(): {
    invalidateAll: () => Promise<void>;
    invalidateSetting: (key: string) => Promise<void>;
    invalidateAllSettings: () => Promise<void>;
    clearCache: () => void;
};
/**
 * Hook for prefetching common settings
 */
export declare function usePrefetchCommonSettings(): {
    prefetchTheme: () => Promise<void>;
    prefetchDownloadLocation: () => Promise<void>;
    prefetchLanguage: () => Promise<void>;
    prefetchAll: () => Promise<void>;
};
//# sourceMappingURL=use-settings-queries.d.ts.map