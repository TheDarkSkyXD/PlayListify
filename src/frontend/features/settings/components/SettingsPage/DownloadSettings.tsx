import React from 'react';
import { SettingsComponentProps } from './types';

/**
 * Download settings tab content
 */
export function DownloadSettings({
  settings,
  isSaving,
  error,
  saveSuccess,
  onSettingsChange,
  onSelectFolder,
  onSubmit
}: SettingsComponentProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-sm border p-6">
      <p className="text-muted-foreground">Download settings content</p>
    </div>
  );
}
