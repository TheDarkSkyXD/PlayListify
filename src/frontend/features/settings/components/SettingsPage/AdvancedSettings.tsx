import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Separator } from '../../../../components/ui/separator';
import { Skeleton } from '../../../../components/ui/skeleton';
import { FolderOpen, Save, Info, Folder } from 'lucide-react';
import { SettingsComponentProps } from './types';

/**
 * Advanced settings tab content
 */
export function AdvancedSettings({
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
      <form onSubmit={onSubmit}>
        <div className="space-y-6">
          <div>
            <Label htmlFor="ffmpegPath">FFmpeg Path (optional)</Label>
            <div className="flex mt-1">
              <Input
                id="ffmpegPath"
                name="ffmpegPath"
                value={settings.ffmpegPath || ''}
                onChange={(e) => onSettingsChange('ffmpegPath', e.target.value)}
                className="flex-1"
                placeholder="Leave empty to use bundled version"
              />
              <Button
                type="button"
                variant="outline"
                className="ml-2"
                onClick={() => onSelectFolder('ffmpegPath')}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="ytDlpPath">yt-dlp Path (optional)</Label>
            <div className="flex mt-1">
              <Input
                id="ytDlpPath"
                name="ytDlpPath"
                value={settings.ytDlpPath || ''}
                onChange={(e) => onSettingsChange('ytDlpPath', e.target.value)}
                className="flex-1"
                placeholder="Leave empty to use bundled version"
              />
              <Button
                type="button"
                variant="outline"
                className="ml-2"
                onClick={() => onSelectFolder('ytDlpPath')}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Only set this if you want to use your own yt-dlp binary.
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium">Database Information</h3>
            <p className="text-sm text-muted-foreground mb-4">
              PlayListify uses SQLite to store playlist and video metadata for improved performance.
            </p>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-400">
                <Info className="h-4 w-4 inline-block mr-2" />
                Playlist and video metadata are stored in a SQLite database, while actual video files
                remain on the filesystem. This hybrid approach provides efficient metadata querying
                with optimal storage for large files.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-md">
                <p className="text-sm text-gray-800 dark:text-gray-400">
                  <Folder className="h-4 w-4 inline-block mr-2" />
                  In development mode, the database is stored in the <code>database</code> folder for easy access.
                </p>
              </div>
            )}
          </div>

          <Button type="submit" disabled={isSaving} className="mt-4">
            {isSaving ?
              <span className="flex items-center">
                <Skeleton className="h-4 w-4 rounded-full mr-2 animate-spin" />
                Saving...
              </span> :
              <span className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </span>
            }
          </Button>
        </div>
      </form>
    </div>
  );
}
