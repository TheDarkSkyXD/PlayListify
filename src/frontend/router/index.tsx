import React from 'react';
import {
  Outlet,
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
} from '@tanstack/react-router';
import { AppLayout } from '../components/Layout/AppLayout';

// Import actual page components
import DashboardPage from '../pages/Dashboard/Dashboard';
import SettingsPage from '../pages/Settings/Settings';
import MyPlaylistsPage from '../pages/MyPlaylists/MyPlaylists';
import DownloadsPage from '../pages/Downloads/Downloads';
import HistoryPage from '../pages/History/History';

// Create a root route that renders AppLayout
const rootRoute = createRootRoute({
  component: AppLayout,
});

// Create specific routes as children of the root route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const playlistsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/playlists',
  component: MyPlaylistsPage,
});

const downloadsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/downloads',
  component: DownloadsPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryPage,
});

// Catch-all for undefined routes (optional, redirects to dashboard)
const catchAllRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '*',
    component: DashboardPage, // Redirect to Dashboard or a 404 component
});


// Combine routes into a route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  settingsRoute,
  playlistsRoute,
  downloadsRoute,
  historyRoute,
  catchAllRoute, // Add catch-all last
]);

// Create the router instance
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent', // Preload routes on hover/focus
});

// Declare module augmentation for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
} 