import React, { useEffect } from 'react';
import { useIPC } from './hooks/useIPC';
import { IPC_CHANNELS } from '../shared/constants/ipc-channels';
import { useAppStore } from './store/appStore';
import { router } from './router';
import { AppInfo } from '../shared/types/app';
import { Outlet, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Main App component with layout
const AppLayout: React.FC = () => {
  const { invoke: getAppInfo, data: appInfo, loading: appInfoLoading } = useIPC<void, AppInfo>(IPC_CHANNELS.APP_INFO);
  
  useEffect(() => {
    // Get app info on mount
    getAppInfo();
  }, [getAppInfo]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 shadow">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">PlayListify</h1>
            {appInfo && (
              <span className="ml-2 text-xs opacity-70">v{appInfo.version}</span>
            )}
          </div>
          {appInfo && (
            <div className="text-xs opacity-70">
              {appInfo.platform} ({appInfo.arch})
            </div>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow overflow-hidden">
        <Outlet />
      </main>
      
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

// Wrapper component that provides all contexts
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App; 