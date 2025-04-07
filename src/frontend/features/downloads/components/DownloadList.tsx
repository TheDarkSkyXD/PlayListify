import React, { useState, useEffect } from 'react';
import useDownloadStore from '../../../stores/downloadStore';
import DownloadItem from './DownloadItem';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Button } from '../../../components/ui/button';
import { Trash2, Download } from 'lucide-react';
import { toast } from '../../../components/ui/use-toast';

const DownloadList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');

  // Use a stable reference to the downloads array
  const downloads = useDownloadStore((state) => state.downloads);
  // Memoize the stats to prevent unnecessary re-renders
  const stats = React.useMemo(() => {
    return {
      total: downloads.length,
      downloading: downloads.filter(d => d.status === 'downloading').length,
      pending: downloads.filter(d => d.status === 'pending').length,
      paused: downloads.filter(d => d.status === 'paused').length,
      completed: downloads.filter(d => d.status === 'completed').length,
      failed: downloads.filter(d => d.status === 'failed').length,
      canceled: downloads.filter(d => d.status === 'canceled').length
    };
  }, [downloads]);
  const removeDownload = useDownloadStore((state) => state.removeDownload);
  const clearCompleted = useDownloadStore((state) => state.clearCompleted);

  // Log downloads whenever they change, but only if there are downloads
  // to reduce unnecessary logging
  useEffect(() => {
    // Only log if there are downloads to reduce noise
    if (downloads.length > 0) {
      console.log(`DownloadList: Downloads updated, count: ${downloads.length}`);
      console.log('DownloadList: First few downloads:', downloads.slice(0, Math.min(3, downloads.length)));
    }
  }, [downloads]);

  const handlePause = async (id: string) => {
    try {
      // Use type assertion to access the downloads API
      const api = window.api as any;
      if (api?.downloads?.pause) {
        await api.downloads.pause(id);
        toast({
          title: 'Download Paused',
          description: 'The download has been paused.',
        });
      } else {
        throw new Error('Download API not available');
      }
    } catch (error) {
      console.error('Failed to pause download:', error);
      toast({
        title: 'Error',
        description: 'Failed to pause download.',
        variant: 'destructive',
      });
    }
  };

  const handleResume = async (id: string) => {
    try {
      // Use type assertion to access the downloads API
      const api = window.api as any;
      if (api?.downloads?.resume) {
        await api.downloads.resume(id);
        toast({
          title: 'Download Resumed',
          description: 'The download has been resumed.',
        });
      } else {
        throw new Error('Download API not available');
      }
    } catch (error) {
      console.error('Failed to resume download:', error);
      toast({
        title: 'Error',
        description: 'Failed to resume download.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      // Use type assertion to access the downloads API
      const api = window.api as any;
      if (api?.downloads?.cancel) {
        await api.downloads.cancel(id);
        toast({
          title: 'Download Canceled',
          description: 'The download has been canceled.',
        });
      } else {
        throw new Error('Download API not available');
      }
    } catch (error) {
      console.error('Failed to cancel download:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel download.',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      // Use type assertion to access the downloads API
      const api = window.api as any;
      if (api?.downloads?.remove) {
        await api.downloads.remove(id);
        removeDownload(id);
        toast({
          title: 'Download Removed',
          description: 'The download has been removed from the list.',
        });
      } else {
        // If API is not available, just remove from local state
        removeDownload(id);
        toast({
          title: 'Download Removed',
          description: 'The download has been removed from the list.',
        });
      }
    } catch (error) {
      console.error('Failed to remove download:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove download.',
        variant: 'destructive',
      });
    }
  };

  const handleClearCompleted = () => {
    clearCompleted();
    toast({
      title: 'Completed Downloads Cleared',
      description: 'All completed downloads have been removed from the list.',
    });
  };

  const handleOpenFolder = (path: string) => {
    // Use type assertion to access the shell API
    const api = window.api as any;
    if (api?.shell?.openPath) {
      api.shell.openPath(path);
    } else {
      console.error('Shell API not available');
      toast({
        title: 'Error',
        description: 'Cannot open folder. Shell API not available.',
        variant: 'destructive',
      });
    }
  };

  // Memoize the filtered downloads to prevent unnecessary re-renders
  const filteredDownloads = React.useMemo(() => {
    // Make sure downloads is an array
    const downloadsArray = Array.isArray(downloads) ? downloads : [];

    // Filter out any invalid downloads
    const validDownloads = downloadsArray.filter(d => d && d.id && d.status);

    switch (activeTab) {
      case 'active':
        return validDownloads.filter(d => d.status === 'downloading' || d.status === 'pending');
      case 'paused':
        return validDownloads.filter(d => d.status === 'paused');
      case 'completed':
        return validDownloads.filter(d => d.status === 'completed');
      case 'failed':
        return validDownloads.filter(d => d.status === 'failed' || d.status === 'canceled');
      case 'all':
      default:
        return validDownloads;
    }
  }, [downloads, activeTab]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({stats.downloading + stats.pending})
            </TabsTrigger>
            <TabsTrigger value="paused">
              Paused ({stats.paused})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Failed ({stats.failed + stats.canceled})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'completed' && stats.completed > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCompleted}
            className="ml-2"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Completed
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {filteredDownloads.length > 0 ? (
          filteredDownloads.map(download => (
            <DownloadItem
              key={download.id}
              download={download}
              onPause={handlePause}
              onResume={handleResume}
              onCancel={handleCancel}
              onRemove={handleRemove}
              onOpenFolder={handleOpenFolder}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Download className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Downloads Found</h3>
            <p className="text-muted-foreground max-w-md">
              There are no {activeTab} downloads.
              {activeTab === 'all' && 'Start downloading videos from your playlists to see them here.'}
              {activeTab === 'active' && 'Check the "All" tab to see if you have any completed or failed downloads.'}
              {activeTab === 'completed' && 'Your completed downloads will appear here.'}
              {activeTab === 'failed' && 'Any failed downloads will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadList;
