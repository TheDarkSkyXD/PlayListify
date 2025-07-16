import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './frontend/lib/router';
import { queryClient } from './frontend/lib/query-client';
import { ErrorBoundary } from './frontend/components/common/ErrorBoundary';
import { ErrorNotificationManager } from './frontend/components/common/ErrorNotification';
import './styles/globals.css';

export const App: React.FC = () => {
  return (
    <ErrorBoundary
      maxRetries={3}
      autoRecover={false}
      onError={(error, errorInfo) => {
        console.error('App Error Boundary caught error:', error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ErrorNotificationManager />
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
};