import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/frontend/components/ui/dialog'; // Adjust path as necessary
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Label } from '@/frontend/components/ui/label';
import { Loader2, AlertTriangle, XIcon, YoutubeIcon, ImageOff as ImageOffIcon } from 'lucide-react'; // Import YoutubeIcon and ImageOffIcon
import { debounce } from 'lodash'; // For debouncing URL input
import CachedImage from '@/frontend/components/CachedImage'; // Import CachedImage
import { useAddVideoToCustomPlaylist } from '@/frontend/hooks/usePlaylistQueries'; // Import the hook
import { YtDlpVideoInfoRaw } from '../../../../shared/types/yt-dlp'; // Corrected import path for YtDlpVideoInfoRaw

// Define a type for the video preview data - removed cached path
interface VideoPreviewData {
  videoId: string;
  thumbnailUrl: string; // Will now hold the reliable hqdefault URL
  title: string;
  channelName: string;
  duration: string; // Formatted duration string e.g., "3:45" or "1:20:30"
  uploadDate: string; // Formatted date string e.g., "Oct 22, 2021" or "2 years ago"
  webpageUrl: string; // Made non-optional to match shared type and usage
}

interface AddVideoToPlaylistDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  playlistId: string;
  playlistName: string;
}

const AddVideoToPlaylistDialog: React.FC<AddVideoToPlaylistDialogProps> = ({
  isOpen,
  onOpenChange,
  playlistId,
  playlistName,
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null); // Ref for the input element

  // Use the mutation hook
  const addVideoMutation = useAddVideoToCustomPlaylist();

  // State for video preview
  const [videoPreview, setVideoPreview] = useState<VideoPreviewData | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [isUrlInputFocused, setIsUrlInputFocused] = useState(false);

  // --- UNCOMMENT THIS useEffect --- 
  // /*
  useEffect(() => {
    if (isOpen) {
      console.log("[AddVideoDialog useEffect] Running due to isOpen changing"); 
      setVideoUrl('');
      setError(null);
      addVideoMutation.reset(); // <-- UNCOMMENTED
      setVideoPreview(null); 
      setIsPreviewLoading(false); 
      setPreviewError(null); 
    }
  }, [isOpen]); // Keep dependencies as only [isOpen] 
  // */
  // --------------------------------

  // Debounced function to fetch video preview
  const fetchVideoPreviewDebounced = debounce(async (url: string) => {
    if (!url.trim()) {
      setVideoPreview(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
      return;
    }

    // Updated YouTube URL regex to be more permissive for video and playlist URLs
    const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|playlist\?list=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)(.*)?$/;

    try {
      new URL(url); // Still good to check for general URL validity first
      if (!youtubeUrlRegex.test(url)) { // Test against the more permissive regex
        setVideoPreview(null);
        setPreviewError('Invalid YouTube URL format. Please enter a valid link to a YouTube video or playlist.');
        setIsPreviewLoading(false);
        return;
      }

      // If validation passes, clear any previous preview error
      setPreviewError(null);
      setIsPreviewLoading(true);
      setVideoPreview(null);

      const metadataResponse = await window.electronAPI.ytDlp.ytDlpGetVideoMetadataForPreview(url);

      if (metadataResponse.success && metadataResponse.data) {
        // Explicitly cast to YtDlpVideoInfoRaw to ensure correct property access for the linter
        const rawData = metadataResponse.data as YtDlpVideoInfoRaw;

        const formattedData: VideoPreviewData = {
          videoId: rawData.id,
          thumbnailUrl: rawData.thumbnail ?? '', // Ensure string type, default to empty if undefined
          title: rawData.title,
          channelName: rawData.channelName ?? '', // Provide '' if channelName is undefined
          duration: formatDuration(rawData.duration ?? 0), // Provide 0 if duration is undefined
          uploadDate: formatUploadDate(rawData.upload_date ?? ''), // Provide '' if upload_date is undefined
          webpageUrl: rawData.webpageUrl || url,
        };
        setVideoPreview(formattedData); // Set the preview data
        setPreviewError(null);

        // --- REMOVED Fetching cached thumbnail path --- 

      } else {
        // Prioritize error message from backend response
        setVideoPreview(null);
        setPreviewError(metadataResponse.error || 'Could not retrieve video details. Please check the URL.');
      }

    } catch (err: any) {
      setVideoPreview(null);
      // This catch block handles errors from the ipcRenderer.invoke itself (e.g., channel not found, preload issue)
      // or if the backend promise was explicitly rejected with an Error object that doesn't follow IpcResponse.
      console.error("IPC or unhandled error in fetchVideoPreviewDebounced:", err);
      setPreviewError(err.message || 'An unexpected error occurred while fetching video details.');
    } finally {
      setIsPreviewLoading(false);
    }
  }, 750); // 750ms debounce

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    console.log("[AddVideoDialog] handleUrlChange - newUrl:", newUrl); // Log URL change
    setVideoUrl(newUrl);
    if (newUrl.trim()) {
      fetchVideoPreviewDebounced(newUrl);
    } else {
      setVideoPreview(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
    }
  };

  const clearUrlInput = () => {
    setVideoUrl('');
    setVideoPreview(null);
    setPreviewError(null);
    setIsPreviewLoading(false);
    if (urlInputRef.current) {
      urlInputRef.current.focus();
    }
  };

  // Helper function to format duration from seconds to MM:SS or HH:MM:SS
  const formatDuration = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '--:--';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const paddedSeconds = seconds.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${paddedMinutes}:${paddedSeconds}`;
  };

  // Helper function to format upload date from YYYYMMDD to a readable string
  // This is a basic formatter. For "x time ago", a library like date-fns would be better.
  const formatUploadDate = (yyyymmdd: string): string => {
    if (!yyyymmdd || yyyymmdd.length !== 8) return 'Unknown date';
    try {
      const year = parseInt(yyyymmdd.substring(0, 4), 10);
      const month = parseInt(yyyymmdd.substring(4, 6), 10) -1; // Month is 0-indexed
      const day = parseInt(yyyymmdd.substring(6, 8), 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!videoUrl || !videoPreview) {
      setError('Please enter a valid YouTube URL and wait for the preview.');
      return;
    }

    console.log(`[AddVideoToPlaylistDialog] Submitting video ${videoUrl} to playlist ${playlistId}`);

    addVideoMutation.mutate(
      { playlistId, videoUrl },
      {
        onSuccess: (response) => {
      if (response.success) {
            console.log('[AddVideoToPlaylistDialog] Video added successfully via hook.');
        onOpenChange(false);
      } else {
            console.error('[AddVideoToPlaylistDialog] Mutation succeeded but backend reported failure:', response.error);
            setError(response.error || 'An unknown error occurred after adding the video.');
      }
        },
        onError: (mutationError) => {
          console.error('[AddVideoToPlaylistDialog] Mutation failed:', mutationError);
          setError(mutationError.message || 'Failed to add video. Please try again.');
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Video to Playlist</DialogTitle>
          <DialogDescription>
            Add a video to "{playlistName}" playlist.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="flex items-center space-x-2">
            <YoutubeIcon className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-medium">Add YouTube Video</h3>
          </div>
          
          <div>
            <Label htmlFor="videoUrl" className="block text-sm font-medium text-neutral-300 mb-1">
              YouTube Video URL
            </Label>
            <div className="relative flex items-center">
              <Input
                id="videoUrl"
                ref={urlInputRef} // Assign ref
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={handleUrlChange}
                onFocus={() => setIsUrlInputFocused(true)}
                onBlur={() => setIsUrlInputFocused(false)}
                style={{ boxShadow: 'none', '--tw-ring-shadow': 'none', '--tw-ring-color': 'transparent' } as React.CSSProperties }
                className="w-full pr-10 bg-neutral-700 border border-neutral-600 placeholder-neutral-500 text-white focus:ring-0 focus:ring-transparent"
              />
              {videoUrl && !addVideoMutation.isPending && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-neutral-400 hover:text-white"
                  onClick={clearUrlInput}
                  aria-label="Clear URL input"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-neutral-400">
              Enter the full URL of a YouTube video you want to add to this playlist.
            </p>
          </div>

          {/* Loading/Error/Preview Section */}
          <div className="mt-4 min-h-[100px]"> {/* Added min-height */}
            {isPreviewLoading ? (
              <div className="flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Loading preview...</span>
            </div>
            ) : previewError ? (
              <div className="flex items-center text-destructive">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{previewError}</span>
            </div>
            ) : videoPreview ? (
              <div className="flex items-start space-x-4 p-3 bg-card border border-border rounded-lg">
                <div className='w-28 h-16 sm:w-32 sm:h-[72px] rounded object-cover flex-shrink-0 bg-muted flex items-center justify-center'>
              <CachedImage 
                src={videoPreview.thumbnailUrl} 
                    alt={`Thumbnail for ${videoPreview.title}`}
                    className="w-full h-full object-cover"
                    onLoad={() => console.log('CachedImage loaded')}
                    onError={() => console.log('CachedImage error')}
                  />
                </div>
                <div className="min-w-0 flex-grow">
                  <div className="flex-grow min-w-0">
                    <p className="text-base font-medium text-foreground w-full" title={videoPreview.title}>
                    {videoPreview.title}
                    </p>
                    {videoPreview.channelName && (
                      <p className="text-sm text-muted-foreground mt-1 truncate w-full" title={videoPreview.channelName}>
                    {videoPreview.channelName}
                  </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {videoPreview.duration} &bull; {videoPreview.uploadDate}
                  </p>
                {videoPreview.webpageUrl && (
                  <a 
                    href={videoPreview.webpageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                      className="mt-1 text-xs text-blue-400 hover:text-blue-300 hover:underline inline-block"
                    onClick={(e) => {
                      e.preventDefault();
                      window.electronAPI.shell.openExternal(videoPreview.webpageUrl);
                    }}
                  >
                    View on YouTube
                  </a>
                )}
              </div>
            </div>
            ) : null}
          </div>

          {/* Submission Error Display */}
          {error && (
            <div className="text-sm text-destructive flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0"/>
              {error}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={addVideoMutation.isPending} className="hover:bg-neutral-700">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              onClick={handleSubmit} 
              disabled={addVideoMutation.isPending || !videoPreview || !!previewError || isPreviewLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {addVideoMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {addVideoMutation.isPending ? 'Adding...' : 'Add Video'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVideoToPlaylistDialog; 