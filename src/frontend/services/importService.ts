import { toast } from '../components/ui/use-toast';
import { QUERY_KEYS } from './query/keys';
import { ImportJob } from '../types/importTypes';
export type { ImportJob } from '../types/importTypes';
import { logger } from '../utils/logger';
import { queryClient } from './queryClientProvider';
import { Video } from '../../shared/types/appTypes';

// Event emitter for import progress
export class ImportEventEmitter {
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
    logger.debug('IMPORT', `Updating job ${jobId}`, updates);

    // Create or update the job
    if (!this.activeJobs[jobId]) {
      this.activeJobs[jobId] = { id: jobId, ...updates } as ImportJob;
    } else {
      this.activeJobs[jobId] = { ...this.activeJobs[jobId], ...updates };
    }

    // Notify listeners of the update - use setTimeout to break the call stack
    setTimeout(() => {
      this.notifyListeners();
    }, 0);
  }

  public removeJob(jobId: string) {
    delete this.activeJobs[jobId];
    this.notifyListeners();
  }

  private notifyListeners() {
    logger.debug('IMPORT', `Notifying ${this.listeners.length} listeners`);
    const jobsCopy = { ...this.activeJobs };
    this.listeners.forEach(listener => {
      try {
        listener(jobsCopy);
      } catch (error) {
        logger.error('IMPORT', 'Error notifying listener:', error);
      }
    });
  }

  public getJob(jobId: string): ImportJob | undefined {
    return this.activeJobs[jobId];
  }
}

const importEvents = new ImportEventEmitter();

