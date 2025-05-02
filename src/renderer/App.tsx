import React, { useEffect } from 'react';
import { useIPC } from './hooks/useIPC';
import { IPC_CHANNELS } from '../shared/constants/ipc-channels';
import { useAppStore } from './store/appStore';
import { router } from './router';
import { AppInfo } from '../shared/types/app';
import { Outlet, RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useDownloadStore, { DownloadProgress, QueueStatus } from './store/downloadStore';
import { DownloadOptionsModal } from './components/Modals/DownloadOptionsModal';
import { ToastProvider } from './hooks/useToast';

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

// Wrapper component that provides all contexts
const App: React.FC = () => {
  // Get download store actions
  const { setDownloadProgress, setDownloadComplete, updateQueueStatus } = useDownloadStore();
  
  // Set up event listeners for download progress and status
  useEffect(() => {
    // Listen for download progress updates
    const removeProgressListener = window.electron.ipcRenderer.on('download:progress', (data: { id: string; progress: DownloadProgress }) => {
      setDownloadProgress(data.id, data.progress);
    });
    
    // Listen for download completion
    const removeCompleteListener = window.electron.ipcRenderer.on('download:complete', (data: { 
      id: string; 
      status: 'completed' | 'failed' | 'cancelled';
      filePath?: string;
      errorMessage?: string;
    }) => {
      setDownloadComplete(data.id, data.status, data.filePath, data.errorMessage);
    });
    
    // Listen for queue status updates
    const removeQueueListener = window.electron.ipcRenderer.on('download:queue-update', (data: QueueStatus) => {
      updateQueueStatus(data);
    });
    
    return () => {
      // Clean up listeners
      removeProgressListener();
      removeCompleteListener();
      removeQueueListener();
    };
  }, [setDownloadProgress, setDownloadComplete, updateQueueStatus]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
        <DownloadOptionsModal />
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App; 