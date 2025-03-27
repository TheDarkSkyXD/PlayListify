import { toast } from '../components/ui/use-toast';

// Types for import progress tracking
export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  downloaded: boolean;
  addedAt: string;
  status: 'available' | 'downloading' | 'downloaded' | 'error';
}

export interface ImportResult {
  videos: Video[];
}

export interface ImportJob {
  id: string;
  url: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  progress: number;
  totalVideos: number;
  name?: string;
  error?: string;
}

// Event emitter for import progress
class ImportEventEmitter {
  private listeners: ((jobs: Record<string, ImportJob>) => void)[] = [];
  private activeJobs: Record<string, ImportJob> = {};

  public subscribe(callback: (jobs: Record<string, ImportJob>) => void) {
    this.listeners.push(callback);
    callback({ ...this.activeJobs });
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  public updateJob(jobId: string, updates: Partial<ImportJob>) {
    this.activeJobs[jobId] = {
      ...this.activeJobs[jobId],
      ...updates
    };
    this.notifyListeners();
  }

  public removeJob(jobId: string) {
    delete this.activeJobs[jobId];
    this.notifyListeners();
  }

  private notifyListeners() {
    const jobsCopy = { ...this.activeJobs };
    this.listeners.forEach(listener => listener(jobsCopy));
  }
}

const importEvents = new ImportEventEmitter();

// Generate a unique ID for import jobs
function generateJobId(): string {
  return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Main import service functions
export const importService = {
  // Subscribe to import job updates
  subscribeToImports: (callback: (jobs: Record<string, ImportJob>) => void) => {
    return importEvents.subscribe(callback);
  },
  
  // Import a YouTube playlist
  importYoutubePlaylist: async (url: string, name: string) => {
    const jobId = generateJobId();
    
    // Add job to tracking
    importEvents.updateJob(jobId, {
      id: jobId,
      url,
      name,
      status: 'loading',
      progress: 0,
      totalVideos: 0
    });

    try {
      // Show initial notification
      toast({
        title: 'Import started',
        description: `Started importing playlist "${name}"`,
      });

      // Get playlist info and videos
      const playlistInfo = await window.api.youtube.getPlaylistInfo(url);
      const videos = await window.api.youtube.getPlaylistVideos(url);

      // Create the playlist
      const playlist = await window.api.playlists.create(name, playlistInfo.description);

      // Add videos to the playlist
      for (const video of videos) {
        await window.api.playlists.addVideo(playlist.id, video.url);
      }
      
      // Mark job as completed
      importEvents.updateJob(jobId, {
        status: 'success',
        progress: videos.length,
        totalVideos: videos.length
      });
      
      // Show success notification
      toast({
        title: 'Import completed',
        description: `Successfully imported ${videos.length} videos from "${name}"`,
      });
      
      // Remove job after a delay
      setTimeout(() => {
        importEvents.removeJob(jobId);
      }, 5000);
      
      return { videos };
    } catch (error: any) {
      // Update job with error
      importEvents.updateJob(jobId, {
        status: 'error',
        error: error.message || 'Unknown error occurred'
      });
      
      // Show error notification
      toast({
        title: 'Import failed',
        description: error.message || 'Failed to import playlist',
        variant: 'destructive'
      });
      
      // Remove job after a delay
      setTimeout(() => {
        importEvents.removeJob(jobId);
      }, 10000);
      
      throw error;
    }
  }
}; 