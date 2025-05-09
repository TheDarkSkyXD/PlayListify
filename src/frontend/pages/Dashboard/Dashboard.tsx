import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-onSurface dark:text-yt-text-primary-dark">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for Dashboard Widgets */}
        <div className="bg-surface dark:bg-yt-dark-gray p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2 text-onSurface dark:text-yt-text-primary-dark">Recently Added Playlists</h2>
          <p className="text-textSecondary dark:text-yt-text-secondary-dark">No playlists added yet.</p>
        </div>
        <div className="bg-surface dark:bg-yt-dark-gray p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2 text-onSurface dark:text-yt-text-primary-dark">Active Downloads</h2>
          <p className="text-textSecondary dark:text-yt-text-secondary-dark">No active downloads.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 