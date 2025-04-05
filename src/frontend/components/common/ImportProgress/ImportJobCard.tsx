import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { importService } from '../../../services/importService';
import { ImportJob } from '../../../types/importTypes';
import { notificationService } from '../../../services/notificationService';

/**
 * Component that displays a single import job with progress information
 * Uses a time-based simulation for smooth progress updates
 */
export function ImportJobCard({ job }: { job: ImportJob }) {
  // Simple state for progress simulation
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [startTime] = useState(Date.now());
  const totalVideos = job.totalVideos || 100;

  // Use a simple timer to update progress
  useEffect(() => {
    // Only run for loading jobs
    if (job.status !== 'loading') return;

    // Update progress every 500ms
    const timer = setInterval(() => {
      // Calculate elapsed time in seconds
      const elapsedSeconds = (Date.now() - startTime) / 1000;

      // Estimate progress based on time
      // Assume it takes about 2 seconds per video with a max of totalVideos
      const estimatedProgress = Math.min(Math.floor(elapsedSeconds / 2), totalVideos);

      setSimulatedProgress(estimatedProgress);
    }, 500);

    return () => clearInterval(timer);
  }, [job.status, startTime, totalVideos]);

  // Calculate progress percentage
  const progressValue = totalVideos > 0 ? Math.round((simulatedProgress / totalVideos) * 100) : 0;

  // Generate status text
  let statusText = '';
  if (job.status === 'loading') {
    statusText = `Importing ${simulatedProgress} of ${totalVideos} videos...`;
  } else if (job.status === 'success') {
    if (job.skippedVideos && job.skippedVideos > 0) {
      statusText = `Added ${job.completedVideos || totalVideos} videos, skipped ${job.skippedVideos} duplicates`;
    } else {
      statusText = `Imported ${totalVideos} videos`;
    }
  } else if (job.status === 'error') {
    statusText = job.error || 'Import failed';
  } else {
    statusText = 'Pending...';
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
          <div className="flex justify-between text-xs mb-1">
            <span>{statusText}</span>
            <span>{progressValue}%</span>
          </div>
          <div className="text-xs text-gray-500">
            {`${simulatedProgress} of ${totalVideos} videos`}
          </div>
          <div
            className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-[#FF0000] rounded-full transition-all duration-300 flex items-center relative overflow-hidden"
              style={{ width: `${progressValue}%` }}
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
          </div>
        </div>
      )}
    </div>
  );
}
