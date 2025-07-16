/**
 * Application-level queries using React Query
 *
 * This file contains all the queries related to application state,
 * version information, and general app functionality.
 */
import { AppVersionQuery } from '../../../shared/types/query-types';
/**
 * Query for getting application version
 */
export declare function useAppVersion(): import("../use-query-state").QueryStateResult<AppVersionQuery>;
/**
 * Query for checking if app is maximized
 */
export declare function useAppMaximizedState(): import("../use-query-state").QueryStateResult<boolean>;
/**
 * Mutation for minimizing the app
 */
export declare function useMinimizeApp(): import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
/**
 * Mutation for maximizing the app
 */
export declare function useMaximizeApp(): import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
/**
 * Mutation for unmaximizing the app
 */
export declare function useUnmaximizeApp(): import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
/**
 * Mutation for closing the app
 */
export declare function useCloseApp(): import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
/**
 * Mutation for quitting the app
 */
export declare function useQuitApp(): import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
/**
 * Hook for invalidating all app-related queries
 */
export declare function useInvalidateAppQueries(): {
    invalidateAll: () => Promise<void>;
    invalidateVersion: () => Promise<void>;
    invalidateWindowState: () => Promise<void>;
};
//# sourceMappingURL=use-app-queries.d.ts.map