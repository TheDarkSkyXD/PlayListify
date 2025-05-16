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
import { YoutubeIcon, ListPlus, ChevronDown, ChevronUp, Loader2, ExternalLink, Film, Clock, Tag, XIcon } from 'lucide-react';
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
    onOpenChange(false);
  }, [onOpenChange, resetPreviewState, createPlaylistMutation, importYouTubePlaylistMutation]);
  
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
            
            // Directly use totalDurationSeconds from backend metadata
            setPlaylistPreview({
              id: metadata.id || youtubeUrl, 
              title: metadata.title,
              thumbnailUrl: metadata.thumbnailUrl, // Directly use the thumbnail from backend preview data
              videoCount: metadata.videoCount,      // Directly use videoCount from backend preview data
              totalDurationSeconds: metadata.totalDurationSeconds, // Directly use from backend
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
    fetchPreview();
  }, [youtubeUrl, activeTab, resetPreviewState]);

  const handleSubmit = async () => {
    setFormError(null); // Reset form error

    if (activeTab === 'fromYouTube') {
      if (!youtubeUrl || !URL_REGEX.test(youtubeUrl)) {
        setFormError('Please enter a valid YouTube playlist URL.');
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
      // Using MAX_TITLE_LENGTH for description as MAX_DESCRIPTION_LENGTH is not defined
      // Consider defining a specific MAX_DESCRIPTION_LENGTH if needed.
      if (customDescription.length > MAX_TITLE_LENGTH) { 
        setFormError(`Description cannot exceed ${MAX_TITLE_LENGTH} characters.`);
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
      setYoutubeUrl(''); // Clears URL and triggers useEffect to reset preview
    }
    setActiveTab(newTab);
    setFormError(null); // Clear general form errors on any tab switch
    // resetPreviewState(); // Let useEffect handle preview state based on youtubeUrl and activeTab
  };

  const mutationErrorMessage = importYouTubePlaylistMutation.error?.message || createPlaylistMutation.error?.message;
  const displayError = formError || previewError || mutationErrorMessage;

  const MAX_TITLE_LENGTH = 150;
  const MAX_DESC_LENGTH = 5000;

  const [isUrlInputFocused, setIsUrlInputFocused] = useState(false);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <div onClick={() => onOpenChange(true)}>{trigger}</div>
      )}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Playlist</DialogTitle>
          <DialogDescription>
            Create a new custom playlist or import one directly from YouTube.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fromYouTube" disabled={isLoading && activeTab !== 'fromYouTube'}>
              <YoutubeIcon className="mr-2 h-4 w-4" /> From YouTube
            </TabsTrigger>
            <TabsTrigger value="customPlaylist" disabled={isLoading && activeTab !== 'customPlaylist'}>
              <ListPlus className="mr-2 h-4 w-4" /> Custom Playlist
            </TabsTrigger>
          </TabsList>

          <TabsContent 
            value="fromYouTube" 
            className="space-y-4 py-4 overflow-y-auto max-h-[calc(100vh-22rem)]"
          >
            <div>
              <Label htmlFor="youtubeUrl" className="mb-1">YouTube Playlist URL</Label>
              <div className="relative flex items-center">
                <Input
                  id="youtubeUrl"
                  placeholder="https://www.youtube.com/playlist?list=PLxxxxxx"
                  value={youtubeUrl}
                  onChange={(e) => {
                      setYoutubeUrl(e.target.value);
                  }}
                  onFocus={() => setIsUrlInputFocused(true)}
                  onBlur={() => setIsUrlInputFocused(false)}
                  disabled={isLoading && activeTab === 'fromYouTube'}
                  style={{ boxShadow: 'none', '--tw-ring-shadow': 'none', '--tw-ring-color': 'transparent' } as React.CSSProperties }
                  className="w-full pr-8 focus:ring-0 focus:ring-transparent focus-within:ring-0 focus-within:ring-transparent border border-neutral-600 bg-neutral-700"
                />
                {youtubeUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 h-7 w-7 rounded-full text-muted-foreground hover:text-primary"
                    onClick={() => setYoutubeUrl('')} // Clears URL, useEffect will reset preview
                    aria-label="Clear YouTube URL"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Paste the full URL of the YouTube playlist you want to import.
            </p>
            
            {isPreviewLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="ml-2 text-sm text-muted-foreground">Fetching playlist info...</p>
              </div>
            )}

            {previewError && !isPreviewLoading && (
              <p className="text-sm text-red-500 dark:text-red-400">{previewError}</p>
            )}

            {playlistPreview && !isPreviewLoading && !previewError && (
              <div className="p-4 border border-neutral-700 rounded-md flex space-x-5 bg-neutral-800/30 w-full items-stretch min-h-[140px]">
                <CachedImage 
                  src={(playlistPreview?.thumbnailUrl ?? '') as string}
                  alt={`Thumbnail for ${playlistPreview?.title ?? ''}`}
                  className="w-56 aspect-video h-full object-cover rounded flex-shrink-0 bg-neutral-700"
                  width={224}
                />
                <div className="flex flex-col justify-between h-full min-w-0 flex-grow">
                  <div>
                    <h4 className="text-lg font-semibold text-neutral-100 break-words" title={playlistPreview?.title ?? ''}>
                      {playlistPreview?.title ?? ''}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      By: {playlistPreview.uploader || 'N/A'}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                      <Film size={14} /> <span>{playlistPreview.videoCount} videos</span>
                      <Clock size={14} />
                      <span>
                        {typeof playlistPreview.totalDurationSeconds === 'number' && playlistPreview.totalDurationSeconds >= 0
                          ? `${playlistPreview.isDurationApproximate ? '~ ' : ''}Duration: ${formatDuration(playlistPreview.totalDurationSeconds)}`
                          : 'Duration: Unavailable'}
                      </span>
                    </div>
                  </div>
                  {playlistPreview.webpage_url && (
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                      <ExternalLink size={14} />
                      <a href={playlistPreview.webpage_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary">
                        View on YouTube
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent 
            value="customPlaylist" 
            className="space-y-4 py-4 overflow-y-auto max-h-[calc(100vh-22rem)]"
          >
            <div>
              <Label htmlFor="customTitle" className="mb-1">Playlist Title</Label>
              <Input
                id="customTitle"
                placeholder="Enter playlist title"
                value={customTitle}
                onChange={(e) => {
                  setCustomTitle(e.target.value);
                }}
                disabled={isLoading && activeTab === 'customPlaylist'}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="customDescription" className="mb-1">Playlist Description</Label>
              <Textarea
                id="customDescription"
                placeholder="Enter playlist description"
                value={customDescription}
                onChange={(e) => {
                  setCustomDescription(e.target.value);
                }}
                disabled={isLoading && activeTab === 'customPlaylist'}
                className="w-full"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Create Playlist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewPlaylistDialog;