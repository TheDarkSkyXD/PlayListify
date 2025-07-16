// src/frontend/components/providers/QueryProvider.tsx

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '../../lib/react-query-config';

interface QueryProviderProps {
  children: ReactNode;
}

interface QueryErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Error fallback component for query errors
 */
const QueryErrorFallback: React.FC<QueryErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-lg'>
        <div className='mb-4 flex items-center'>
          <div className='flex-shrink-0'>
            <svg
              className='h-8 w-8 text-red-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <h3 className='text-lg font-medium text-gray-900'>
              Something went wrong
            </h3>
          </div>
        </div>

        <div className='mb-4'>
          <p className='mb-2 text-sm text-gray-600'>
            An unexpected error occurred while loading the application.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <details className='mt-2'>
              <summary className='cursor-pointer text-sm text-gray-500 hover:text-gray-700'>
                Error details (development only)
              </summary>
              <pre className='mt-2 max-h-32 overflow-auto rounded bg-red-50 p-2 text-xs text-red-600'>
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>

        <div className='flex space-x-3'>
          <button
            onClick={resetErrorBoundary}
            className='flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          >
            Try again
          </button>

          <button
            onClick={() => window.location.reload()}
            className='flex-1 rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
          >
            Reload page
          </button>
        </div>

        <div className='mt-4 text-center text-xs text-gray-500'>
          If this problem persists, please contact support.
        </div>
      </div>
    </div>
  );
};

/**
 * Loading fallback component
 */
const LoadingFallback: React.FC = () => {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
        <p className='text-gray-600'>Loading application...</p>
      </div>
    </div>
  );
};

/**
 * Query provider component that wraps the app with React Query
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={QueryErrorFallback}
      onError={(error, errorInfo) => {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Query Provider Error:', error);
          console.error('Error Info:', errorInfo);
        }

        // In production, you might want to send this to an error reporting service
        // Example: Sentry.captureException(error, { extra: errorInfo });
      }}
      onReset={() => {
        // Clear query cache on reset
        queryClient.clear();
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<LoadingFallback />}>{children}</Suspense>

        {/* Toast notifications */}
        <Toaster
          position='top-right'
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* React Query Devtools (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools
            initialIsOpen={false}
            position='bottom-right'
            toggleButtonProps={{
              style: {
                marginLeft: '5px',
                transform: 'scale(0.8)',
                transformOrigin: 'bottom right',
              },
            }}
          />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

/**
 * Hook to access query client
 */
export const useQueryClient = () => {
  return queryClient;
};

/**
 * Hook to get query cache statistics
 */
export const useQueryCacheStats = () => {
  const [stats, setStats] = React.useState(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'loading').length,
    };
  });

  React.useEffect(() => {
    const updateStats = () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();

      setStats({
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
        staleQueries: queries.filter(q => q.isStale()).length,
        errorQueries: queries.filter(q => q.state.status === 'error').length,
        loadingQueries: queries.filter(q => q.state.status === 'loading')
          .length,
      });
    };

    // Update stats periodically
    const interval = setInterval(updateStats, 1000);

    // Update stats on cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe(updateStats);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  return stats;
};

/**
 * Development component to display query cache stats
 */
export const QueryCacheDebugger: React.FC = () => {
  const stats = useQueryCacheStats();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className='fixed bottom-4 left-4 rounded bg-black bg-opacity-75 p-2 font-mono text-xs text-white'>
      <div>Queries: {stats.totalQueries}</div>
      <div>Active: {stats.activeQueries}</div>
      <div>Stale: {stats.staleQueries}</div>
      <div>Error: {stats.errorQueries}</div>
      <div>Loading: {stats.loadingQueries}</div>
    </div>
  );
};

export default QueryProvider;
