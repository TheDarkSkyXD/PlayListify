/**
 * Custom hook for handling query states with loading, error, and empty state patterns
 *
 * This hook provides a consistent interface for managing the different states
 * that queries can be in, with proper TypeScript support and error handling.
 */
import { UseQueryResult } from '@tanstack/react-query';
import { QueryError } from '../../shared/types/query-types';
export interface QueryStateResult<T> {
    data: T | undefined;
    isLoading: boolean;
    isInitialLoading: boolean;
    isRefreshing: boolean;
    isFetching: boolean;
    isError: boolean;
    error: QueryError | null;
    errorMessage: string | null;
    canRetry: boolean;
    isEmpty: boolean;
    hasData: boolean;
    isSuccess: boolean;
    isReady: boolean;
    refetch: () => Promise<any>;
    retry: () => Promise<any>;
}
export interface QueryStateOptions<T> {
    emptyCheck?: (data: T | undefined) => boolean;
    emptyMessage?: string;
    errorMessage?: string | ((error: any) => string);
    retryable?: boolean | ((error: any) => boolean);
    showInitialLoading?: boolean;
    minimumLoadingTime?: number;
}
/**
 * Hook for managing query states with consistent patterns
 */
export declare function useQueryState<T>(queryResult: UseQueryResult<T, QueryError>, options?: QueryStateOptions<T>): QueryStateResult<T>;
/**
 * Hook for managing multiple query states
 */
export declare function useMultipleQueryState<T extends Record<string, UseQueryResult<any, QueryError>>>(queries: T, options?: {
    requireAll?: boolean;
    requireAny?: boolean;
}): {
    isLoading: boolean;
    isError: boolean;
    hasData: boolean;
    isReady: boolean;
    errors: Record<keyof T, QueryError | null>;
    refetchAll: () => Promise<any[]>;
};
/**
 * Hook for managing paginated query states
 */
export declare function usePaginatedQueryState<T>(queryResult: UseQueryResult<{
    data: T[];
    hasMore: boolean;
    total: number;
}, QueryError>, options?: QueryStateOptions<{
    data: T[];
    hasMore: boolean;
    total: number;
}>): QueryStateResult<{
    data: T[];
    hasMore: boolean;
    total: number;
}> & {
    items: T[];
    hasMore: boolean;
    total: number;
    isEmpty: boolean;
};
//# sourceMappingURL=use-query-state.d.ts.map