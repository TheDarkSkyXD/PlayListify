import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, Music } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface AddPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistAdded: (playlist: any) => void;
}

interface PlaylistPreview {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoCount: number;
  uploader: string;
}

export const AddPlaylistDialog: React.FC<AddPlaylistDialogProps> = ({
  isOpen,
  onClose,
  onPlaylistAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'custom'>('youtube');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // YouTube import state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [playlistPreview, setPlaylistPreview] =
    useState<PlaylistPreview | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);

  // Custom playlist state
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when dialog closes
      setYoutubeUrl('');
      setPlaylistPreview(null);
      setCustomTitle('');
      setCustomDescription('');
      setError(null);
      setTitleError(null);
      setActiveTab('youtube');
    }
  }, [isOpen]);

  const validateYouTubeUrl = async (url: string) => {
    if (!url.trim()) {
      setPlaylistPreview(null);
      return;
    }

    setIsValidatingUrl(true);
    setError(null);

    try {
      const response = await window.api.youtube.validateUrl(url);

      if (!response.success) {
        setError(response.error || 'Invalid URL');
        setPlaylistPreview(null);
        return;
      }

      if (!response.data.isValid) {
        setError('Please enter a valid YouTube playlist URL');
        setPlaylistPreview(null);
        return;
      }

      // Get playlist metadata
      const metadataResponse = await window.api.youtube.getPlaylistMetadata(
        response.data.sanitizedUrl,
      );

      if (metadataResponse.success) {
        setPlaylistPreview({
          title: metadataResponse.data.title,
          description: metadataResponse.data.description,
          thumbnailUrl: metadataResponse.data.thumbnailUrl,
          videoCount: metadataResponse.data.videoCount,
          uploader: metadataResponse.data.uploader,
        });
        setError(null);
      } else {
        setError(
          metadataResponse.error || 'Failed to fetch playlist information',
        );
        setPlaylistPreview(null);
      }
    } catch (error) {
      setError('An unexpected error occurred while validating the URL');
      setPlaylistPreview(null);
      console.error('URL validation error:', error);
    } finally {
      setIsValidatingUrl(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);

    // Debounce URL validation
    const timeoutId = setTimeout(() => {
      validateYouTubeUrl(url);
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  const handleImportPlaylist = async () => {
    if (!playlistPreview) {
      setError('Please enter a valid YouTube playlist URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await window.api.youtube.importPlaylist(youtubeUrl);

      if (response.success) {
        onPlaylistAdded(response.data.playlist);
        onClose();
      } else {
        setError(response.error || 'Failed to import playlist');
      }
    } catch (error) {
      setError('An unexpected error occurred while importing the playlist');
      console.error('Import error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateCustomTitle = async (title: string) => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return false;
    }

    if (title.length > 255) {
      setTitleError('Title cannot exceed 255 characters');
      return false;
    }

    setTitleError(null);
    return true;
  };

  const handleCustomTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setCustomTitle(title);
    validateCustomTitle(title);
  };

  const handleCreateCustomPlaylist = async () => {
    if (!(await validateCustomTitle(customTitle))) {
      return;
    }

    if (customDescription.length > 1000) {
      setError('Description cannot exceed 1000 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await window.api.playlist.create({
        title: customTitle.trim(),
        description: customDescription.trim(),
        type: 'CUSTOM',
      });

      if (response.success) {
        onPlaylistAdded(response.data);
        onClose();
      } else {
        if (response.error.includes('already exists')) {
          setTitleError(response.error);
        } else {
          setError(response.error || 'Failed to create playlist');
        }
      }
    } catch (error) {
      setError('An unexpected error occurred while creating the playlist');
      console.error('Create playlist error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Add New Playlist</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as 'youtube' | 'custom')}
        >
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='youtube'>From YouTube</TabsTrigger>
            <TabsTrigger value='custom'>Custom Playlist</TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value='youtube' className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='youtube-url'>YouTube Playlist URL</Label>
              <Input
                id='youtube-url'
                type='url'
                value={youtubeUrl}
                onChange={handleUrlChange}
                placeholder='https://www.youtube.com/playlist?list=...'
                disabled={isLoading}
              />
              {isValidatingUrl && (
                <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span>Validating URL...</span>
                </div>
              )}
            </div>

            {playlistPreview && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Playlist Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex space-x-4'>
                    {playlistPreview.thumbnailUrl ? (
                      <img
                        src={playlistPreview.thumbnailUrl}
                        alt='Playlist thumbnail'
                        className='h-18 w-24 flex-shrink-0 rounded-md object-cover'
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className='flex h-18 w-24 flex-shrink-0 items-center justify-center rounded-md bg-muted'>
                        <Music className='h-6 w-6 text-muted-foreground' />
                      </div>
                    )}
                    <div className='flex-1 space-y-2'>
                      <h4 className='font-semibold'>{playlistPreview.title}</h4>
                      <p className='text-sm text-muted-foreground'>
                        by {playlistPreview.uploader}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {playlistPreview.videoCount} videos
                      </p>
                      {playlistPreview.description && (
                        <p className='line-clamp-3 text-sm text-muted-foreground'>
                          {playlistPreview.description.length > 200
                            ? `${playlistPreview.description.substring(0, 200)}...`
                            : playlistPreview.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value='custom' className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='custom-title'>
                Title <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='custom-title'
                type='text'
                value={customTitle}
                onChange={handleCustomTitleChange}
                placeholder='Enter playlist title'
                disabled={isLoading}
                maxLength={255}
              />
              <div className='flex items-center justify-between'>
                <span className='text-xs text-muted-foreground'>
                  {customTitle.length}/255 characters
                </span>
                {titleError && (
                  <span className='text-xs text-destructive'>{titleError}</span>
                )}
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='custom-description'>Description</Label>
              <Textarea
                id='custom-description'
                value={customDescription}
                onChange={e => setCustomDescription(e.target.value)}
                placeholder='Enter playlist description (optional)'
                disabled={isLoading}
                maxLength={1000}
                rows={4}
              />
              <div className='text-right text-xs text-muted-foreground'>
                {customDescription.length}/1000 characters
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>

          {activeTab === 'youtube' ? (
            <Button
              onClick={handleImportPlaylist}
              disabled={!playlistPreview || isLoading || isValidatingUrl}
            >
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isLoading ? 'Importing...' : 'Import Playlist'}
            </Button>
          ) : (
            <Button
              onClick={handleCreateCustomPlaylist}
              disabled={!customTitle.trim() || !!titleError || isLoading}
            >
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isLoading ? 'Creating...' : 'Create Playlist'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
