import React from 'react';
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import App from '../App';

// Root route
const rootRoute = createRootRoute({
  component: App,
});

// Home route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <div className="p-4">Welcome to PlayListify!</div>
  ),
});

// Create and export the router
const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
} 