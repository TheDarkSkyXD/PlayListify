import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ImportJob, importService } from '../../services/importService';
import { logger } from '../../utils/logger';

/**
 * A comprehensive component for showing import progress
 * This component handles all aspects of displaying import jobs
 * including subscribing to updates, managing jobs, and rendering progress bars
 */
export function ImportProgressBar() {
  const [jobs, setJobs] = useState<Record<string, ImportJob>>({});
  const hasJobs = Object.keys(jobs).length > 0;

  // Subscribe to import job updates
  useEffect(() => {
    logger.info('UI', 'ImportProgressBar mounted');
    const unsubscribe = importService.subscribeToImports((updatedJobs) => {
      logger.debug('UI', `Import jobs updated: ${Object.keys(updatedJobs).length} jobs`);

      // Force a re-render by creating a new object
      const newJobs = { ...updatedJobs };
      setJobs(newJobs);

      // Log each job individually for debugging (only in debug mode)
      if (Object.keys(updatedJobs).length > 0) {
        logger.group('Import Jobs');
        Object.entries(updatedJobs).forEach(([jobId, job]) => {
          logger.debug('UI', `Job ${jobId}: ${job.status} - ${job._statusText || ''}`);
        });
        logger.groupEnd();
      }

      // Check for newly completed jobs
      Object.values(updatedJobs).forEach(job => {
        if (job.status === 'success' && job._notified !== true) {
          // Mark as notified to prevent duplicate notifications
          importService.markJobAsNotified(job.id);

          // Auto-remove successful jobs after 5 seconds
          setTimeout(() => {
            importService.removeJob(job.id);
          }, 5000);
        }
      });
    });

    return unsubscribe;
  }, []);

  // If no jobs, don't render anything
  if (!hasJobs) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {Object.values(jobs).map((job) => (
        <ImportProgressBarItem key={job.id} job={job} />
      ))}
    </div>
  );
}

/**
 * Individual progress bar item for a single import job
 */
export function ImportProgressBarItem({ job }: { job: ImportJob }) {
  // Use the status text from the backend if available, or generate a fallback
  let statusText = job._statusText || '';

  // If no status text is provided, generate a fallback
  if (!statusText) {
    if (job.status === 'loading') {
      statusText = 'Preparing to import playlist...';
    } else if (job.status === 'success') {
      if (job.skippedVideos && job.skippedVideos > 0) {
        statusText = `Added ${job.completedVideos || job.totalVideos} videos, skipped ${job.skippedVideos} duplicates`;
      } else {
        statusText = `Imported ${job.totalVideos} videos`;
      }
    } else if (job.status === 'error') {
      statusText = job.error || 'Import failed';
    } else {
      statusText = 'Pending...';
    }
  }

  // Style based on status
  let cardClassName = 'rounded-md p-3 shadow-lg relative';
  if (job.status === 'success') {
    cardClassName += ' bg-green-50 dark:bg-green-900/20';
  } else if (job.status === 'error') {
    cardClassName += ' bg-red-50 dark:bg-red-900/20';
  } else {
    cardClassName += ' bg-white dark:bg-gray-800';
  }

  // Get the current phase from the job object
  const currentPhase = job._phase || 'initializing';

  // Determine if we're in the initialization phase or processing phase
  const isInitializingPhase = currentPhase === 'initializing';
  const isProcessingPhase = currentPhase === 'processing';

  // IMPORTANT: We ONLY consider a video being processed if the status text explicitly says so
  // This is the key fix - we only show progress when the status text
  // explicitly says 'Processing video X of Y'
  const isActuallyProcessingVideos = isProcessingPhase &&
                                    statusText.match(/Processing video \d+ of \d+/);

  // IMPORTANT: Force hide progress during initialization
  // Even if totalVideos is set, we ignore it during initialization
  const effectiveTotalVideos = isInitializingPhase ? undefined : job.totalVideos;

  // Only show progress if we're actually processing videos
  const canShowProgress = isActuallyProcessingVideos &&
                         typeof job.progress === 'number' &&
                         job.progress > 0;

  // Only show video count if we're actually processing videos
  const canShowVideoCount = isActuallyProcessingVideos &&
                           typeof job.completedVideos === 'number' &&
                           typeof effectiveTotalVideos === 'number' &&
                           effectiveTotalVideos > 0;

  // Log the current state for debugging
  logger.debug(
    'UI',
    `ImportProgressBar: Job=${job.id}, Phase=${currentPhase}, IsActuallyProcessing=${isActuallyProcessingVideos ? 'true' : 'false'}, ` +
    `CanShowProgress=${canShowProgress}, CanShowVideoCount=${canShowVideoCount}, ` +
    `Progress=${job.progress || 0}, Videos=${job.completedVideos || 0}/${effectiveTotalVideos || 0}, ` +
    `StatusText=${statusText}`
  );

  // Determine what text to show
  const progressText = isInitializingPhase
    ? 'Initializing...'
    : canShowProgress
      ? `${job.progress}%`
      : 'Preparing...';

  const videoCountText = isInitializingPhase
    ? 'Retrieving playlist information...'
    : canShowVideoCount && job.completedVideos !== undefined && effectiveTotalVideos !== undefined
      ? `${job.completedVideos} of ${effectiveTotalVideos} videos`
      : 'Preparing to process videos...';

  return (
    <div className={cardClassName}>
      <button
        onClick={() => importService.removeJob(job.id)}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>

      <div className="flex justify-between items-start mb-2 pr-6">
        <div>
          <h4 className="font-medium text-md">{job.youtubeTitle || job.name}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">{statusText}</p>
        </div>
      </div>

      {job.status === 'loading' && (
        <div className="mt-3">
          {/* Status and progress percentage */}
          <div className="flex justify-between text-xs mb-1">
            <span>{statusText}</span>
            <span>{progressText}</span>
          </div>

          {/* Video count information */}
          <div className="text-xs text-gray-500">
            {videoCountText}
          </div>

          {/* Debug info - only visible during development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 italic">
              Phase: {currentPhase}, IsActuallyProcessing: {isActuallyProcessingVideos ? 'true' : 'false'},
              Progress: {job.progress}, Videos: {job.completedVideos}/{effectiveTotalVideos}
            </div>
          )}

          {/* Progress bar */}
          <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
            {isInitializingPhase ? (
              // Show a pulsing animation during initialization
              // Make it clear this is just a loading indicator, not actual progress
              <div className="h-full rounded-full animate-pulse bg-gray-400 w-1/4"></div>
            ) : canShowProgress ? (
              // Only show a normal progress bar when we're actually processing videos
              <div
                className="h-full rounded-full transition-all duration-300 flex items-center relative overflow-hidden bg-[#FF0000]"
                style={{
                  width: `${job.progress}%`
                }}
              >
                {/* Animated progress bar effect */}
                <div className="absolute inset-0 overflow-hidden w-full h-full">
                  <div
                    className="absolute inset-0 w-full h-full transform translate-x-0 bg-opacity-40 bg-white"
                    style={{
                      animation: "progressPulse 1.5s ease-in-out infinite",
                      width: "100%"
                    }}
                  />
                </div>
              </div>
            ) : (
              // Default case - empty progress bar
              <div className="h-full w-0"></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
