/**
 * Custom hook for handling query states with loading, error, and empty state patterns
 * 
 * This hook provides a consistent interface for managing the different states
 * that queries can be in, with proper TypeScript support and error handling.
 */

import { useCallback, useMemo } from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { QueryError } from '../../shared/types/query-types';

// State interfaces
export interface QueryStateResult<T> {
  // Data state
  data: T | undefined;
  
  // Loading states
  isLoading: boolean;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  isFetching: boolean;
  
  // Error states
  isError: boolean;
  error: QueryError | null;
  errorMessage: string | null;
  canRetry: boolean;
  
  // Empty states
  isEmpty: boolean;
  hasData: boolean;
  
  // Success states
  isSuccess: boolean;
  isReady: boolean;
  
  // Actions
  refetch: () => Promise<any>;
  retry: () => Promise<any>;
}

export interface QueryStateOptions<T> {
  // Empty state configuration
  emptyCheck?: (data: T | undefined) => boolean;
  emptyMessage?: string;
  
  // Error configuration
  errorMessage?: string | ((error: any) => string);
  retryable?: boolean | ((error: any) => boolean);
  
  // Loading configuration
  showInitialLoading?: boolean;
  minimumLoadingTime?: number;
}

/**
 * Hook for managing query states with consistent patterns
 */
export function useQueryState<T>(
  queryResult: UseQueryResult<T, QueryError>,
  options: QueryStateOptions<T> = {}
): QueryStateResult<T> {
  const {
    emptyCheck = (data) => !data || (Array.isArray(data) && data.length === 0),
    emptyMessage = 'No data available',
    errorMessage,
    retryable = true,
    showInitialLoading = true,
    minimumLoadingTime = 0,
  } = options;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    isSuccess,
    refetch,
    isInitialLoading,
    isRefetching,
  } = queryResult;

  // Determine if data is empty
  const isEmpty = useMemo(() => {
    if (isLoading || isError) return false;
    return emptyCheck(data);
  }, [data, isLoading, isError, emptyCheck]);

  // Determine if we have data
  const hasData = useMemo(() => {
    return isSuccess && !isEmpty;
  }, [isSuccess, isEmpty]);

  // Determine if query is ready (not loading and either has data or is empty)
  const isReady = useMemo(() => {
    return !isLoading && (hasData || isEmpty || isError);
  }, [isLoading, hasData, isEmpty, isError]);

  // Format error message
  const formattedErrorMessage = useMemo(() => {
    if (!isError || !error) return null;
    
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
  const canRetry = useMemo(() => {
    if (!isError) return false;
    
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
  const retry = useCallback(async () => {
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
export function useMultipleQueryState<T extends Record<string, UseQueryResult<any, QueryError>>>(
  queries: T,
  options: {
    requireAll?: boolean; // All queries must succeed
    requireAny?: boolean; // At least one query must succeed
  } = {}
): {
  isLoading: boolean;
  isError: boolean;
  hasData: boolean;
  isReady: boolean;
  errors: Record<keyof T, QueryError | null>;
  refetchAll: () => Promise<any[]>;
} {
  const { requireAll = false, requireAny = false } = options;

  const queryStates = useMemo(() => {
    return Object.entries(queries).reduce((acc, [key, query]) => {
      acc[key as keyof T] = useQueryState(query);
      return acc;
    }, {} as Record<keyof T, QueryStateResult<any>>);
  }, [queries]);

  const isLoading = useMemo(() => {
    return Object.values(queryStates).some(state => state.isLoading);
  }, [queryStates]);

  const isError = useMemo(() => {
    if (requireAll) {
      return Object.values(queryStates).some(state => state.isError);
    }
    if (requireAny) {
      return Object.values(queryStates).every(state => state.isError);
    }
    return Object.values(queryStates).some(state => state.isError);
  }, [queryStates, requireAll, requireAny]);

  const hasData = useMemo(() => {
    if (requireAll) {
      return Object.values(queryStates).every(state => state.hasData);
    }
    if (requireAny) {
      return Object.values(queryStates).some(state => state.hasData);
    }
    return Object.values(queryStates).some(state => state.hasData);
  }, [queryStates, requireAll, requireAny]);

  const isReady = useMemo(() => {
    return Object.values(queryStates).every(state => state.isReady);
  }, [queryStates]);

  const errors = useMemo(() => {
    return Object.entries(queryStates).reduce((acc, [key, state]) => {
      acc[key as keyof T] = state.error;
      return acc;
    }, {} as Record<keyof T, QueryError | null>);
  }, [queryStates]);

  const refetchAll = useCallback(async () => {
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
export function usePaginatedQueryState<T>(
  queryResult: UseQueryResult<{ data: T[]; hasMore: boolean; total: number }, QueryError>,
  options: QueryStateOptions<{ data: T[]; hasMore: boolean; total: number }> = {}
): QueryStateResult<{ data: T[]; hasMore: boolean; total: number }> & {
  items: T[];
  hasMore: boolean;
  total: number;
  isEmpty: boolean;
} {
  const baseState = useQueryState(queryResult, {
    ...options,
    emptyCheck: (data) => !data?.data || data.data.length === 0,
  });

  const items = useMemo(() => {
    return baseState.data?.data || [];
  }, [baseState.data]);

  const hasMore = useMemo(() => {
    return baseState.data?.hasMore || false;
  }, [baseState.data]);

  const total = useMemo(() => {
    return baseState.data?.total || 0;
  }, [baseState.data]);

  const isEmpty = useMemo(() => {
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