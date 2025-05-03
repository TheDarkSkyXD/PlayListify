import React, { useState, useEffect } from 'react';
// Import only icons that are definitely available
import { Download, Folder, Loader2 } from 'lucide-react';
import { formatFileSize } from '../../../utils/formatting';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

// Define types for download options
interface DownloadOptions {
  format: string;
  quality: string;
  audioOnly: boolean;
  downloadLocation?: string;
  createPlaylistFolder: boolean;
  downloadAllVideos: boolean;
}

interface DownloadOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (options: DownloadOptions) => void;
  playlistName?: string;
  videoCount?: number;
  estimatedSize?: number;
  isPlaylist?: boolean;
}

/**
 * Dialog for configuring download options for videos or playlists
 */
const DownloadOptionsDialog: React.FC<DownloadOptionsDialogProps> = ({
  open,
  onOpenChange,
  onDownload,
  playlistName = '',
  videoCount = 0,
  estimatedSize = 0,
  isPlaylist = false
}) => {
  // Default options
  const [options, setOptions] = useState<DownloadOptions>({
    format: 'mp4',
    quality: '1080p',
    audioOnly: false,
    downloadLocation: '',
    createPlaylistFolder: true,
    downloadAllVideos: true
  });

  const [defaultLocation, setDefaultLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availableSpace, setAvailableSpace] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fetch download location and disk space on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Check if API is available
        if (!window.api || !window.api.settings) {
          console.warn('Settings API not available, using default values');
          setDefaultLocation('');
          setOptions(prev => ({ ...prev, downloadLocation: '' }));
          return;
        }

        // Fetch default download location from settings
        const location = await window.api.settings.get<string>('downloadLocation', '');
        setDefaultLocation(location);
        setOptions(prev => ({ ...prev, downloadLocation: location }));

        // Fetch available disk space if fs API is available
        if (location && window.api.fs) {
          try {
            const space = await window.api.fs.getAvailableDiskSpace(location);
            setAvailableSpace(space);
          } catch (fsError) {
            console.warn('Could not get available disk space:', fsError);
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setErrorMessage('Could not load download settings');
      }
    };

    if (open) {
      fetchSettings();
      setErrorMessage('');
    }
  }, [open]);

  // Handle browse for folder
  const handleBrowse = async () => {
    if (!window.api || !window.api.dialog) {
      console.warn('Dialog API not available');
      setErrorMessage('Folder selection is not available');
      return;
    }

    try {
      const selectedPath = await window.api.dialog.selectFolder();
      if (selectedPath) {
        setOptions(prev => ({ ...prev, downloadLocation: selectedPath }));
        
        // Update available space for the new location
        if (window.api.fs) {
          try {
            const space = await window.api.fs.getAvailableDiskSpace(selectedPath);
            setAvailableSpace(space);
          } catch (fsError) {
            console.warn('Could not get available disk space:', fsError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
      setErrorMessage('Could not select folder');
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!options.downloadLocation) {
      setErrorMessage('Please select a download location');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // If the user is saving to a custom location, offer to save it as default
      if (options.downloadLocation !== defaultLocation && window.api?.settings) {
        // Save new location as default
        await window.api.settings.set('downloadLocation', options.downloadLocation || '');
      }
      
      // Call the onDownload callback with the options
      onDownload(options);
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Download error:', error);
      setErrorMessage('Error starting download');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Modal 
      isOpen={open} 
      onClose={handleClose} 
      preventClose={isLoading}
      className="w-full max-w-md p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Download Options</h2>
        <button
          onClick={handleClose}
          className="text-secondary-foreground/70 hover:text-secondary-foreground"
          aria-label="Close dialog"
          disabled={isLoading}
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Format and Quality Selection */}
        <div className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="format" className="block text-sm font-medium">
              Format
            </label>
            <select
              id="format"
              value={options.format}
              onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value }))}
              disabled={options.audioOnly || isLoading}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="mp4">MP4</option>
              <option value="webm">WebM</option>
              <option value="mkv">MKV</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="quality" className="block text-sm font-medium">
              Quality
            </label>
            <select
              id="quality"
              value={options.quality}
              onChange={(e) => setOptions(prev => ({ ...prev, quality: e.target.value }))}
              disabled={options.audioOnly || isLoading}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="2160p">4K (2160p)</option>
              <option value="1440p">QHD (1440p)</option>
              <option value="1080p">Full HD (1080p)</option>
              <option value="720p">HD (720p)</option>
              <option value="480p">SD (480p)</option>
              <option value="360p">Low (360p)</option>
              <option value="best">Best Available</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              id="audioOnly"
              type="checkbox"
              checked={options.audioOnly}
              onChange={(e) => {
                setOptions(prev => ({
                  ...prev,
                  audioOnly: e.target.checked,
                  format: e.target.checked ? 'mp3' : 'mp4'
                }));
              }}
              disabled={isLoading}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="audioOnly" className="text-sm">
              Extract audio only (MP3)
            </label>
          </div>
        </div>

        {/* Download location */}
        <div className="space-y-2">
          <label htmlFor="location" className="block text-sm font-medium">
            Download Location <span className="text-destructive">*</span>
          </label>
          <div className="flex gap-2">
            <input
              id="location"
              type="text"
              value={options.downloadLocation || ''}
              onChange={(e) => setOptions(prev => ({ ...prev, downloadLocation: e.target.value }))}
              placeholder="Choose download folder"
              disabled={isLoading}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button
              variant="outline"
              onClick={handleBrowse}
              disabled={isLoading}
              className="px-3"
            >
              <Folder className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Available space info */}
          {availableSpace !== null && (
            <div className="text-xs text-secondary-foreground/70 mt-1">
              Available space: {formatFileSize(availableSpace)}
              {estimatedSize > 0 && (
                <span> (Estimated size: {formatFileSize(estimatedSize)})</span>
              )}
            </div>
          )}
          
          {/* Error message */}
          {errorMessage && (
            <p className="text-sm text-destructive mt-1">{errorMessage}</p>
          )}
        </div>

        {/* Playlist-specific options */}
        {isPlaylist && (
          <div className="bg-secondary/20 rounded-md p-4 space-y-3">
            <h3 className="font-medium text-sm">Playlist Options</h3>
            
            <div className="flex items-center gap-2">
              <input
                id="createFolder"
                type="checkbox"
                checked={options.createPlaylistFolder}
                onChange={(e) => {
                  setOptions(prev => ({
                    ...prev,
                    createPlaylistFolder: e.target.checked
                  }));
                }}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="createFolder" className="text-sm">
                Create folder for playlist "{playlistName}"
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                id="downloadAll"
                type="checkbox"
                checked={options.downloadAllVideos}
                onChange={(e) => {
                  setOptions(prev => ({
                    ...prev,
                    downloadAllVideos: e.target.checked
                  }));
                }}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="downloadAll" className="text-sm">
                Download all {videoCount} {videoCount === 1 ? 'video' : 'videos'}
              </label>
            </div>
          </div>
        )}
        
        <div className="mt-2 text-sm text-secondary-foreground/70">
          <p>Downloaded files will be saved to your device and available for offline playback.</p>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            onClick={handleClose}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            type="button"
            onClick={handleSubmit}
            variant="default"
            disabled={isLoading || !options.downloadLocation}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download {isPlaylist && options.downloadAllVideos ? 'All' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DownloadOptionsDialog; 