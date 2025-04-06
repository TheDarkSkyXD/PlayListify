import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Loader2, Play, AlertCircle, Check } from 'lucide-react';
import { toast } from '../../../components/ui/use-toast';
import { QUERY_KEYS } from '../../../services/query/keys';
import { Playlist } from '../../../../shared/types/appTypes';

interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist;
}

export function AddVideoDialog({ open, onOpenChange, playlist }: AddVideoDialogProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [urlError, setUrlError] = useState('');
  const [videoInfo, setVideoInfo] = useState<any | null>(null);
  const lastFetchedUrl = useRef('');

  const queryClient = useQueryClient();

  // Reset form
  const resetForm = () => {
    setVideoUrl('');
    setIsValid(null);
    setUrlError('');
    setVideoInfo(null);
    lastFetchedUrl.current = '';
  };

  // Validate YouTube URL
  const validateYoutubeUrl = (url: string) => {
    // Simple regex for YouTube video URLs
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
    return youtubeRegex.test(url);
  };

  // API response structure for video validation
  interface VideoStatusResponse {
    available: boolean;
    info?: {
      id: string;
      title: string;
      url: string;
      thumbnail: string;
      duration: number;
      channel?: string;
    };
    error?: string;
  }

  // Check if URL is a valid YouTube video
  const checkVideoUrl = async (url: string) => {
    if (!url || url === lastFetchedUrl.current) return;

    setIsValidating(true);
    setIsValid(null);
    setUrlError('');
    setVideoInfo(null);

    try {
      // First do a simple regex validation
      const isValidFormat = validateYoutubeUrl(url);
      if (!isValidFormat) {
        setIsValid(false);
        setUrlError('Invalid YouTube video URL format');
        setIsValidating(false);
        return;
      }

      // Then check with the backend
      const status = await window.api.youtube.checkVideoStatus(url) as unknown as VideoStatusResponse;
      lastFetchedUrl.current = url;

      if (status && status.available) {
        setIsValid(true);
        setVideoInfo(status.info);
      } else {
        setIsValid(false);
        setUrlError(status?.error || 'Video is not available');
      }
    } catch (error: any) {
      console.error('Error checking video URL:', error);
      setIsValid(false);
      setUrlError(error.message || 'Failed to validate video URL');
    } finally {
      setIsValidating(false);
    }
  };

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);

    // Debounce validation for better UX
    if (url && url !== lastFetchedUrl.current) {
      const timeoutId = setTimeout(() => {
        checkVideoUrl(url);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  };

  // Add video mutation
  const addVideoMutation = useMutation({
    mutationFn: async (url: string) => {
      return window.api.playlists.addVideo(playlist.id, url);
    },
    onSuccess: () => {
      // Invalidate and refetch playlist query to update UI
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.playlist(playlist.id) });
      queryClient.refetchQueries({ queryKey: QUERY_KEYS.playlist(playlist.id) });

      // Also invalidate and refetch the playlists list query to update the playlists page
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.playlists] });
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.playlists] });

      toast({
        title: "Success",
        description: "Video added to playlist successfully",
        duration: 3000,
      });

      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add video to playlist",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoUrl) {
      setUrlError('Please enter a YouTube video URL');
      return;
    }

    if (!isValid) {
      setUrlError('Please enter a valid YouTube video URL');
      return;
    }

    // Add video to playlist
    addVideoMutation.mutate(videoUrl);
  };


  // No need to force the dialog to be open
  // We'll let the parent component control the open state

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Video to Playlist</DialogTitle>
          <DialogDescription>
            Enter a YouTube video URL to add it to "{playlist.name}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">YouTube Video URL</Label>
            <Input
              id="video-url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={handleUrlChange}
              className={urlError ? 'border-red-500' : ''}
            />
            {urlError && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {urlError}
              </p>
            )}
          </div>

          {isValidating && (
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="text-sm font-medium">Validating URL...</span>
              </div>
            </div>
          )}

          {isValid && videoInfo && (
            <div className="rounded-lg border p-3">
              <div className="flex items-start gap-3">
                {videoInfo.thumbnail ? (
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-24 h-auto rounded"
                  />
                ) : (
                  <div className="w-24 h-16 bg-muted flex items-center justify-center rounded">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium">Valid YouTube video</span>
                  </div>
                  <h3 className="text-sm font-medium mt-1 line-clamp-2">{videoInfo.title}</h3>
                  {videoInfo.channel && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {videoInfo.channel}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={!isValid || addVideoMutation.isPending}
              className="w-full"
            >
              {addVideoMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Video...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Add to Playlist
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
