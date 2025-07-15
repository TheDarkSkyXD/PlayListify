/**
 * Query State Handler Components
 *
 * These components provide consistent UI patterns for handling different
 * query states (loading, error, empty) throughout the application.
 */
import React from 'react';
import { QueryStateResult } from '../../hooks/use-query-state';
export interface LoadingStateProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'spinner' | 'skeleton' | 'pulse';
    className?: string;
}
export interface ErrorStateProps {
    error: Error | null;
    message?: string;
    canRetry?: boolean;
    onRetry?: () => void;
    variant?: 'alert' | 'card' | 'inline';
    className?: string;
}
export interface EmptyStateProps {
    title?: string;
    message?: string;
    icon?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
    variant?: 'card' | 'inline';
    className?: string;
}
export interface QueryStateHandlerProps<T> {
    queryState: QueryStateResult<T>;
    children: (data: T) => React.ReactNode;
    loadingComponent?: React.ReactNode;
    errorComponent?: React.ReactNode;
    emptyComponent?: React.ReactNode;
    loadingProps?: LoadingStateProps;
    errorProps?: Omit<ErrorStateProps, 'error' | 'canRetry' | 'onRetry'>;
    emptyProps?: EmptyStateProps;
}
/**
 * Loading State Component
 */
export declare const LoadingState: React.FC<LoadingStateProps>;
/**
 * Error State Component
 */
export declare const ErrorState: React.FC<ErrorStateProps>;
/**
 * Empty State Component
 */
export declare const EmptyState: React.FC<EmptyStateProps>;
/**
 * Query State Handler Component
 *
 * This component handles all query states and renders the appropriate UI
 */
export declare function QueryStateHandler<T>({ queryState, children, loadingComponent, errorComponent, emptyComponent, loadingProps, errorProps, emptyProps, }: QueryStateHandlerProps<T>): React.ReactElement;
/**
 * Simplified Query State Handler for common use cases
 */
export interface SimpleQueryStateHandlerProps<T> {
    isLoading: boolean;
    isError: boolean;
    error?: Error | null;
    data?: T;
    isEmpty?: boolean;
    children: (data: T) => React.ReactNode;
    onRetry?: () => void;
}
export declare function SimpleQueryStateHandler<T>({ isLoading, isError, error, data, isEmpty, children, onRetry, }: SimpleQueryStateHandlerProps<T>): React.ReactElement;
//# sourceMappingURL=QueryStateHandler.d.ts.map