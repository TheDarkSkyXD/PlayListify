import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  // DialogFooter, // Keep for now, might use later
} from '@/frontend/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/frontend/components/ui/tabs';
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Textarea } from '@/frontend/components/ui/textarea';
import { Label } from '@/frontend/components/ui/label'; // Added Label import
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/frontend/components/ui/form';
import type { IpcResponse, Playlist, PlaylistCreateInput } from '@/shared/types'; // Added PlaylistCreateInput for clarity
import { useMutation, useQueryClient } from '@tanstack/react-query'; // For mutations
import { X, Loader2, Youtube } from 'lucide-react'; // Icons
import { debounce } from 'lodash'; // For debouncing URL input

// It's assumed a method like this will be available on window.api
// // In a .d.ts or preload.ts:
// export interface ElectronAPI {
//   // ... other methods
//   getYouTubePlaylistPreview: (url: string) => Promise<IpcResponse<Partial<Playlist>>>;
//   importYouTubePlaylist: (youtubePlaylistUrl: string) => Promise<IpcResponse<Playlist>>;
// }


const customPlaylistFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }).max(100, { message: "Title must be 100 characters or less." }),
  description: z.string().max(512, { message: "Description must be 512 characters or less." }).optional(),
});

type CustomPlaylistFormValues = z.infer<typeof customPlaylistFormSchema>;

interface AddPlaylistDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // TODO: Add a way to refetch playlists list after successful import/creation, e.g., pass queryClient.invalidateQueries
}

