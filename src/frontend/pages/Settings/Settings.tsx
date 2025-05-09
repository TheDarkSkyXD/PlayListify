import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-onSurface dark:text-yt-text-primary-dark">Settings</h1>
      <div className="space-y-6">
        <div className="bg-surface dark:bg-yt-dark-gray p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-onSurface dark:text-yt-text-primary-dark">Download Settings</h2>
          <p className="text-textSecondary dark:text-yt-text-secondary-dark">Configure download location, default quality, etc.</p>
          {/* Placeholder for actual settings controls */}
        </div>
        <div className="bg-surface dark:bg-yt-dark-gray p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-onSurface dark:text-yt-text-primary-dark">Appearance</h2>
          <p className="text-textSecondary dark:text-yt-text-secondary-dark">Manage theme and appearance settings.</p>
          {/* Theme toggle might be here eventually */}
        </div>
        <div className="bg-surface dark:bg-yt-dark-gray p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-onSurface dark:text-yt-text-primary-dark">Account</h2>
          <p className="text-textSecondary dark:text-yt-text-secondary-dark">Manage linked accounts.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 