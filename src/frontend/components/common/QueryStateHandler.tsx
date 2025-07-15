/**
 * Query State Handler Components
 * 
 * These components provide consistent UI patterns for handling different
 * query states (loading, error, empty) throughout the application.
 */

import React from 'react';
import { AlertCircle, RefreshCw, Loader2, Search, Database } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { QueryStateResult } from '../../hooks/use-query-state';

// Loading component props
export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'skeleton' | 'pulse';
  className?: string;
}

// Error component props
export interface ErrorStateProps {
  error: Error | null;
  message?: string;
  canRetry?: boolean;
  onRetry?: () => void;
  variant?: 'alert' | 'card' | 'inline';
  className?: string;
}

// Empty component props
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

// Query state handler props
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
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  variant = 'spinner',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const containerClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  if (variant === 'skeleton') {
    return (
      <div className={`space-y-3 ${containerClasses[size]} ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`animate-pulse ${containerClasses[size]} ${className}`}>
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} text-primary mb-2`} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

/**
 * Error State Component
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  message,
  canRetry = false,
  onRetry,
  variant = 'alert',
  className = '',
}) => {
  const errorMessage = message || error?.message || 'An unexpected error occurred';

  if (variant === 'card') {
    return (
      <Card className={`border-destructive/50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error
          </CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        {canRetry && onRetry && (
          <CardContent>
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-destructive ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{errorMessage}</span>
        {canRetry && onRetry && (
          <Button onClick={onRetry} variant="ghost" size="sm">
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{errorMessage}</span>
        {canRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

/**
 * Empty State Component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  message = 'There is no data to display at the moment.',
  icon,
  action,
  variant = 'card',
  className = '',
}) => {
  const defaultIcon = <Database className="h-12 w-12 text-muted-foreground" />;

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        {icon || <Search className="h-4 w-4" />}
        <span className="text-sm">{message}</span>
        {action && (
          <Button onClick={action.onClick} variant="ghost" size="sm">
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4">
          {icon || defaultIcon}
        </div>
        <CardTitle className="mb-2 text-lg">{title}</CardTitle>
        <CardDescription className="mb-4 max-w-sm">
          {message}
        </CardDescription>
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Query State Handler Component
 * 
 * This component handles all query states and renders the appropriate UI
 */
export function QueryStateHandler<T>({
  queryState,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  loadingProps = {},
  errorProps = {},
  emptyProps = {},
}: QueryStateHandlerProps<T>): React.ReactElement {
  // Show loading state
  if (queryState.isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return <LoadingState {...loadingProps} />;
  }

  // Show error state
  if (queryState.isError) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    return (
      <ErrorState
        error={queryState.error}
        message={queryState.errorMessage || undefined}
        canRetry={queryState.canRetry}
        onRetry={queryState.retry}
        {...errorProps}
      />
    );
  }

  // Show empty state
  if (queryState.isEmpty) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }
    return <EmptyState {...emptyProps} />;
  }

  // Show data
  if (queryState.hasData && queryState.data) {
    return <>{children(queryState.data)}</>;
  }

  // Fallback to loading state
  return <LoadingState {...loadingProps} />;
}

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

export function SimpleQueryStateHandler<T>({
  isLoading,
  isError,
  error,
  data,
  isEmpty = false,
  children,
  onRetry,
}: SimpleQueryStateHandlerProps<T>): React.ReactElement {
  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <ErrorState
        error={error || null}
        canRetry={!!onRetry}
        onRetry={onRetry}
      />
    );
  }

  if (isEmpty || !data) {
    return <EmptyState />;
  }

  return <>{children(data)}</>;
}