const AddPlaylistDialog: React.FC<AddPlaylistDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("custom");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [playlistPreview, setPlaylistPreview] = useState<Partial<Playlist> | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);


  const customPlaylistForm = useForm<CustomPlaylistFormValues>({
    resolver: zodResolver(customPlaylistFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
    mode: "onChange",
  });

  const titleValue = customPlaylistForm.watch("title");
  const descriptionValue = customPlaylistForm.watch("description");

  const createCustomPlaylistMutation = useMutation<
    IpcResponse<Playlist>, // Expected success response
    Error, // Error type
    PlaylistCreateInput // Variables type
  >({
    mutationFn: (playlistInput) => window.api.createPlaylist(playlistInput),
    onSuccess: (result) => {
      if (result.success && result.data) {
        console.log('Playlist created:', result.data);
        queryClient.invalidateQueries({ queryKey: ['playlists'] }); // Refetch playlists
        onOpenChange(false);
        customPlaylistForm.reset();
      } else {
        customPlaylistForm.setError("title", { type: "manual", message: result.error?.message || "Failed to create playlist." });
      }
    },
    onError: (error) => {
      console.error("Error creating playlist:", error);
      customPlaylistForm.setError("title", { type: "manual", message: error.message || "An unexpected error occurred." });
    },
  });

  function onCustomSubmit(data: CustomPlaylistFormValues) {
    const playlistInput: PlaylistCreateInput = {
      name: data.title,
      description: data.description,
      source: 'local' as const,
    };
    createCustomPlaylistMutation.mutate(playlistInput);
  }

  const fetchPreviewMutation = useMutation<
    IpcResponse<Partial<Playlist>>,
    Error,
    string
  >({
    mutationFn: async (url: string) => {
      // This is an assumed API method. Backend would need to implement 'get-youtube-playlist-preview' IPC handler.
      return window.api.getYouTubePlaylistPreview(url); // Removed @ts-expect-error
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        setPlaylistPreview(result.data);
        setPreviewError(null);
      } else {
        setPlaylistPreview(null);
        setPreviewError(result.error?.message || "Failed to fetch preview.");
      }
    },
    onError: (error) => {
      setPlaylistPreview(null);
      setPreviewError(error.message || "Error fetching preview.");
    },
  });

  const debouncedFetchPreview = useCallback(
    debounce((url: string) => {
      if (url && (url.includes("youtube.com/playlist?list=") || url.includes("youtu.be/playlist?list="))) {
        setPreviewError(null); // Clear previous errors
        setPlaylistPreview(null); // Clear previous preview
        fetchPreviewMutation.mutate(url);
      } else if (url) {
        setPlaylistPreview(null);
        setPreviewError("Invalid YouTube playlist URL format.");
      } else {
        setPlaylistPreview(null);
        setPreviewError(null);
      }
    }, 750), // 750ms debounce
    [fetchPreviewMutation]
  );

  useEffect(() => {
    debouncedFetchPreview(youtubeUrl);
  }, [youtubeUrl, debouncedFetchPreview]);


  const importYouTubePlaylistMutation = useMutation<
    IpcResponse<Playlist>,
    Error,
    string
  >({
    mutationFn: (url) => window.api.importYouTubePlaylist(url),
    onSuccess: (result) => {
      if (result.success && result.data) {
        console.log('YouTube Playlist import started:', result.data);
        queryClient.invalidateQueries({ queryKey: ['playlists'] }); // Refetch playlists
        // TODO: Notify user import has started (e.g. via toast, or rely on activity center updates)
        onOpenChange(false);
        setYoutubeUrl("");
        setPlaylistPreview(null);
        setPreviewError(null);
      } else {
        setPreviewError(result.error?.message || "Failed to import playlist.");
      }
    },
    onError: (error) => {
      setPreviewError(error.message || "Error importing playlist.");
    },
  });

  const handleImportYouTubePlaylist = () => {
    if (youtubeUrl && playlistPreview) { // Ensure there's a URL and a preview (implies valid URL)
        importYouTubePlaylistMutation.mutate(youtubeUrl);
    } else if (youtubeUrl && !playlistPreview && !fetchPreviewMutation.isPending && !previewError) {
      // If URL is there but no preview, and not loading/errored, try fetching preview first
      debouncedFetchPreview(youtubeUrl);
    } else if (!youtubeUrl) {
      setPreviewError("Please enter a YouTube playlist URL.");
    }
  };
  
  const handleDialogClose = () => {
    customPlaylistForm.reset();
    setYoutubeUrl("");
    setPlaylistPreview(null);
    setPreviewError(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[550px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add Playlist</DialogTitle>
          <DialogDescription className="mb-4">
            Create a new custom playlist or import one from YouTube.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Custom Playlist</TabsTrigger>
            <TabsTrigger value="youtube">Add from YouTube</TabsTrigger>
          </TabsList>
          <TabsContent value="custom">
            <Form {...customPlaylistForm}>
              <form onSubmit={customPlaylistForm.handleSubmit(onCustomSubmit)} className="space-y-6 p-4">
                <FormField
                  control={customPlaylistForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome Playlist" {...field} />
                      </FormControl>
                      <div className="flex justify-between">
                        <FormMessage />
                        <FormDescription className="text-xs">
                          {titleValue?.length || 0}/100
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={customPlaylistForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A brief description of your playlist..."
                          className="resize-none"
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <div className="flex justify-between">
                        <FormMessage />
                        <FormDescription className="text-xs">
                          {descriptionValue?.length || 0}/512
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createCustomPlaylistMutation.isPending}>
                  {createCustomPlaylistMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    "Create Playlist"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="youtube">
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">YouTube Playlist URL</Label>
                <div className="relative">
                  <Input
                    id="youtubeUrl"
                    placeholder="https://www.youtube.com/playlist?list=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="pr-8" // Padding for the clear button
                  />
                  {youtubeUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => {
                        setYoutubeUrl("");
                        setPlaylistPreview(null);
                        setPreviewError(null);
                        fetchPreviewMutation.reset();
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {previewError && <p className="text-sm text-destructive">{previewError}</p>}
              </div>

              {fetchPreviewMutation.isPending && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>Fetching preview...</span>
                </div>
              )}

              {playlistPreview && !fetchPreviewMutation.isPending && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                  <h3 className="text-lg font-semibold">Playlist Preview</h3>
                  {playlistPreview.thumbnailUrl && (
                    <img
                        src={playlistPreview.thumbnailUrl}
                        alt={playlistPreview.name || 'Playlist thumbnail'}
                        className="rounded-md object-cover w-full h-auto max-h-48"
                    />
                  )}
                  <p><strong>Title:</strong> {playlistPreview.name || 'N/A'}</p>
                  <p><strong>Videos:</strong> {playlistPreview.videoCount ?? 'N/A'}</p>
                  {/* Add other preview details if available, e.g., description */}
                  {/* <p><strong>Description:</strong> {playlistPreview.description || 'N/A'}</p> */}
                </div>
              )}
              
              <Button
                type="button"
                className="w-full"
                onClick={handleImportYouTubePlaylist}
                disabled={!youtubeUrl || fetchPreviewMutation.isPending || importYouTubePlaylistMutation.isPending || (!playlistPreview && !!youtubeUrl) }
              >
                {importYouTubePlaylistMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
                ) : (
                  <> <Youtube className="mr-2 h-4 w-4" /> Import Playlist</>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlaylistDialog;