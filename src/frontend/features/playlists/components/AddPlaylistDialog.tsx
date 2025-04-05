import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Play, FileText, Loader2, Check, Info } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../../components/ui/use-toast';
import { importService } from '../../../services/importService';
import { QUERY_KEYS } from '../../../services/query/keys';

// Function to validate YouTube URLs
function isValidYoutubeUrl(url: string): boolean {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.*$/;
  return regex.test(url);
}

interface AddPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPlaylistDialog({ open, onOpenChange }: AddPlaylistDialogProps) {
  // Form state
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);

  // Playlist info state
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [playlistInfo, setPlaylistInfo] = useState<{ title: string; videoCount: number } | null>(null);

  // Ref to track the last URL we fetched to prevent duplicate fetches
  const lastFetchedUrl = useRef<string>('');

  const queryClient = useQueryClient();

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (playlist: { name: string, description?: string, videos: any[] }) => {
      return window.api.playlists.create(playlist.name, playlist.description);
    },
    onSuccess: () => {
      // Invalidate and refetch playlists query to update UI immediately
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.playlists] });
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.playlists] });
    },
  });

  // Reset form
  const resetForm = () => {
    setPlaylistName('');
    setPlaylistUrl('');
    setPlaylistDescription('');
    setNameError('');
    setUrlError('');
    setIsValidUrl(false);
    setPlaylistInfo(null);
    lastFetchedUrl.current = ''; // Reset the last fetched URL
  };

  // Fetch playlist info when valid URL is entered
  useEffect(() => {
    const fetchPlaylistInfo = async () => {
      // Only fetch if we have a valid URL and don't already have the info for this URL
      if (isValidUrl && playlistUrl && (!playlistInfo || playlistUrl !== lastFetchedUrl.current)) {
        // Store the URL we're fetching to prevent duplicate fetches
        lastFetchedUrl.current = playlistUrl;
        setIsLoadingInfo(true);
        try {
          // Only call getPlaylistInfo - it now returns the video count too
          const info = await window.api.youtube.getPlaylistInfo(playlistUrl);

          setPlaylistInfo({
            title: info.title || 'Unknown Playlist',
            videoCount: info.videoCount || 0
          });

          // Auto-fill the playlist name if empty, using a timeout to avoid re-renders during fetch
          if (!playlistName) {
            // Use setTimeout to break the render cycle and prevent re-fetching
            setTimeout(() => {
              setPlaylistName(info.title || '');
            }, 0);
          }
        } catch (error: any) {
          console.error('Failed to fetch playlist info:', error);
          setUrlError('Could not fetch playlist information: ' + error.message);
          setPlaylistInfo(null);
        } finally {
          setIsLoadingInfo(false);
        }
      } else {
        setPlaylistInfo(null);
      }
    };

    // Use a debounce to avoid too many API calls
    const timerId = setTimeout(() => {
      fetchPlaylistInfo();
    }, 800);

    return () => clearTimeout(timerId);
  }, [playlistUrl, isValidUrl]); // Removed playlistName from dependencies to prevent re-fetching

  // Handle URL input change with validation
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPlaylistUrl(url);
    setIsValidUrl(isValidYoutubeUrl(url));
    if (url && !isValidYoutubeUrl(url)) {
      setUrlError('Please enter a valid YouTube URL');
    } else {
      setUrlError('');
    }
  };

  // Handle YouTube import form submission
  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!playlistUrl || !isValidUrl) {
      setUrlError('Please enter a valid YouTube URL');
      return;
    }

    try {
      // Always use the YouTube playlist title directly
      const name = playlistInfo?.title || `YouTube Playlist ${new Date().toLocaleDateString()}`;

      // Start the background import process but don't await it
      importService.importYoutubePlaylist(
        playlistUrl,
        name,
        playlistInfo?.title || 'YouTube Playlist'
      )
        .catch(error => {
          // This will be handled by the importService toast notifications
          console.error('Background import error:', error);
        });

      // Show toast that import has started in the background
      toast({
        title: "Import Started",
        description: `"${playlistInfo?.title || name}" import has started in the background.`,
        duration: 3000,
      });

      // Reset form and close dialog immediately
      resetForm();
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to start playlist import",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Handle custom playlist form submission
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!playlistName || playlistName.length < 2) {
      setNameError('Playlist name must be at least 2 characters');
      return;
    }

    if (playlistName.length > 100) {
      setNameError('Playlist name cannot exceed 100 characters');
      return;
    }

    if (playlistDescription.length > 5000) {
      setNameError('Playlist description cannot exceed 5000 characters');
      return;
    }

    try {
      // Create custom playlist - fire and forget
      createPlaylistMutation.mutate(
        {
          name: playlistName,
          description: playlistDescription.trim() || undefined,
          videos: [],
        },
        {
          onSuccess: () => {
            // Force a refetch of the playlists to update UI immediately
            queryClient.refetchQueries({ queryKey: [QUERY_KEYS.playlists] });

            toast({
              title: "Success",
              description: "Playlist created successfully",
              duration: 3000,
            });
          },
          onError: (error: any) => {
            toast({
              title: "Error",
              description: error.message || "Failed to create playlist",
              variant: "destructive",
              duration: 5000,
            });
          }
        }
      );

      // Show immediate feedback
      toast({
        title: "Creating Playlist",
        description: `Creating playlist "${playlistName}"`,
        duration: 2000,
      });

      // Reset form and close dialog immediately
      resetForm();
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create playlist",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Playlist</DialogTitle>
          <DialogDescription>Create a custom playlist or import one from YouTube.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="youtube" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="youtube" className="flex items-center">
              <Play className="w-4 h-4 mr-2 text-red-500" />
              From YouTube
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Custom Playlist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="youtube">
            <form onSubmit={handleYoutubeSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-url">YouTube Playlist URL</Label>
                <Input
                  id="youtube-url"
                  placeholder="https://www.youtube.com/playlist?list=..."
                  value={playlistUrl}
                  onChange={handleUrlChange}
                  className={isValidUrl && playlistUrl ? "border-green-500" : ""}
                />
                <p className="text-sm text-muted-foreground">Enter the URL of a public or unlisted YouTube playlist</p>
                {urlError && <p className="text-sm text-red-500">{urlError}</p>}
              </div>

              {isLoadingInfo && !playlistInfo && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
                  <span className="text-sm">Loading playlist information...</span>
                </div>
              )}

              {isValidUrl && playlistUrl && playlistInfo && !isLoadingInfo && (
                <div className="rounded-lg border p-4 bg-muted/30">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Playlist Information</h4>
                      <p className="text-sm font-medium mt-1">{playlistInfo.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {playlistInfo.videoCount} videos in this playlist
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        The original YouTube playlist name will be used automatically
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isValidUrl && playlistUrl && !playlistInfo && !isLoadingInfo && (
                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium">Valid YouTube playlist URL</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll fetch the playlist details and videos from YouTube
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!isValidUrl || !playlistUrl || !playlistInfo}
                >
                  Import Playlist
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="custom">
            <form onSubmit={handleCustomSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="playlist-name">Playlist Name</Label>
                <Input
                  id="playlist-name"
                  placeholder="My Awesome Playlist"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value.slice(0, 100))}
                  maxLength={100}
                />
                <div className="flex justify-between">
                  <p className="text-sm text-muted-foreground">Create a new playlist that you can add videos to later</p>
                  <p className="text-sm text-muted-foreground">{playlistName.length}/100</p>
                </div>
                {nameError && <p className="text-sm text-red-500">{nameError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="playlist-description">Description (Optional)</Label>
                <Textarea
                  id="playlist-description"
                  placeholder="Add a description for your playlist"
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value.slice(0, 5000))}
                  className="resize-none"
                  rows={3}
                  maxLength={5000}
                />
                <div className="flex justify-between">
                  <p className="text-sm text-muted-foreground">Describe what this playlist is about</p>
                  <p className="text-sm text-muted-foreground">{playlistDescription.length}/5000</p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!playlistName.trim() || playlistName.length < 2}
                >
                  Create Playlist
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}