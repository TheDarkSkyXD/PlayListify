import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/frontend/components/ui/dialog';
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Label } from '@/frontend/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/frontend/components/ui/select';
import { Checkbox } from '@/frontend/components/ui/checkbox';
// import { useToast } from '@/frontend/components/ui/use-toast'; // If toasts are used for feedback

interface DownloadVideoDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// Mock types for IPC responses until actual types are defined/imported
interface VideoPreview {
  title: string;
  thumbnailUrl: string;
  duration?: string; // or number
}

interface QualityOption {
  id: string;
  label: string;
}

const DownloadVideoDialog: React.FC<DownloadVideoDialogProps> = ({ isOpen, onOpenChange }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPreview, setVideoPreview] = useState<VideoPreview | null>(null);
  const [qualityOptions, setQualityOptions] = useState<QualityOption[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string | undefined>(undefined);
  const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'mp3'>('mp4');
  const [includeSubtitles, setIncludeSubtitles] = useState(false);
  const [downloadPath, setDownloadPath] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isLoadingQualities, setIsLoadingQualities] = useState(false);

  // const { toast } = useToast();

  // Effect to fetch default download path (if applicable via IPC or settings)
  useEffect(() => {
    // Example: Fetch default path from settings or a dedicated IPC
    // const fetchDefaultPath = async () => {
    //   const path = await window.electron.ipcRenderer.invoke('settings:get-default-download-path');
    //   if (path) setDownloadPath(path);
    // };
    // fetchDefaultPath();
    // For now, let's assume it's empty or user must select
  }, []);

  // Debounced effect for fetching video preview
  useEffect(() => {
    if (!videoUrl) {
      setVideoPreview(null);
      setQualityOptions([]);
      setSelectedQuality(undefined);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoadingPreview(true);
      try {
        console.log(`Fetching preview for URL: ${videoUrl}`);
        // const previewData = await window.electron.ipcRenderer.invoke('playlist:get-preview', videoUrl);
        // MOCK PREVIEW FOR NOW
        const previewData: VideoPreview = { title: 'Mock Video Title', thumbnailUrl: 'https://via.placeholder.com/150', duration: '10:00' };
        setVideoPreview(previewData);
        console.log('Preview data received:', previewData);
      } catch (error) {
        console.error('Failed to fetch video preview:', error);
        setVideoPreview(null);
        // toast({ title: 'Error fetching preview', description: (error as Error).message, variant: 'destructive' });
      } finally {
        setIsLoadingPreview(false);
      }
    }, 1000); // 1-second debounce

    return () => {
      clearTimeout(handler);
    };
  }, [videoUrl]);

  // Effect to fetch quality options when preview is available
  useEffect(() => {
    if (videoPreview && videoUrl) {
      const fetchQualities = async () => {
        setIsLoadingQualities(true);
        try {
          console.log(`Fetching quality options for URL: ${videoUrl}`);
          // const qualities = await window.electron.ipcRenderer.invoke('download:get-quality-options', videoUrl);
          // MOCK QUALITIES FOR NOW
          const qualities: QualityOption[] = [
            { id: '1080p', label: '1080p HD' },
            { id: '720p', label: '720p HD' },
            { id: '480p', label: '480p SD' },
          ];
          setQualityOptions(qualities);
          if (qualities.length > 0) {
            setSelectedQuality(qualities[0].id); // Default to first/best quality
          }
          console.log('Quality options received:', qualities);
        } catch (error) {
          console.error('Failed to fetch quality options:', error);
          setQualityOptions([]);
          // toast({ title: 'Error fetching quality options', description: (error as Error).message, variant: 'destructive' });
        } finally {
          setIsLoadingQualities(false);
        }
      };
      fetchQualities();
    }
  }, [videoPreview, videoUrl]);

  const handleSelectLocation = async () => {
    try {
      console.log('Requesting folder selection dialog');
      // const selectedPath = await window.electron.ipcRenderer.invoke('dialog:show-select-folder');
      // MOCK PATH SELECTION
      const selectedPath = '/mock/user/selected/path';
      if (selectedPath) {
        setDownloadPath(selectedPath);
        console.log('Download path selected:', selectedPath);
      } else {
        console.log('Folder selection cancelled by user.');
      }
    } catch (error) {
      console.error('Error selecting download location:', error);
      // toast({ title: 'Error selecting location', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleAddToQueue = async () => {
    if (!videoUrl || !selectedQuality || !downloadPath) {
      // toast({ title: 'Missing information', description: 'Please provide URL, select quality, and choose a download location.', variant: 'warning' });
      alert('Please provide URL, select quality, and choose a download location.');
      return;
    }
    const downloadOptions = {
      url: videoUrl,
      quality: selectedQuality,
      format: selectedFormat,
      includeSubtitles,
      downloadPath,
      title: videoPreview?.title || 'Unknown Video', // Fallback title
    };
    try {
      console.log('Adding to download queue with options:', downloadOptions);
      // await window.electron.ipcRenderer.invoke('download:start', downloadOptions);
      // toast({ title: 'Download Added', description: `${downloadOptions.title} added to the queue.` });
      alert(`${downloadOptions.title} added to the queue (MOCK).`);
      onOpenChange(false); // Close dialog on success
      // Reset form (optional)
      setVideoUrl('');
    } catch (error) {
      console.error('Failed to add download to queue:', error);
      // toast({ title: 'Error Adding Download', description: (error as Error).message, variant: 'destructive' });
      alert(`Error adding download: ${(error as Error).message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Download Video</DialogTitle>
          <DialogDescription className="mb-4">
            Paste a YouTube video URL to download. Options will appear once the video is detected.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="video-url" className="text-right">
              Video URL
            </Label>
            <Input
              id="video-url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="col-span-3"
            />
          </div>

          {isLoadingPreview && <p className="text-sm text-muted-foreground text-center">Loading preview...</p>}
          {videoPreview && !isLoadingPreview && (
            <div className="border p-4 rounded-md bg-muted/50">
              <h4 className="font-semibold mb-2 truncate" title={videoPreview.title}>{videoPreview.title}</h4>
              <img src={videoPreview.thumbnailUrl} alt={videoPreview.title} className="w-full h-auto rounded-md aspect-video object-cover" />
              {videoPreview.duration && <p className="text-xs text-muted-foreground mt-1">Duration: {videoPreview.duration}</p>}
            </div>
          )}

          {videoPreview && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quality" className="text-right">
                  Quality
                </Label>
                <Select
                  value={selectedQuality}
                  onValueChange={setSelectedQuality}
                  disabled={isLoadingQualities || qualityOptions.length === 0}
                >
                  <SelectTrigger id="quality" className="col-span-3">
                    <SelectValue placeholder={isLoadingQualities ? "Loading qualities..." : "Select quality"} />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                    {qualityOptions.length === 0 && !isLoadingQualities && (
                      <SelectItem value="no-options" disabled>No quality options found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="format" className="text-right">
                  Format
                </Label>
                <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as 'mp4' | 'mp3')}>
                  <SelectTrigger id="format" className="col-span-3">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4">MP4 (Video)</SelectItem>
                    <SelectItem value="mp3">MP3 (Audio Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subtitles" className="text-right col-span-1 self-center">
                  Subtitles
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox
                    id="subtitles"
                    checked={includeSubtitles}
                    onCheckedChange={(checked: boolean | 'indeterminate') => setIncludeSubtitles(checked === true)}
                  />
                  <label
                    htmlFor="subtitles"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include subtitles when available
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="download-path" className="text-right">
                  Save to
                </Label>
                <Input
                  id="download-path"
                  value={downloadPath}
                  readOnly
                  className="col-span-2"
                  placeholder="Click 'Select Location'"
                />
                <Button variant="outline" onClick={handleSelectLocation} className="col-span-1">
                  Select Location
                </Button>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleAddToQueue}
            disabled={!videoUrl || !selectedQuality || !downloadPath || isLoadingPreview || isLoadingQualities}
          >
            Add to Download Queue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadVideoDialog;