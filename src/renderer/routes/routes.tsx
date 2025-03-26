import React from 'react';
import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import PlaylistViewPage from '../pages/PlaylistView/PlaylistViewPage';

interface PlaylistParams {
  id: string;
}

export const rootRoute = createRootRoute({
  component: () => (
    <div className="container mx-auto px-4 py-8">
      <Outlet />
    </div>
  ),
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

export const playlistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/playlist/:id',
  component: PlaylistViewPage,
  validateSearch: (search: Record<string, unknown>) => {
    return search;
  },
  parseParams: (params: Record<string, string>): PlaylistParams => ({
    id: params.id,
  }),
}); 