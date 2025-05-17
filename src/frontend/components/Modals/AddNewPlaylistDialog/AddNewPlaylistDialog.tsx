/// <reference path="../../../renderer.d.ts" />
import React, { useState, useEffect, useCallback } from 'react';
// Use alias for Shadcn UI components
import { Button } from '@/frontend/components/ui/button'; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/frontend/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/frontend/components/ui/tabs';
import { Input } from '@/frontend/components/ui/input';
import { Textarea } from '@/frontend/components/ui/textarea';
import { Label } from '@/frontend/components/ui/label';
import { YoutubeIcon, ListPlus, Loader2, Film, Clock, XIcon, ExternalLink, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/frontend/components/ui/checkbox';

// Import mutation hooks and payload types
import { useCreatePlaylist, useImportYouTubePlaylist } from '../../../hooks/usePlaylistQueries';
import { CreatePlaylistPayload, ImportYouTubePlaylistPayload, PlaylistPreviewData, PlaylistEntryPreview } from '../../../../shared/types';
import CachedImage from '../../CachedImage'; // Assuming path
import { formatDuration } from '@/frontend/utils/formatting'; // Assuming path

interface AddNewPlaylistDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(playlist\?list=|embed\/videoseries\?list=|watch\?v=[^&]+&list=)([^\s&]+)/;
const DEBOUNCE_DELAY = 750; // milliseconds
const MAX_TITLE_LENGTH = 150;
const MAX_DESC_LENGTH = 5000;

const AddNewPlaylistDialog: React.FC<AddNewPlaylistDialogProps> = ({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('fromYouTube');

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  // State for playlist preview
  const [playlistPreview, setPlaylistPreview] = useState<PlaylistPreviewData | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const createPlaylistMutation = useCreatePlaylist();
  const importYouTubePlaylistMutation = useImportYouTubePlaylist();

  const isLoading = createPlaylistMutation.isPending || importYouTubePlaylistMutation.isPending || isPreviewLoading;

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  const resetPreviewState = useCallback(() => {
    setPlaylistPreview(null);
    setIsPreviewLoading(false);
    setPreviewError(null);
  }, []);

  const resetFormAndClose = useCallback(() => {
    setYoutubeUrl('');
    setCustomTitle('');
    setCustomDescription('');
    setFormError(null);
    resetPreviewState();
    createPlaylistMutation.reset();
    importYouTubePlaylistMutation.reset();
  }, [resetPreviewState, createPlaylistMutation, importYouTubePlaylistMutation]);
  
  const handleOpenChange = useCallback((isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
        resetFormAndClose();
    }
  }, [onOpenChange, resetFormAndClose]);

  // Debounced effect for fetching playlist preview
  useEffect(() => {
    if (activeTab !== 'fromYouTube' || !youtubeUrl.trim()) {
      resetPreviewState();
      // Clear formError specifically if it was about invalid URL, to avoid sticky unrelated form errors
      if (formError === 'Please enter a valid YouTube playlist URL.') {
        setFormError(null);
      }
      return;
    }

    if (!URL_REGEX.test(youtubeUrl)) {
      setPreviewError('Please enter a valid YouTube playlist URL.');
      setPlaylistPreview(null);
      setIsPreviewLoading(false);
      return;
    } else {
      setPreviewError(null); // Clear error if URL becomes valid
    }

    const fetchPreview = async () => {
      const startTime = performance.now(); // Start timer
      setIsPreviewLoading(true);
      setPreviewError(null); // Already cleared above or will be reset by success/failure
      setPlaylistPreview(null);
      try {
        // Call the new getQuickPlaylistPreview for initial, fast fetching
        const response = await window.electronAPI.ytDlp.getQuickPlaylistPreview(youtubeUrl);
        const endTime = performance.now(); // End timer
        console.log(`[AddNewPlaylistDialog] Preview metadata fetch took ${(endTime - startTime).toFixed(2)}ms`); // Log duration
        
        if (response.success && response.data) {
          const metadata = response.data;
          // Ensure metadata and its essential fields are present.
          // The check for metadata.entries might be too strict if we solely rely on backend aggregates for preview.
          // However, title and a way to get a thumbnail are essential for preview.
          if (metadata && metadata.title) { 
            // Frontend logging
            // console.log('[AddNewPlaylistDialog] Raw metadata for preview:', JSON.stringify(metadata, null, 2));
            // console.log('[AddNewPlaylistDialog] Playlist-level thumbnail from metadata:', metadata.thumbnailUrl);
            
            // Directly use total_duration_seconds from backend metadata
            setPlaylistPreview({
              id: metadata.id || youtubeUrl, 
              title: metadata.title,
              thumbnailUrl: metadata.thumbnailUrl, // Directly use the thumbnail from backend preview data
              videoCount: metadata.videoCount,      // Directly use videoCount from backend preview data
              total_duration_seconds: metadata.total_duration_seconds, // Use snake_case from backend
              uploader: metadata.uploader,
              webpage_url: metadata.webpage_url || youtubeUrl,
              isDurationApproximate: metadata.isDurationApproximate, // Use backend flag
            });
          } else {
            throw new Error('Invalid or incomplete metadata received for preview.');
          }
        } else {
          throw new Error(response.error || 'Failed to fetch playlist details from IPC.');
        }
      } catch (err: any) {
        const rawErrorMessage = err.message || 'Failed to fetch playlist details.';
        if (rawErrorMessage.includes('This playlist type is unviewable')) {
          setPreviewError('This type of YouTube playlist (e.g., Mixes or Radio) cannot be imported.');
        } else {
          setPreviewError(rawErrorMessage);
        }
        setPlaylistPreview(null);
      } finally {
        setIsPreviewLoading(false);
      }
    };
    const timerId = setTimeout(fetchPreview, DEBOUNCE_DELAY); // Debounce
    return () => clearTimeout(timerId); // Cleanup timeout
  }, [youtubeUrl, activeTab, resetPreviewState]);

  const handleSubmit = async () => {
    setFormError(null); // Reset form error

    if (activeTab === 'fromYouTube') {
      if (!youtubeUrl || !URL_REGEX.test(youtubeUrl)) {
        // Only set formError if previewError isn't already showing this exact message
        if (previewError !== 'Please enter a valid YouTube playlist URL.') {
          setFormError('Please enter a valid YouTube playlist URL.');
        }
        return;
      }
      if (!playlistPreview || !playlistPreview.id) { 
        setFormError('Could not fetch playlist details. Please check the URL and try again.');
        return;
      }

      try {
        // Construct payload according to ImportYouTubePlaylistPayload type
        const importPayload: ImportYouTubePlaylistPayload = {
          youtubePlaylistUrl: youtubeUrl, // The primary identifier for the backend
          customName: playlistPreview.title, // Use title from the already fetched preview
        };
        
        // console.log('[AddNewPlaylistDialog] Submitting import payload:', JSON.stringify(importPayload, null, 2));

        importYouTubePlaylistMutation.mutate(importPayload, {
          onSuccess: (data) => {
            // console.log('Playlist imported successfully:', data);
            resetFormAndClose();
            onOpenChange(false);
          },
          onError: (error: Error) => {
            console.error('Error importing playlist:', error);
            setFormError(error.message || 'An unknown error occurred during import.');
          },
        });

      } catch (error: any) {
        // This catch block might now only catch errors from the mutation itself,
        // or if something unexpected happens before it.
        // setIsPreviewLoading(false); // No longer needed here as the loading state was removed
        console.error('Error during import submission process:', error);
        setFormError(error.message || 'Failed to process YouTube playlist for import.');
      }

    } else { // Custom playlist
      if (!customTitle.trim()) {
        setFormError('Playlist title cannot be empty.');
        return;
      }
      if (customTitle.length > MAX_TITLE_LENGTH) {
        setFormError(`Title cannot exceed ${MAX_TITLE_LENGTH} characters.`);
        return;
      }
      if (customDescription.length > MAX_DESC_LENGTH) {
        setFormError(`Description cannot exceed ${MAX_DESC_LENGTH} characters.`);
        return;
      }

      const payload: CreatePlaylistPayload = {
        name: customTitle, // Changed from title to name to match CreatePlaylistPayload type
        description: customDescription,
      };
      createPlaylistMutation.mutate(payload, {
        onSuccess: (data) => {
          // console.log('Playlist created successfully:', data);
          resetFormAndClose();
          onOpenChange(false);
        },
        onError: (error: Error) => {
          console.error('Error creating playlist:', error);
          setFormError(error.message || 'An unknown error occurred.');
        },
      });
    }
  };

  const handleTabChange = (newTab: string) => {
    if (newTab === 'fromYouTube' && activeTab === 'customPlaylist') {
      resetPreviewState(); // Explicitly reset preview when switching away from YouTube tab
      setYoutubeUrl(''); // Clear youtube URL as well
    } else if (newTab === 'customPlaylist' && activeTab === 'fromYouTube') {
      resetPreviewState(); // Explicitly reset preview when switching away from custom playlist tab
      setYoutubeUrl(''); // Clear youtube URL as well
    }
    setActiveTab(newTab);
    setFormError(null); // Clear general form errors on any tab switch
    // resetPreviewState(); // Let useEffect handle preview state based on youtubeUrl and activeTab
  };

  const mutationErrorMessage = importYouTubePlaylistMutation.error?.message || createPlaylistMutation.error?.message;
  const displayError = formError || previewError || mutationErrorMessage;

  const [isUrlInputFocused, setIsUrlInputFocused] = useState(false);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[525px] md:max-w-[650px] lg:max-w-[750px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Playlist</DialogTitle>
          <DialogDescription>
            Create a new custom playlist or import one from YouTube.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar spacing */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fromYouTube">
                <YoutubeIcon className="mr-2 h-4 w-4" /> From YouTube
              </TabsTrigger>
              <TabsTrigger value="customPlaylist">
                <ListPlus className="mr-2 h-4 w-4" /> Custom Playlist
              </TabsTrigger>
            </TabsList>

            {/* YouTube Import Tab */}
            <TabsContent value="fromYouTube" className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="youtubeUrl">YouTube Playlist URL</Label>
                <div className="relative flex items-center"> {/* Wrapper for input and clear button */}
                  <Input
                    id="youtubeUrl"
                    placeholder="https://www.youtube.com/playlist?list=PL..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    disabled={isLoading}
                    className="bg-slate-100 dark:bg-zinc-800 focus-visible:ring-0 focus-visible:ring-offset-0 pr-8" /* Add padding for the X button */
                  />
                  {youtubeUrl && !isLoading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setYoutubeUrl('');
                        resetPreviewState(); // Reset preview when URL is cleared
                      }}
                      aria-label="Clear URL"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {isPreviewLoading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>Loading preview...</span>
                </div>
              )}

              {playlistPreview && !isPreviewLoading && !previewError && (
                <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                  <div className="flex items-start space-x-3">
                    <CachedImage
                      src={playlistPreview.thumbnailUrl || ''}
                      alt={`Thumbnail for ${playlistPreview.title}`}
                      className="w-28 h-auto aspect-video rounded object-cover"
                    />
                    <div className="flex-1 min-w-0"> {/* Added min-w-0 for truncation */}
                      <h4 className="text-sm font-medium leading-none truncate" title={playlistPreview?.title ?? ''}>
                        {playlistPreview?.title ?? ''}
                      </h4>
                      {playlistPreview.uploader && (
                        <p className="text-sm text-muted-foreground truncate">
                          By: {playlistPreview.uploader}
                        </p>
                      )}
                      {/* Container for video count and duration */}
                      <div className="text-sm text-muted-foreground flex items-center">
                        <span>{playlistPreview.videoCount} videos</span>
                        {playlistPreview.total_duration_seconds && playlistPreview.total_duration_seconds > 0 && (
                          <>
                            <span className="mx-1">•</span>
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{formatDuration(playlistPreview.total_duration_seconds)}</span>
                          </>
                        )}
                      </div>
                      {playlistPreview.webpage_url && (
                        <a
                          href={playlistPreview.webpage_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline inline-flex items-center mt-1"
                        >
                          View on YouTube <ExternalLink size={12} className="ml-1" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Custom Playlist Tab */}
            <TabsContent value="customPlaylist" className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="customTitle">Playlist Title</Label>
                <Input
                  id="customTitle"
                  placeholder="My Awesome Mix"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  maxLength={MAX_TITLE_LENGTH}
                  disabled={isLoading}
                  className="bg-slate-100 dark:bg-zinc-800 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {customTitle.length}/{MAX_TITLE_LENGTH}
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="customDescription">Description (Optional)</Label>
                <Textarea
                  id="customDescription"
                  placeholder="A short description of your playlist..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={3}
                  maxLength={MAX_DESC_LENGTH}
                  disabled={isLoading}
                  className="bg-slate-100 dark:bg-zinc-800 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {customDescription.length}/{MAX_DESC_LENGTH}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {displayError && (
          <div className="mt-2 flex items-center text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-md border border-red-300 dark:border-red-700">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>{displayError}</p>
          </div>
        )}

        <DialogFooter className="mt-4 pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={
              isLoading || 
              (activeTab === 'fromYouTube' && (!playlistPreview || !!previewError)) ||
              (activeTab === 'customPlaylist' && !customTitle.trim())
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {activeTab === 'fromYouTube' ? 'Import Playlist' : 'Create Playlist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewPlaylistDialog;