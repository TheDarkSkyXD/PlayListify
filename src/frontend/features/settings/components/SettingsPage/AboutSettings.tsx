import React from 'react';

/**
 * About settings tab content
 */
export function AboutSettings() {
  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold mb-4">About PlayListify</h2>
      <p className="text-muted-foreground mb-4">
        PlayListify is a YouTube playlist downloader and manager.
      </p>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="font-medium">Version</span>
          <span className="text-muted-foreground">1.0.0</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Electron</span>
          <span className="text-muted-foreground">v26.0.0</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">yt-dlp</span>
          <span className="text-muted-foreground">2023.03.04</span>
        </div>
      </div>
    </div>
  );
}