// Generate a unique ID for import jobs
function generateJobId(): string {
  return `import_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Main import service functions
export const importService = {
  // Subscribe to import job updates
  subscribeToImports: (callback: (jobs: Record<string, ImportJob>) => void) => {
    return importEvents.subscribe(callback);
  },

  // Mark a job as notified to prevent duplicate notifications
  markJobAsNotified: (jobId: string) => {
    importEvents.updateJob(jobId, { _notified: true });
  },

  // Remove a job from tracking
  removeJob: (jobId: string) => {
    importEvents.removeJob(jobId);
  },

  // Import a YouTube playlist
  importYoutubePlaylist: async (
    url: string,
    name: string,
    youtubeTitle?: string
  ) => {
    const jobId = generateJobId();
    logger.info('IMPORT', `Creating new import job with ID: ${jobId}`);

    // Add job to tracking with initial state - explicitly set totalVideos to undefined
    // This prevents the UI from showing any video count before we have actual data
    importEvents.updateJob(jobId, {
      id: jobId,
      url,
      name,
      status: 'loading',
      progress: 0,
      completedVideos: 0, // Start with 0 completed videos
      totalVideos: undefined, // Use undefined instead of 0 to indicate we don't have a count yet
      youtubeTitle: youtubeTitle || name, // Store the original YouTube title
      _statusText: 'Preparing to import playlist...', // Initial status message
      _phase: 'initializing' // Add a phase indicator to track where we are in the process
    });

    // Log the job that was just created
    logger.debug('IMPORT', `Job created: ${jobId}`, importEvents.getJob(jobId));

    // Set up progress tracking listener BEFORE making any API calls
    // This ensures we don't miss any progress updates from the backend
    const progressListener = (progress: any) => {
      logger.debug('PROGRESS', 'Received progress update', progress);

      // Ensure progress is an object with required properties
      if (!progress || typeof progress !== 'object') {
        logger.warn('PROGRESS', 'Invalid progress object received', progress);
        return;
      }
      // Update status text and progress based on the current stage
      let statusText = progress.status || 'Processing...';
      let currentProgress = progress.count || 0;
      let totalItems = progress.total || 0;

      // Only process updates that have actual content
      // Skip updates with 0 total items to avoid showing progress before backend starts
      if (statusText === 'Starting playlist import...' && totalItems === 0) {
        logger.debug('PROGRESS', 'Skipping initial progress update with no video count');
        return;
      }

      // Update the job with the current progress information
      logger.info('PROGRESS', `Job ${jobId}: ${statusText} - ${currentProgress}/${totalItems}`);


      // Force a UI update by using setTimeout
      setTimeout(() => {
        // Determine the current phase based on the status text
        let currentPhase: 'initializing' | 'processing' | 'completing' = 'initializing';

        // IMPORTANT: Only enter processing phase when we're ACTUALLY processing videos
        // This is the key fix - we only enter processing phase when the status text
        // explicitly says 'Processing video X of Y'
        if (statusText.match(/Processing video \d+ of \d+/)) {
          currentPhase = 'processing';
          logger.phase('PROGRESS', 'PROCESSING', `Detected processing phase: ${statusText}`);
        } else if (statusText.includes('Import complete') ||
                  statusText.includes('Creating playlist') ||
                  statusText.includes('Saving playlist')) {
          currentPhase = 'completing';
        }

        const isInitializingPhase = currentPhase === 'initializing';
        const isProcessingPhase = currentPhase === 'processing';

        // Only calculate percentage if we have valid total items and we're actually processing videos
        let progressValue = 0;

        // Don't show any progress until we're actually processing videos
        // This prevents showing "26 videos" when the backend is still initializing
        // IMPORTANT: We ONLY consider a video being processed if the status text explicitly says so
        // This is the key fix - we only set totalVideos when the status text
        // explicitly says 'Processing video X of Y'
        const isActuallyProcessingVideos = statusText.match(/Processing video \d+ of \d+/) && totalItems > 0;

        if (isActuallyProcessingVideos) {
          logger.phase('PROGRESS', 'PROCESSING', `Status: ${statusText}, Progress: ${currentProgress}/${totalItems}`);

          // Calculate percentage based on current progress and total items
          // Ensure we don't show 100% until we're actually done
          progressValue = Math.min(Math.floor((currentProgress / totalItems) * 100), 99);

          // Update the job with the latest information including video counts
          importEvents.updateJob(jobId, {
            progress: progressValue,
            completedVideos: currentProgress,
            skippedVideos: 0,
            // IMPORTANT: Only set totalVideos when we're actually processing videos
            // This prevents the UI from showing a progress bar too early
            totalVideos: totalItems,
            // Add a custom status message to show in the progress UI
            _statusText: statusText,
            // Update the phase to processing
            _phase: 'processing',
            // Ensure the status is still 'loading'
            status: 'loading'
          });

          // Log that we're showing the progress bar
          logger.info('PROGRESS', `Showing progress bar: ${statusText} - ${currentProgress}/${totalItems}`);
        } else if (isInitializingPhase) {
          logger.phase('PROGRESS', 'INITIALIZATION', `Status: ${statusText}, Progress: ${currentProgress}/${totalItems}`);

          // For initialization updates, don't show progress or video counts
          importEvents.updateJob(jobId, {
            // Reset progress to 0 during initialization
            progress: 0,
            // IMPORTANT: Explicitly set totalVideos to undefined during initialization
            // This prevents the UI from showing a progress bar too early
            totalVideos: undefined,
            // Don't update completedVideos here
            completedVideos: 0,
            // Add a custom status message to show in the UI
            _statusText: statusText,
            // Update the phase to initializing
            _phase: 'initializing',
            // Ensure the status is still 'loading'
            status: 'loading'
          });

          // Log that we're explicitly hiding the progress bar during initialization
          logger.debug('PROGRESS', `Explicitly hiding progress bar during initialization phase: ${statusText}`);
        } else {
          logger.phase('PROGRESS', 'COMPLETING', `Status: ${statusText}, Progress: ${currentProgress}/${totalItems}`);

          // For completing phase updates
          importEvents.updateJob(jobId, {
            _statusText: statusText,
            _phase: 'completing',
            status: 'loading'
          });
        }

        // Log the updated job (debug level only)
        logger.debug('IMPORT', `Updated job: ${jobId}`, importEvents.getJob(jobId));
      }, 0);
    };

    // Register the listener BEFORE making any API calls
    logger.debug('IMPORT', 'Registering listener for yt:importProgress events');
    window.api.receive('yt:importProgress', progressListener);

    try {
      // Get playlist info only - we don't need to fetch all videos separately
      const playlistInfo = await window.api.youtube.getPlaylistInfo(url);

      // Set totalVideos to undefined during initialization to prevent premature progress bar display
      importEvents.updateJob(jobId, {
        totalVideos: undefined,
        _statusText: `Found playlist: ${youtubeTitle || name} (${playlistInfo.videoCount} videos)`
      });

      // Show initial notification with video count from playlistInfo
      toast({
        title: 'Import started',
        description: `Started importing "${youtubeTitle || name}" (${playlistInfo.videoCount} videos)`,
      });

      // Brief delay to allow UI updates before starting the import
      await new Promise(resolve => setTimeout(resolve, 500));

      // Start the import process after setting up the listener and showing initial UI
      logger.info('IMPORT', 'Starting import process...');
      try {
        // Pass playlist info to backend to avoid duplicate fetching
        logger.info('IMPORT', `Calling window.api.youtube.importPlaylist with URL: ${url}`);
        // Pass playlist info to backend through a custom event since the API doesn't support it directly
        // First, store the playlist info in a global variable that the backend can access
        window.playlistInfoCache = playlistInfo;
        const importedPlaylist = await window.api.youtube.importPlaylist(url);
        logger.info('IMPORT', 'Import process completed');
        logger.debug('IMPORT', 'Imported playlist:', importedPlaylist);

        // Mark job as completed when done
        importEvents.updateJob(jobId, {
          status: 'success',
          progress: 100, // Set to 100% when complete
          completedVideos: playlistInfo.videoCount,
          skippedVideos: 0,
          totalVideos: playlistInfo.videoCount,
          _statusText: 'Import completed successfully'
        });

        // Invalidate and refetch playlists to update UI immediately
        logger.info('IMPORT', 'Invalidating and refetching playlists query to update UI');
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.playlists] });

        // Add a small delay before refetching to ensure the backend has had time to fully process the import
        setTimeout(() => {
          logger.info('IMPORT', 'Refetching playlists after delay');
          queryClient.refetchQueries({ queryKey: [QUERY_KEYS.playlists] });
        }, 1000);

        // We can't remove the listener with the current API
        // This is fine as the listener will be garbage collected when the function exits
        // window.api.off('yt:importProgress', progressListener);
      } catch (importError: any) {
        console.error(`Error during playlist import: ${importError.message}`);

        // Update job status to error
        importEvents.updateJob(jobId, {
          status: 'error',
          _statusText: `Error: ${importError.message}`,
          error: importError.message
        });

        // Show error notification
        toast({
          title: 'Import Failed',
          description: `Failed to import playlist: ${importError.message}`,
          variant: 'destructive',
          duration: 5000,
        });

        // Rethrow the error to prevent showing success message
        throw importError;
      }

      // Show success notification
      const successMessage = `${youtubeTitle || name} import completed successfully.`;

      toast({
        title: 'Import Completed',
        description: successMessage,
        duration: 3000,
      });

      // Keep job visible for a while so user can see progress, but allow manual dismissal
      // We will not auto-remove successfully completed jobs - user must dismiss them

      return { videos: [] as Video[] }; // Return empty array as we're not fetching videos separately anymore
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

      // Remove job after a delay for errors
      setTimeout(() => {
        importEvents.removeJob(jobId);
      }, 10000);

      throw error;
    }
  }
};