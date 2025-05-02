import React from 'react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="bg-card p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Welcome to PlayListify</h2>
        <p className="mb-4">
          Your YouTube playlist manager and downloader. Use the navigation to explore your playlists or view your downloads.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="border rounded-md p-4 hover:bg-secondary/10 transition-colors">
            <h3 className="font-medium mb-2">My Playlists</h3>
            <p className="text-sm text-muted-foreground mb-4">
              View, manage, and create YouTube playlists
            </p>
            <a href="/playlists" className="text-primary hover:underline">
              Go to Playlists →
            </a>
          </div>
          
          <div className="border rounded-md p-4 hover:bg-secondary/10 transition-colors">
            <h3 className="font-medium mb-2">Downloads</h3>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage your downloaded videos
            </p>
            <a href="/downloads" className="text-primary hover:underline">
              Go to Downloads →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}; 