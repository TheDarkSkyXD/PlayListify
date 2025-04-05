import { createRouter, Route, RootRoute, Outlet, redirect } from '@tanstack/react-router';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import SettingsPage from '../features/settings/pages/SettingsPage';
import PlaylistViewPage from '../features/playlists/pages/PlaylistViewPage';
import DownloadsPage from '../features/downloads/pages/DownloadsPage';
import HistoryPage from '../features/history/pages/HistoryPage';
import PlaylistsPage from '../features/playlists/pages/PlaylistsPage';
import React from 'react';

// Create a root route with a component
const rootRoute = new RootRoute({
  component: () =>
    React.createElement('div',
      { className: 'min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white' },
      React.createElement(Outlet, null)
    )
});

// Create route definitions
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

const playlistsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/playlists',
  component: PlaylistsPage,
});

const downloadsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/downloads',
  component: DownloadsPage,
});

const historyRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryPage,
});

// Catch-all route to redirect to home
const catchAllRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '*',
  beforeLoad: () => {
    throw redirect({
      to: '/',
      replace: true
    });
  },
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  settingsRoute,
  playlistRoute,
  playlistsRoute,
  downloadsRoute,
  historyRoute,
  catchAllRoute,
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