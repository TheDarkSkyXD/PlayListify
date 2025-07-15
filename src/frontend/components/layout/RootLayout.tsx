import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { Navigation } from './Navigation';
import { ErrorBoundary } from '../common/ErrorBoundary';

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};