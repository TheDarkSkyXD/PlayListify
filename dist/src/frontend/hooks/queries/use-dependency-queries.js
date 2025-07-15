"use strict";
/**
 * Dependency-related queries using React Query
 *
 * This file contains all the queries and mutations related to external dependencies
 * like yt-dlp and FFmpeg, including installation status and management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDependencyStatus = useDependencyStatus;
exports.useDependencyVersion = useDependencyVersion;
exports.useAllDependenciesReady = useAllDependenciesReady;
exports.useInstallDependency = useInstallDependency;
exports.useInstallAllDependencies = useInstallAllDependencies;
exports.useValidateDependency = useValidateDependency;
exports.useCleanupDependencies = useCleanupDependencies;
exports.useDependencyEventListeners = useDependencyEventListeners;
exports.useInvalidateDependencyQueries = useInvalidateDependencyQueries;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const react_query_1 = require("@tanstack/react-query");
const query_client_1 = require("../../lib/query-client");
const use_query_state_1 = require("../use-query-state");
const dependency_store_1 = require("../../stores/dependency-store");
/**
 * Query for getting dependency status
 */
function useDependencyStatus() {
    const queryResult = (0, react_query_1.useQuery)({
        queryKey: query_client_1.queryKeys.dependencies.status(),
        queryFn: async () => {
            const status = await window.electronAPI.dependency.getStatus();
            const isInitialized = await window.electronAPI.dependency.isInitialized();
            const allReady = await window.electronAPI.dependency.areAllReady();
            return {
                ...status,
                allReady,
                isInitialized,
            };
        },
        staleTime: 30 * 1000, // 30 seconds - dependency status can change
        gcTime: 2 * 60 * 1000, // 2 minutes
        refetchInterval: (data) => {
            // Refetch more frequently if dependencies are being installed
            if (data?.ytdlp?.installed === false || data?.ffmpeg?.installed === false) {
                return 5000; // 5 seconds
            }
            return 30000; // 30 seconds
        },
    });
    return (0, use_query_state_1.useQueryState)(queryResult, {
        errorMessage: 'Failed to get dependency status',
        retryable: true,
    });
}
/**
 * Query for getting specific dependency version
 */
function useDependencyVersion(dependencyName) {
    const queryResult = (0, react_query_1.useQuery)({
        queryKey: query_client_1.queryKeys.dependencies.version(dependencyName),
        queryFn: () => window.electronAPI.dependency.getVersion(dependencyName),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        enabled: true, // Always enabled, will return null if not installed
    });
    return (0, use_query_state_1.useQueryState)(queryResult, {
        errorMessage: `Failed to get ${dependencyName} version`,
        retryable: true,
    });
}
/**
 * Query for checking if all dependencies are ready
 */
function useAllDependenciesReady() {
    const queryResult = (0, react_query_1.useQuery)({
        queryKey: [...query_client_1.queryKeys.dependencies.all, 'allReady'],
        queryFn: () => window.electronAPI.dependency.areAllReady(),
        staleTime: 10 * 1000, // 10 seconds
        gcTime: 30 * 1000, // 30 seconds
        refetchInterval: 15000, // Check every 15 seconds
    });
    return (0, use_query_state_1.useQueryState)(queryResult, {
        errorMessage: 'Failed to check dependency readiness',
        retryable: true,
    });
}
/**
 * Mutation for installing a dependency
 */
function useInstallDependency() {
    const queryClient = (0, react_query_1.useQueryClient)();
    const dependencyStore = (0, dependency_store_1.useDependencyStore)();
    return (0, react_query_1.useMutation)({
        mutationFn: async ({ dependency, force = false }) => {
            // Update store to show installation started
            dependencyStore.startInstallation([dependency]);
            try {
                const result = await window.electronAPI.dependency.install(dependency);
                // Update store on success
                dependencyStore.completeInstallation(dependency, true);
                return result;
            }
            catch (error) {
                // Update store on failure
                dependencyStore.completeInstallation(dependency, false, error instanceof Error ? error.message : 'Installation failed');
                throw error;
            }
        },
        onSuccess: (_, { dependency }) => {
            // Invalidate dependency queries
            queryClient.invalidateQueries({ queryKey: query_client_1.queryKeys.dependencies.status() });
            queryClient.invalidateQueries({ queryKey: query_client_1.queryKeys.dependencies.version(dependency) });
            queryClient.invalidateQueries({ queryKey: [...query_client_1.queryKeys.dependencies.all, 'allReady'] });
        },
        onError: (error, { dependency }) => {
            console.error(`Failed to install ${dependency}:`, error);
            // Invalidate queries to get current state
            queryClient.invalidateQueries({ queryKey: query_client_1.queryKeys.dependencies.status() });
        },
    });
}
/**
 * Mutation for installing all missing dependencies
 */
