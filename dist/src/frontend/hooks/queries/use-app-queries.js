"use strict";
/**
 * Application-level queries using React Query
 *
 * This file contains all the queries related to application state,
 * version information, and general app functionality.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAppVersion = useAppVersion;
exports.useAppMaximizedState = useAppMaximizedState;
exports.useMinimizeApp = useMinimizeApp;
exports.useMaximizeApp = useMaximizeApp;
exports.useUnmaximizeApp = useUnmaximizeApp;
exports.useCloseApp = useCloseApp;
exports.useQuitApp = useQuitApp;
exports.useInvalidateAppQueries = useInvalidateAppQueries;
const react_query_1 = require("@tanstack/react-query");
const query_client_1 = require("../../lib/query-client");
const use_query_state_1 = require("../use-query-state");
/**
 * Query for getting application version
 */
function useAppVersion() {
    const queryResult = (0, react_query_1.useQuery)({
        queryKey: query_client_1.queryKeys.app.version(),
        queryFn: async () => {
            const version = await window.electronAPI.app.getVersion();
            return {
                version,
                buildDate: new Date().toISOString(), // TODO: Get actual build date
                environment: process.env.NODE_ENV,
            };
        },
        staleTime: 10 * 60 * 1000, // 10 minutes - version rarely changes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });
    return (0, use_query_state_1.useQueryState)(queryResult, {
        errorMessage: 'Failed to get application version',
        retryable: true,
    });
}
/**
 * Query for checking if app is maximized
 */
function useAppMaximizedState() {
    const queryResult = (0, react_query_1.useQuery)({
        queryKey: [...query_client_1.queryKeys.app.all, 'maximized'],
        queryFn: () => window.electronAPI.app.isMaximized(),
        staleTime: 0, // Always fresh - window state changes frequently
        gcTime: 1000, // Short cache time
        refetchOnWindowFocus: true, // Refetch when window gains focus
    });
    return (0, use_query_state_1.useQueryState)(queryResult, {
        errorMessage: 'Failed to get window state',
        retryable: false,
    });
}
/**
 * Mutation for minimizing the app
 */
function useMinimizeApp() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: () => window.electronAPI.app.minimize(),
        onSuccess: () => {
            // Invalidate window state queries
            queryClient.invalidateQueries({ queryKey: [...query_client_1.queryKeys.app.all, 'maximized'] });
        },
        onError: (error) => {
            console.error('Failed to minimize app:', error);
        },
    });
}
/**
 * Mutation for maximizing the app
 */
function useMaximizeApp() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: () => window.electronAPI.app.maximize(),
        onSuccess: () => {
            // Invalidate window state queries
            queryClient.invalidateQueries({ queryKey: [...query_client_1.queryKeys.app.all, 'maximized'] });
        },
        onError: (error) => {
            console.error('Failed to maximize app:', error);
        },
    });
}
/**
 * Mutation for unmaximizing the app
 */
function useUnmaximizeApp() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return (0, react_query_1.useMutation)({
        mutationFn: () => window.electronAPI.app.unmaximize(),
        onSuccess: () => {
            // Invalidate window state queries
            queryClient.invalidateQueries({ queryKey: [...query_client_1.queryKeys.app.all, 'maximized'] });
        },
        onError: (error) => {
            console.error('Failed to unmaximize app:', error);
        },
    });
}
/**
 * Mutation for closing the app
 */
function useCloseApp() {
    return (0, react_query_1.useMutation)({
        mutationFn: () => window.electronAPI.app.close(),
        onError: (error) => {
            console.error('Failed to close app:', error);
        },
    });
}
/**
 * Mutation for quitting the app
 */
function useQuitApp() {
    return (0, react_query_1.useMutation)({
        mutationFn: () => window.electronAPI.app.quit(),
        onError: (error) => {
            console.error('Failed to quit app:', error);
        },
    });
}
/**
 * Hook for invalidating all app-related queries
 */
function useInvalidateAppQueries() {
    const queryClient = (0, react_query_1.useQueryClient)();
    return {
        invalidateAll: () => query_client_1.invalidateQueries.app(),
        invalidateVersion: () => queryClient.invalidateQueries({ queryKey: query_client_1.queryKeys.app.version() }),
        invalidateWindowState: () => queryClient.invalidateQueries({
            queryKey: [...query_client_1.queryKeys.app.all, 'maximized']
        }),
    };
}
//# sourceMappingURL=use-app-queries.js.map