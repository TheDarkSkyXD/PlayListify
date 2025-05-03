import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Toast, ToastProps } from '../../components/ui/Toast';

interface HistoryItem {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  watchedAt: string;
  progress: number;
  durationSeconds: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Create a simple toast implementation since the Toast component doesn't export a toast function
const useToast = () => {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  const toast = (props: Omit<ToastProps, 'open' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2);
    setToasts((prev) => [...prev, { ...props, id, open: true }]);
    
    // Auto remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, props.duration || 5000);
  };

  return {
    toast,
    Toaster: () => (
      <>
        {toasts.map((t) => (
          <Toast 
            key={t.id}
            {...t}
            onClose={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
          />
        ))}
      </>
    ),
  };
};

const HistoryPage = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const { toast, Toaster } = useToast();
  
  // Fetch history data
  const { data: historyItems, isLoading, isError, error, refetch } = useQuery<HistoryItem[]>({
    queryKey: ['history'],
    queryFn: async () => {
      try {
        const response = await window.electron.ipcRenderer.invoke<never, ApiResponse<HistoryItem[]>>('history:get');
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch history');
        }
        return response.data || [];
      } catch (err) {
        console.error('Error fetching history:', err);
        throw err;
      }
    }
  });

  // Format time (seconds) to MM:SS
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString || 'Unknown date';
    }
  };

  // Clear history handler
  const handleClearHistory = async () => {
    try {
      const response = await window.electron.ipcRenderer.invoke<never, ApiResponse<boolean>>('history:clear');
      if (response.success) {
        toast({
          title: 'History cleared',
          description: 'Your watch history has been cleared successfully.',
          variant: 'success'
        });
        refetch();
      } else {
        throw new Error(response.error || 'Failed to clear history');
      }
    } catch (err) {
      console.error('Error clearing history:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear watch history. Please try again.',
      });
    }
  };

  // Handle error states
  useEffect(() => {
    if (isError && error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load watch history. Please try again.',
      });
    }
  }, [isError, error]);

  // Filter history items based on active tab
  const getFilteredItems = () => {
    if (!historyItems || historyItems.length === 0) return [];
    
    // Sort by most recent first
    const sortedItems = [...historyItems].sort((a, b) => 
      new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
    );
    
    if (activeTab === 'all') return sortedItems;
    
    // Filter based on progress
    if (activeTab === 'started') {
      return sortedItems.filter(item => item.progress > 0 && item.progress < 90);
    }
    
    if (activeTab === 'completed') {
      return sortedItems.filter(item => item.progress >= 90);
    }
    
    return sortedItems;
  };

  const filteredItems = getFilteredItems();

  // Render loading skeletons
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Watch History</h1>
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
        </div>

        <div className="h-10 w-60 mb-6 bg-gray-200 animate-pulse rounded"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array(6).fill(0).map((_, index) => (
            <div key={index} className="h-40 w-full rounded-md bg-gray-200 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Toaster />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Watch History</h1>
        <Button 
          variant="outline" 
          onClick={handleClearHistory}
          disabled={!historyItems || historyItems.length === 0}
        >
          Clear History
        </Button>
      </div>

      <div className="w-full">
        <div className="grid w-full max-w-md grid-cols-3 mb-6 border rounded-lg overflow-hidden">
          <button 
            className={`py-2 ${activeTab === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            className={`py-2 ${activeTab === 'started' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}`}
            onClick={() => setActiveTab('started')}
          >
            Started
          </button>
          <button 
            className={`py-2 ${activeTab === 'completed' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
        </div>
        
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-lg mb-2">No watch history found</p>
              <p className="text-muted-foreground">
                {historyItems && historyItems.length > 0 
                  ? 'No videos match the selected filter' 
                  : 'Start watching videos to see your history here'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="border rounded-lg overflow-hidden shadow-sm bg-card hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <img 
                      src={item.thumbnailUrl || '/placeholder-thumbnail.jpg'} 
                      alt={item.title}
                      className="w-full aspect-video object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-thumbnail.jpg';
                      }}
                    />
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${item.progress}%` }} 
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{item.channelTitle}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{formatTime(item.progress * item.durationSeconds / 100)} / {formatTime(item.durationSeconds)}</span>
                      <span>{formatDate(item.watchedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default HistoryPage; 