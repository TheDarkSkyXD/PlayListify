import React from 'react';
import { 
  Router, 
  RouterProvider,
  Route,
  RootRoute,
  Outlet,
  useRouter
} from '@tanstack/react-router';
import { MyPlaylists } from '../pages/MyPlaylists';
import { DownloadsPage } from '../pages/Downloads';

// Root layout component - replaced with proper AppLayout import
import { useEffect } from 'react';
import { useIPC } from '../hooks/useIPC';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import { AppInfo } from '../../shared/types/app';
import { Sidebar } from '../components/Sidebar/Sidebar';
import TopNavbar from '../components/TopNavbar/TopNavbar';

// Placeholder components for routes that don't have an implementation yet
const DownloadsPlaceholder = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Downloads</h1>
    <p className="text-muted-foreground">This feature is coming soon!</p>
  </div>
);

const HistoryPlaceholder = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">History</h1>
    <p className="text-muted-foreground">This feature is coming soon!</p>
  </div>
);

const SettingsPlaceholder = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Settings</h1>
    <p className="text-muted-foreground">This feature is coming soon!</p>
  </div>
);

// Root layout component
const AppLayout = () => {
  const { invoke: getAppInfo, data: appInfo, loading: appInfoLoading } = useIPC<void, AppInfo>(IPC_CHANNELS.APP_INFO);
  const router = useRouter();
  
  useEffect(() => {
    // Get app info on mount
    getAppInfo();
  }, [getAppInfo]);

  const handleNavigate = (path: string) => {
    router.navigate({ to: path });
  };

  const currentPath = router.state.location.pathname;

  return (
    <div className="h-screen flex flex-col">
      {/* Top Navbar */}
      <TopNavbar appVersion={appInfo?.version} />
      
      {/* Main content area with sidebar and outlet */}
      <div className="flex flex-grow overflow-hidden">
        {/* Fixed width sidebar */}
        <aside className="w-64 bg-secondary h-full border-r border-border">
          <Sidebar 
            currentPath={currentPath} 
            onNavigate={handleNavigate} 
          />
        </aside>
        
        {/* Content area */}
        <main className="flex-grow overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground p-2 text-xs text-center">
        <div className="container mx-auto">
          <p>
            PlayListify &copy; {new Date().getFullYear()} - Built with Electron, React, and TanStack Router
          </p>
        </div>
      </footer>
    </div>
  );
};

// Create root route with AppLayout
const rootRoute = new RootRoute({
  component: AppLayout
});

// Define routes
// Home route
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Welcome to PlayListify!</h1>
      <p className="mb-4">Your YouTube playlist manager</p>
      <a 
        href="/playlists" 
        className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
      >
        Go to My Playlists
      </a>
    </div>
  ),
});

// Playlists route
const playlistsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/playlists',
  component: MyPlaylists
});

// Downloads route
const downloadsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/downloads',
  component: DownloadsPage
});

// History route
const historyRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: HistoryPlaceholder
});

// Settings route
const settingsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPlaceholder
});

// Register routes
const routeTree = rootRoute.addChildren([
  indexRoute,
  playlistsRoute,
  downloadsRoute,
  historyRoute,
  settingsRoute
]);

// Create router
export const router = new Router({
  routeTree,
  defaultPreload: 'intent',
});

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
} 