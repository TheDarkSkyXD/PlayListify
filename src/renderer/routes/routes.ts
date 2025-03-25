import { createRouter, Route, RootRoute } from '@tanstack/react-router';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import PlaylistViewPage from '../pages/PlaylistView/PlaylistViewPage';
import React from 'react';

// Create route definitions
const rootRoute = new RootRoute();

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const settingsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const playlistRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/playlist/$playlistId',
  component: PlaylistViewPage,
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  settingsRoute,
  playlistRoute,
]);

// Create and export the router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  // Disable features that might cause issues in Electron
  defaultPendingComponent: () => React.createElement('div', null, 'Loading...'),
  defaultPendingMs: 1000,
  defaultPendingMinMs: 0,
});

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
} 