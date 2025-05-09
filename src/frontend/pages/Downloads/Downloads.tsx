import React from 'react';

const DownloadsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-onSurface dark:text-yt-text-primary-dark">Downloads</h1>
      <div className="bg-surface dark:bg-yt-dark-gray p-6 rounded-lg shadow">
        <p className="text-textSecondary dark:text-yt-text-secondary-dark">
          Active and completed downloads will be shown here. Users will be able to manage their downloads (pause, resume, cancel, clear completed).
        </p>
        {/* Placeholder for download list and controls */}
      </div>
    </div>
  );
};

export default DownloadsPage; 