import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Folder, Download, Loader2 } from 'lucide-react';
import FormatSelector from './FormatSelector';
import { DownloadOptions, Playlist } from '../../../../shared/types/appTypes';
import { toast } from '../../../components/ui/use-toast';

interface DownloadOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist;
  onDownload: (options: DownloadOptions & { downloadLocation: string }) => void;
  isDownloading?: boolean;
}

export default function DownloadOptionsDialog({
  open,
  onOpenChange,
  playlist,
  onDownload,
  isDownloading = false
}: DownloadOptionsDialogProps) {
  const [downloadLocation, setDownloadLocation] = useState<string>('');
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [formatOptions, setFormatOptions] = useState<DownloadOptions>({
    format: 'mp4',
    quality: '1080p'
  });

  // Load default download location from settings
  useEffect(() => {
    const loadDefaultLocation = async () => {
      try {
        const location = await window.api.settings.get('downloadLocation');
        setDownloadLocation(location || '');
      } catch (error) {
        console.error('Failed to load default download location:', error);
        toast({
          title: 'Error',
          description: 'Failed to load default download location',
          variant: 'destructive'
        });
      }
    };

    if (open) {
      loadDefaultLocation();
    }
  }, [open]);

  // Handle folder selection
  const handleSelectFolder = async () => {
    setIsSelectingFolder(true);
    try {
      const selectedPath = await window.api.fs.selectDirectory();
      if (selectedPath) {
        setDownloadLocation(selectedPath);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      toast({
        title: 'Error',
        description: 'Failed to select directory',
        variant: 'destructive'
      });
    } finally {
      setIsSelectingFolder(false);
    }
  };

  // Handle format options change
  const handleFormatChange = (options: DownloadOptions) => {
    setFormatOptions(options);
  };

  // Handle download button click
  const handleDownload = () => {
    if (!downloadLocation) {
      toast({
        title: 'Error',
        description: 'Please select a download location',
        variant: 'destructive'
      });
      return;
    }

    onDownload({
      ...formatOptions,
      downloadLocation
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Options</DialogTitle>
          <DialogDescription>
            Configure download options for "{playlist.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Download Location */}
          <div className="space-y-2">
            <Label htmlFor="downloadLocation">Download Location</Label>
            <div className="flex gap-2">
              <Input
                id="downloadLocation"
                value={downloadLocation}
                onChange={(e) => setDownloadLocation(e.target.value)}
                placeholder="Select download location"
                className="flex-1"
                readOnly
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectFolder}
                disabled={isSelectingFolder}
              >
                {isSelectingFolder ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Folder className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Format Options */}
          <FormatSelector
            initialFormat={formatOptions.format}
            initialQuality={formatOptions.quality}
            onFormatChange={handleFormatChange}
            disabled={isDownloading}
          />

          {/* Download Information */}
          <div className="text-sm text-muted-foreground">
            <p>This will download {playlist.videos.length} videos from the playlist.</p>
            {playlist.videos.some(v => v.downloaded) && (
              <p className="mt-1">
                Note: Already downloaded videos will be skipped.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDownloading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDownload}
            disabled={!downloadLocation || isDownloading}
            className="gap-2"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
