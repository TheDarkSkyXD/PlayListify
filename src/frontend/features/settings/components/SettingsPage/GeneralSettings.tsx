import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Separator } from '../../../../components/ui/separator';
import { Skeleton } from '../../../../components/ui/skeleton';
import { FolderOpen, Save, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { SettingsComponentProps } from './types';

/**
 * General settings tab content
 */
export function GeneralSettings({
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
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Settings saved successfully
          </div>
        )}

        <div className="space-y-6">
          <div>
            <Label htmlFor="downloadLocation">Download Location</Label>
            <div className="flex mt-1">
              <Input
                id="downloadLocation"
                name="downloadLocation"
                value={settings.downloadLocation || ''}
                onChange={(e) => onSettingsChange('downloadLocation', e.target.value)}
                className="flex-1"
                placeholder="Select a download location"
              />
              <Button
                type="button"
                variant="outline"
                className="ml-2"
                onClick={() => onSelectFolder('downloadLocation')}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <Info className="h-3 w-3 inline mr-1" />
              A 'playlistify' folder will be created at the selected location
            </p>
          </div>

          <Separator />

          <div>
            <Label htmlFor="concurrentDownloads">Max Concurrent Downloads</Label>
            <Input
              id="concurrentDownloads"
              name="concurrentDownloads"
              type="number"
              min="1"
              max="10"
              value={settings.concurrentDownloads || 2}
              onChange={(e) => onSettingsChange('concurrentDownloads', parseInt(e.target.value, 10))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="maxQuality">Default Video Quality</Label>
            <select
              id="maxQuality"
              name="maxQuality"
              value={settings.maxQuality || '1080p'}
              onChange={(e) => onSettingsChange('maxQuality', e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md"
            >
              <option value="best">Best</option>
              <option value="2160p">4K (2160p)</option>
              <option value="1440p">QHD (1440p)</option>
              <option value="1080p">Full HD (1080p)</option>
              <option value="720p">HD (720p)</option>
              <option value="480p">SD (480p)</option>
              <option value="360p">LD (360p)</option>
            </select>
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
