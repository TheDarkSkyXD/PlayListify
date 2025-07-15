/**
 * Dependency-related queries using React Query
 *
 * This file contains all the queries and mutations related to external dependencies
 * like yt-dlp and FFmpeg, including installation status and management.
 */
import { DependencyStatusQuery, InstallDependencyMutation } from '../../../shared/types/query-types';
/**
 * Query for getting dependency status
 */
export declare function useDependencyStatus(): import("../use-query-state").QueryStateResult<DependencyStatusQuery>;
/**
 * Query for getting specific dependency version
 */
export declare function useDependencyVersion(dependencyName: 'ytdlp' | 'ffmpeg'): import("../use-query-state").QueryStateResult<any>;
/**
 * Query for checking if all dependencies are ready
 */
export declare function useAllDependenciesReady(): import("../use-query-state").QueryStateResult<any>;
/**
 * Mutation for installing a dependency
 */
export declare function useInstallDependency(): import("@tanstack/react-query").UseMutationResult<any, Error, InstallDependencyMutation, unknown>;
/**
 * Mutation for installing all missing dependencies
 */
export declare function useInstallAllDependencies(): import("@tanstack/react-query").UseMutationResult<{
    message: string;
} | ({
    dependency: "ytdlp" | "ffmpeg";
    success: boolean;
    result: any;
    error?: undefined;
} | {
    dependency: "ytdlp" | "ffmpeg";
    success: boolean;
    error: string;
    result?: undefined;
})[], Error, void, unknown>;
/**
 * Mutation for validating a dependency
 */
export declare function useValidateDependency(): import("@tanstack/react-query").UseMutationResult<unknown, Error, "ytdlp" | "ffmpeg", unknown>;
/**
 * Mutation for cleaning up dependencies
 */
export declare function useCleanupDependencies(): import("@tanstack/react-query").UseMutationResult<unknown, Error, void, unknown>;
/**
 * Hook for setting up dependency event listeners
 */
export declare function useDependencyEventListeners(): void;
/**
 * Hook for invalidating dependency queries
 */
export declare function useInvalidateDependencyQueries(): {
    invalidateAll: () => Promise<void>;
    invalidateStatus: () => Promise<void>;
    invalidateVersion: (dependency: string) => Promise<void>;
    invalidateAllReady: () => Promise<void>;
};
//# sourceMappingURL=use-dependency-queries.d.ts.map