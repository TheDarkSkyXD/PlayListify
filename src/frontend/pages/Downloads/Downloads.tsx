import React, { useState } from 'react';
import useDownloadStore, { DownloadItem, QueueStatus } from '../../store/downloadStore';
import { useDownloadQueueStatus, useCancelDownload, useRetryDownload, useClearDownloads } from '../../hooks/useDownloadQueries';
import { Trash, RefreshCw, XCircle, RotateCw, Play, Folder } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';

type DownloadFilter = 'all' | 'active' | 'completed' | 'failed';

export const DownloadsPage: React.FC = () => {
  const { downloads } = useDownloadStore();
  const [filter, setFilter] = useState<DownloadFilter>('all');
  const { toast } = useToast();
  
  // Get queue status
  const { data: queueStatus, isLoading: isLoadingQueue, refetch: refetchQueueStatus } = useDownloadQueueStatus();
  
  // Mutations
  const cancelDownload = useCancelDownload();
  const retryDownload = useRetryDownload();
  const clearDownloads = useClearDownloads();
  
  // Filter downloads based on selected filter
  const filteredDownloads = Object.values(downloads).filter(download => {
    switch (filter) {
      case 'active':
        return ['queued', 'downloading'].includes(download.status);
      case 'completed':
        return download.status === 'completed';
      case 'failed':
        return download.status === 'failed';
      default:
        return true;
    }
  }).sort((a, b) => {
    // Sort by status (downloading first, then queued, then completed, then failed)
    const statusOrder: Record<string, number> = { 
      downloading: 0, 
      queued: 1, 
      completed: 2, 
      failed: 3,
      cancelled: 4 
    };
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
  });
  
  // Handle actions
  const handleCancel = (id: string) => {
    cancelDownload.mutate(id);
  };
  
  const handleRetry = (id: string) => {
    retryDownload.mutate(id);
  };
  
  const handleClearCompleted = () => {
    clearDownloads.mutate();
  };

  const handleRefresh = () => {
    refetchQueueStatus();
  };
  
  // New function to open a file in the default player
  const handlePlayFile = async (filePath: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('file:open', { filePath });
      if (!result || (result && typeof result === 'object' && 'success' in result && !result.success)) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to open file: ${result && typeof result === 'object' && 'error' in result ? result.error : 'Unknown error'}`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while trying to open the file',
      });
    }
  };
  
  // New function to open the file location in the explorer/finder
  const handleOpenFolder = async (filePath: string) => {
    try {
      const result = await window.electron.ipcRenderer.invoke('file:show-in-folder', { filePath });
      if (!result || (result && typeof result === 'object' && 'success' in result && !result.success)) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to show file in folder: ${result && typeof result === 'object' && 'error' in result ? result.error : 'Unknown error'}`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while trying to open the folder',
      });
    }
  };
  
  // Render download progress bar
  const renderProgressBar = (progress: number) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div 
        className="bg-primary h-2.5 rounded-full" 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
  
  // Render download item
  const renderDownloadItem = (download: DownloadItem) => (
    <div 
      key={download.id}
      className="border rounded-md p-4 mb-4 bg-card"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium truncate pr-4">{download.title}</h3>
        
        <div className="flex space-x-2">
          {download.status === 'downloading' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleCancel(download.id)}
              title="Cancel Download"
            >
              <XCircle className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          )}
          
          {download.status === 'failed' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleRetry(download.id)}
              title="Retry Download"
              disabled={retryDownload.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${retryDownload.isPending ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Retry</span>
            </Button>
          )}
          
          {download.status === 'completed' && download.filePath && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handlePlayFile(download.filePath as string)}
                title="Play Video"
              >
                <Play className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Play</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleOpenFolder(download.filePath as string)}
                title="Open Folder"
              >
                <Folder className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Folder</span>
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <span 
          className={`text-sm ${
            download.status === 'completed' 
              ? 'text-green-500' 
              : download.status === 'failed'
                ? 'text-red-500'
                : download.status === 'queued'
                  ? 'text-amber-500'
                  : 'text-primary'
          }`}
        >
          {download.status === 'downloading' 
            ? `Downloading (${Math.round(download.progress)}%)` 
            : download.status === 'completed'
              ? 'Completed'
              : download.status === 'queued'
                ? 'Queued'
                : 'Failed'}
        </span>
        
        {download.status === 'failed' && download.errorMessage && (
          <span className="text-xs text-red-500">
            {download.errorMessage}
          </span>
        )}
      </div>
      
      {download.status === 'downloading' && (
        renderProgressBar(download.progress)
      )}
      
      {download.status === 'completed' && download.filePath && (
        <div className="mt-2 text-xs text-muted-foreground truncate">
          Saved to: <button 
            onClick={() => handleOpenFolder(download.filePath as string)}
            className="hover:underline hover:text-primary focus:outline-none"
            title="Open Folder"
          >
            {download.filePath}
          </button>
        </div>
      )}
    </div>
  );
  
  // Render queue status
  const renderQueueStatus = () => {
    if (isLoadingQueue) {
      return (
        <div className="bg-card p-4 rounded-md mb-6 animate-pulse">
          <h3 className="font-medium mb-2">Loading queue status...</h3>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-8 w-8 bg-muted rounded-full mx-auto"></div>
                <div className="h-4 w-16 bg-muted rounded mx-auto mt-2"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (!queueStatus) return null;
    
    const safeQueueStatus: QueueStatus = queueStatus as QueueStatus;
    
    return (
      <div className="bg-card p-4 rounded-md mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Download Queue Status</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoadingQueue}
            title="Refresh"
          >
            <RotateCw className={`h-4 w-4 ${isLoadingQueue ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{safeQueueStatus.active || 0}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-500">{safeQueueStatus.pending || 0}</div>
            <div className="text-sm text-muted-foreground">Queued</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{safeQueueStatus.completed || 0}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{safeQueueStatus.failed || 0}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center py-12 bg-card rounded-md">
      <svg
        className="mx-auto h-12 w-12 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No downloads</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {filter === 'all'
          ? 'Start downloading videos to see them here.'
          : filter === 'active'
            ? 'No active downloads.'
            : filter === 'completed'
              ? 'No completed downloads.'
              : 'No failed downloads.'}
      </p>
    </div>
  );
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl font-bold">Downloads</h1>
        
        <div className="flex space-x-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoadingQueue}
          >
            <RotateCw className={`h-4 w-4 mr-1 ${isLoadingQueue ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearCompleted}
            disabled={!Object.values(downloads).some(d => ['completed', 'failed'].includes(d.status)) || clearDownloads.isPending}
          >
            <Trash className="h-4 w-4 mr-1" />
            Clear Completed
          </Button>
        </div>
      </div>
      
      {renderQueueStatus()}
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
          <Button
            variant={filter === 'failed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('failed')}
          >
            Failed
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredDownloads.length > 0 
          ? filteredDownloads.map(renderDownloadItem)
          : renderEmptyState()
        }
      </div>
    </div>
  );
}; 