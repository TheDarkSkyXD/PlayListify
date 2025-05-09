import React from 'react';

const HistoryPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-onSurface dark:text-yt-text-primary-dark">History</h1>
      <div className="bg-surface dark:bg-yt-dark-gray p-6 rounded-lg shadow">
        <p className="text-textSecondary dark:text-yt-text-secondary-dark">
          History of watched or played videos will be displayed here. Options to clear history or manage individual entries.
        </p>
        {/* Placeholder for history list */}
      </div>
    </div>
  );
};

export default HistoryPage; 