function useInstallAllDependencies() {
    const queryClient = (0, react_query_1.useQueryClient)();
    const dependencyStore = (0, dependency_store_1.useDependencyStore)();
    return (0, react_query_1.useMutation)({
        mutationFn: async () => {
            const status = await window.electronAPI.dependency.getStatus();
            const missingDeps = [];
            if (!status.ytdlp?.installed)
                missingDeps.push('ytdlp');
            if (!status.ffmpeg?.installed)
                missingDeps.push('ffmpeg');
            if (missingDeps.length === 0) {
                return { message: 'All dependencies are already installed' };
            }
            // Update store to show installation started
            dependencyStore.startInstallation(missingDeps);
            const results = [];
            for (const dep of missingDeps) {
                try {
                    dependencyStore.setCurrentInstall(dep);
                    const result = await window.electronAPI.dependency.install(dep);
                    dependencyStore.completeInstallation(dep, true);
                    results.push({ dependency: dep, success: true, result });
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Installation failed';
                    dependencyStore.completeInstallation(dep, false, errorMessage);
                    results.push({ dependency: dep, success: false, error: errorMessage });
                }
            }
            return results;
        },
        onSuccess: () => {
            // Invalidate all dependency queries
            query_client_1.invalidateQueries.dependencies();
        },
        onError: (error) => {
            console.error('Failed to install dependencies:', error);
            // Invalidate queries to get current state
            query_client_1.invalidateQueries.dependencies();
        },
    });
}
/**
 * Mutation for validating a dependency
 */
function useValidateDependency() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: (dependency) => window.electronAPI.dependency.validate(dependency),
        onSuccess: (isValid, dependency) => {
            if (!isValid) {
                // If validation failed, invalidate status to trigger re-check
                queryClient.invalidateQueries({ queryKey: query_client_1.queryKeys.dependencies.status() });
                queryClient.invalidateQueries({ queryKey: query_client_1.queryKeys.dependencies.version(dependency) });
            }
        },
        onError: (error, dependency) => {
            console.error(`Failed to validate ${dependency}:`, error);
        },
    });
}
/**
 * Mutation for cleaning up dependencies
 */
function useCleanupDependencies() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: () => window.electronAPI.dependency.cleanup(),
        onSuccess: () => {
            // Invalidate all dependency queries after cleanup
            query_client_1.invalidateQueries.dependencies();
        },
        onError: (error) => {
            console.error('Failed to cleanup dependencies:', error);
        },
    });
}
/**
 * Hook for setting up dependency event listeners
 */
function useDependencyEventListeners() {
    const queryClient = (0, react_query_1.useQueryClient)();
    const dependencyStore = (0, dependency_store_1.useDependencyStore)();
    // Set up event listeners for dependency events
    react_1.default.useEffect(() => {
        // Status updated event
        const unsubscribeStatus = window.electronAPI.dependency.onStatusUpdated((event, status) => {
            // Update query cache
            queryClient.setQueryData(query_client_1.queryKeys.dependencies.status(), status);
            // Update store
            dependencyStore.updateLastStatusUpdate();
        });
        // Download progress event
        const unsubscribeProgress = window.electronAPI.dependency.onDownloadProgress((event, progress) => {
            // Update store with progress
            dependencyStore.updateInstallProgress(progress.dependency, {
                progress: progress.progress,
                status: progress.status,
                speed: progress.speed,
                eta: progress.eta,
            });
        });
        // Install started event
        const unsubscribeStarted = window.electronAPI.dependency.onInstallStarted((event, dependency) => {
            dependencyStore.setCurrentInstall(dependency);
        });
        // Install completed event
        const unsubscribeCompleted = window.electronAPI.dependency.onInstallCompleted((event, dependency) => {
            dependencyStore.completeInstallation(dependency, true);
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: query_client_1.queryKeys.dependencies.status() });
            queryClient.invalidateQueries({ queryKey: query_client_1.queryKeys.dependencies.version(dependency) });
        });
        // Install failed event
        const unsubscribeFailed = window.electronAPI.dependency.onInstallFailed((event, data) => {
            dependencyStore.completeInstallation(data.dependency, false, data.error);
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: query_client_1.queryKeys.dependencies.status() });
        });
        return () => {
            unsubscribeStatus();
            unsubscribeProgress();
            unsubscribeStarted();
            unsubscribeCompleted();
            unsubscribeFailed();
        };
    }, [queryClient, dependencyStore]);
}
/**
 * Hook for invalidating dependency queries
 */
function useInvalidateDependencyQueries() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return {
        invalidateAll: () => query_client_1.invalidateQueries.dependencies(),
        invalidateStatus: () => queryClient.invalidateQueries({ queryKey: query_client_1.queryKeys.dependencies.status() }),
        invalidateVersion: (dependency) => queryClient.invalidateQueries({ queryKey: query_client_1.queryKeys.dependencies.version(dependency) }),
        invalidateAllReady: () => queryClient.invalidateQueries({ queryKey: [...query_client_1.queryKeys.dependencies.all, 'allReady'] }),
    };
}
//# sourceMappingURL=use-dependency-queries.js.map