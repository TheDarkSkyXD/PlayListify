import { RootRoute, Route, Router, createHashHistory } from '@tanstack/react-router'; // Added createHashHistory
import AppLayout from '../components/Layout/AppLayout';
import DashboardPage from '../pages/Dashboard/Dashboard'; // Added import
import SettingsPage from '../pages/Settings/Settings'; // Added import
import MyPlaylistsLayout from '../pages/MyPlaylists/MyPlaylists'; // Added import
import UserPlaylistsPage from '../pages/MyPlaylists/UserPlaylistsPage'; // Added import
import PlaylistDetailsPage from '../pages/MyPlaylists/PlaylistDetails'; // Added import
import DownloadsPage from '../pages/Downloads/Downloads'; // Added import
import HistoryPage from '../pages/History/History'; // Added import
import NotFoundPage from '../pages/NotFound/NotFoundPage'; // Import NotFoundPage

// Placeholder components for routes
// const DashboardComponent = () => <div>Dashboard Page</div>; // Commented out
// const PlaylistsComponent = () => <div>Playlists Page</div>; // Commented out
// const SettingsComponent = () => <div>Settings Page</div>; // Commented out

// Create a root route
const rootRoute = new RootRoute({
  component: AppLayout, // Use AppLayout to render Sidenav, Topnav, and Outlet
});

// Create route for Dashboard
const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage, // Updated component
});

// Create route for Playlists
const playlistsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/my-playlists', // Updated path
  component: MyPlaylistsLayout, // Updated component
});

// Create index route for MyPlaylists
const userPlaylistsIndexRoute = new Route({
  getParentRoute: () => playlistsRoute,
  path: '/',
  component: UserPlaylistsPage,
});

// Create route for Playlist Details
const playlistDetailsRoute = new Route({
  getParentRoute: () => playlistsRoute,
  path: '/$playlistId',
  parseParams: (params: { playlistId: string }) => ({
    playlistId: params.playlistId,
  }),
  stringifyParams: ({ playlistId }) => ({ playlistId: String(playlistId) }),
  component: PlaylistDetailsPage,
});

// Create route for Settings
const settingsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage, // Updated component
});

// Create route for Downloads
const downloadsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/downloads',
  component: DownloadsPage,
});

// Create route for History
const historyRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryPage,
});

// Create a not found route
const notFoundRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '*', // This will be handled by notFoundComponent in Router options
  component: NotFoundPage,
});

// Create the route tree
const routeTree = rootRoute.addChildren([
  dashboardRoute,
  playlistsRoute.addChildren([userPlaylistsIndexRoute, playlistDetailsRoute]), // Added child routes
  settingsRoute,
  downloadsRoute, // Added route
  historyRoute, // Added route
  notFoundRoute, // Add the notFoundRoute to the tree
]);

// Create the router instance
export const router = new Router({
  routeTree,
  history: createHashHistory(), // Explicitly use hash history
  // The notFoundRoute in the tree will handle unmatched paths
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}