import React from 'react';
import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { Dashboard } from '../pages/Dashboard';
import { Settings } from '../pages/Settings';
import { Playlists } from '../pages/MyPlaylists';
import { NotFound } from '../pages/NotFound';
import { RootLayout } from '../components/layout/RootLayout';

// Root route with layout
const rootRoute = createRootRoute({
  component: RootLayout,
});

// Dashboard route (home page)
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

// Settings route
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: Settings,
});

// Playlists route (for future implementation)
const playlistsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/playlists',
  component: Playlists,
});

// Individual playlist route (for future implementation)
const playlistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/playlists/$playlistId',
  component: () => {
    return React.createElement('div', null, 'Playlist Detail (Coming Soon)');
  },
});

// Catch-all route for 404 errors
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFound,
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  dashboardRoute,
  settingsRoute,
  playlistsRoute,
  playlistRoute,
  notFoundRoute,
]);

// Create and export the router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export type Router = typeof router;