import React, { useEffect, useState } from 'react';
import { ImportJob, importService } from '../services/importService';

export function ImportProgress() {
  const [jobs, setJobs] = useState<Record<string, ImportJob>>({});
  const hasJobs = Object.keys(jobs).length > 0;

  // Subscribe to import job updates
  useEffect(() => {
    const unsubscribe = importService.subscribeToImports(setJobs);
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

function ImportJobCard({ job }: { job: ImportJob }) {
  let statusText = '';
  let progressValue = 0;
  
  // Calculate progress percentage
  if (job.totalVideos > 0) {
    progressValue = Math.round((job.progress / job.totalVideos) * 100);
  }
  
  // Status text based on job status
  switch (job.status) {
    case 'loading':
      statusText = job.totalVideos 
        ? `Importing ${job.progress} of ${job.totalVideos} videos...` 
        : 'Starting import...';
      break;
    case 'success':
      statusText = `Imported ${job.totalVideos} videos`;
      break;
    case 'error':
      statusText = job.error || 'Import failed';
      break;
    default:
      statusText = 'Pending...';
  }
  
  // Style based on status
  let cardClassName = 'rounded-md p-3 shadow-lg';
  if (job.status === 'success') {
    cardClassName += ' bg-emerald-100 dark:bg-emerald-900';
  } else if (job.status === 'error') {
    cardClassName += ' bg-red-100 dark:bg-red-900';
  } else {
    cardClassName += ' bg-white dark:bg-gray-800';
  }
  
  return (
    <div className={cardClassName}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium">{job.name || 'YouTube Playlist'}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">{statusText}</p>
        </div>
      </div>
      
      {job.status === 'loading' && (
        <div 
          className="h-2 mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        >
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      )}
    </div>
  );
} 