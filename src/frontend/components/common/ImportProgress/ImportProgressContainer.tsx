import React, { useEffect, useState } from 'react';
import { importService } from '../../../services/importService';
import { ImportJob } from '../../../types/importTypes';
import { ImportJobCard } from './ImportJobCard';

/**
 * Container component that manages the display of all import jobs
 * This component subscribes to import job updates and renders the appropriate cards
 */
export function ImportProgressContainer() {
  const [jobs, setJobs] = useState<Record<string, ImportJob>>({});
  const hasJobs = Object.keys(jobs).length > 0;

  // Subscribe to import job updates
  useEffect(() => {
    console.log('ImportProgressContainer component mounted');
    const unsubscribe = importService.subscribeToImports((updatedJobs) => {
      console.log('Import jobs updated:', updatedJobs);

      // Force a re-render by creating a new object
      const newJobs = { ...updatedJobs };
      setJobs(newJobs);

      // Log each job individually for debugging
      Object.entries(updatedJobs).forEach(([jobId, job]) => {
        console.log(`Job ${jobId}:`, job);
      });

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
        <ImportJobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
