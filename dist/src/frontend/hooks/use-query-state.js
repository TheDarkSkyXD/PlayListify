"use strict";
/**
 * Custom hook for handling query states with loading, error, and empty state patterns
 *
 * This hook provides a consistent interface for managing the different states
 * that queries can be in, with proper TypeScript support and error handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useQueryState = useQueryState;
exports.useMultipleQueryState = useMultipleQueryState;
exports.usePaginatedQueryState = usePaginatedQueryState;
const react_1 = require("react");
/**
 * Hook for managing query states with consistent patterns
 */
function useQueryState(queryResult, options = {}) {
    const { emptyCheck = (data) => !data || (Array.isArray(data) && data.length === 0), emptyMessage = 'No data available', errorMessage, retryable = true, showInitialLoading = true, minimumLoadingTime = 0, } = options;
    const { data, isLoading, isFetching, isError, error, isSuccess, refetch, isInitialLoading, isRefetching, } = queryResult;
    // Determine if data is empty
    const isEmpty = (0, react_1.useMemo)(() => {
        if (isLoading || isError)
            return false;
        return emptyCheck(data);
    }, [data, isLoading, isError, emptyCheck]);
    // Determine if we have data
    const hasData = (0, react_1.useMemo)(() => {
        return isSuccess && !isEmpty;
    }, [isSuccess, isEmpty]);
    // Determine if query is ready (not loading and either has data or is empty)
    const isReady = (0, react_1.useMemo)(() => {
        return !isLoading && (hasData || isEmpty || isError);
    }, [isLoading, hasData, isEmpty, isError]);
    // Format error message
    const formattedErrorMessage = (0, react_1.useMemo)(() => {
        if (!isError || !error)
            return null;
        if (typeof errorMessage === 'function') {
            return errorMessage(error);
        }
        if (typeof errorMessage === 'string') {
            return errorMessage;
        }
        // Default error message formatting
        if (error.message) {
            return error.message;
        }
        if (error.status) {
            return `Request failed with status ${error.status}`;
        }
        return 'An unexpected error occurred';
    }, [isError, error, errorMessage]);
    // Determine if error is retryable
    const canRetry = (0, react_1.useMemo)(() => {
        if (!isError)
            return false;
        if (typeof retryable === 'function') {
            return retryable(error);
        }
        if (typeof retryable === 'boolean') {
            return retryable;
        }
        // Default retry logic - don't retry 4xx errors
        if (error?.status && error.status >= 400 && error.status < 500) {
            return false;
        }
        return true;
    }, [isError, error, retryable]);
    // Retry function
    const retry = (0, react_1.useCallback)(async () => {
        if (canRetry) {
            return refetch();
        }
        return Promise.reject(new Error('Retry not available for this error'));
    }, [canRetry, refetch]);
    return {
        // Data state
        data,
        // Loading states
        isLoading: showInitialLoading ? isLoading : isFetching,
        isInitialLoading: showInitialLoading ? isInitialLoading : false,
        isRefreshing: isRefetching,
        isFetching,
        // Error states
        isError,
        error,
        errorMessage: formattedErrorMessage,
        canRetry,
        // Empty states
        isEmpty,
        hasData,
        // Success states
        isSuccess,
        isReady,
        // Actions
        refetch,
        retry,
    };
}
/**
 * Hook for managing multiple query states
 */
function useMultipleQueryState(queries, options = {}) {
    const { requireAll = false, requireAny = false } = options;
    const queryStates = (0, react_1.useMemo)(() => {
        return Object.entries(queries).reduce((acc, [key, query]) => {
            acc[key] = useQueryState(query);
            return acc;
        }, {});
    }, [queries]);
    const isLoading = (0, react_1.useMemo)(() => {
        return Object.values(queryStates).some(state => state.isLoading);
    }, [queryStates]);
    const isError = (0, react_1.useMemo)(() => {
        if (requireAll) {
            return Object.values(queryStates).some(state => state.isError);
        }
        if (requireAny) {
            return Object.values(queryStates).every(state => state.isError);
        }
        return Object.values(queryStates).some(state => state.isError);
    }, [queryStates, requireAll, requireAny]);
    const hasData = (0, react_1.useMemo)(() => {
        if (requireAll) {
            return Object.values(queryStates).every(state => state.hasData);
        }
        if (requireAny) {
            return Object.values(queryStates).some(state => state.hasData);
        }
        return Object.values(queryStates).some(state => state.hasData);
    }, [queryStates, requireAll, requireAny]);
    const isReady = (0, react_1.useMemo)(() => {
        return Object.values(queryStates).every(state => state.isReady);
    }, [queryStates]);
    const errors = (0, react_1.useMemo)(() => {
        return Object.entries(queryStates).reduce((acc, [key, state]) => {
            acc[key] = state.error;
            return acc;
        }, {});
    }, [queryStates]);
    const refetchAll = (0, react_1.useCallback)(async () => {
        const refetchPromises = Object.values(queryStates).map(state => state.refetch());
        return Promise.all(refetchPromises);
    }, [queryStates]);
    return {
        isLoading,
        isError,
        hasData,
        isReady,
        errors,
        refetchAll,
    };
}
/**
 * Hook for managing paginated query states
 */
function usePaginatedQueryState(queryResult, options = {}) {
    const baseState = useQueryState(queryResult, {
        ...options,
        emptyCheck: (data) => !data?.data || data.data.length === 0,
    });
    const items = (0, react_1.useMemo)(() => {
        return baseState.data?.data || [];
    }, [baseState.data]);
    const hasMore = (0, react_1.useMemo)(() => {
        return baseState.data?.hasMore || false;
    }, [baseState.data]);
    const total = (0, react_1.useMemo)(() => {
        return baseState.data?.total || 0;
    }, [baseState.data]);
    const isEmpty = (0, react_1.useMemo)(() => {
        return items.length === 0 && !baseState.isLoading;
    }, [items.length, baseState.isLoading]);
    return {
        ...baseState,
        items,
        hasMore,
        total,
        isEmpty,
    };
}
//# sourceMappingURL=use-query-state.js.map