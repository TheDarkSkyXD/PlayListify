import React, { useState } from 'react';
import { useCreatePlaylist, useImportPlaylist } from '../../../services/queryHooks';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { PlusCircle, X, Youtube, FilePlus, Import } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Video } from '../../../../shared/types/appTypes';
import { LoadingDialog } from '../../../components/LoadingDialog';
import { Skeleton } from '../../../components/ui/skeleton';

// Skeleton for the create playlist form
export function CreatePlaylistFormSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="w-full h-14" />
    </div>
  );
}

// Skeleton for the open form state
export function CreatePlaylistExpandedFormSkeleton() {
  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-10 w-52" />
      </div>
      
      <div className="space-y-4">
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div>
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-24 w-full" />
        </div>
        
        <div className="mt-4">
          <Skeleton className="h-5 w-36 mb-2" />
          <div className="flex space-x-2 mt-4 justify-end">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatePlaylistForm() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create'|'import'|'custom'>('create');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [autoDownload, setAutoDownload] = useState(false);
  const [downloadHighestQuality, setDownloadHighestQuality] = useState(false);
  const [urlError, setUrlError] = useState('');
  
  // Custom playlist with manual videos
  const [customVideos, setCustomVideos] = useState<Video[]>([]);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUrlError, setVideoUrlError] = useState('');
  
  // Loading state messages
  const [loadingMessage, setLoadingMessage] = useState('Processing...');

  const createPlaylistMutation = useCreatePlaylist();
  const importPlaylistMutation = useImportPlaylist();

  const resetForm = () => {
    setName('');
    setDescription('');
    setUrl('');
    setUrlError('');
    setAutoDownload(false);
    setDownloadHighestQuality(false);
    setIsAdvancedOpen(false);
    setFormMode('create');
    setIsFormOpen(false);
    setCustomVideos([]);
    setVideoTitle('');
    setVideoUrl('');
    setVideoUrlError('');
  };

  // Validate YouTube URL
  const validateYouTubeUrl = (url: string): boolean => {
    // Simple validation for YouTube playlist URLs
    const youtubePlaylistRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.*(\?|&)list=/;
    return youtubePlaylistRegex.test(url);
  };
  
  // Validate YouTube video URL
  const validateYouTubeVideoUrl = (url: string): boolean => {
    // Simple validation for YouTube video URLs (not playlists)
    const youtubeVideoRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
    return youtubeVideoRegex.test(url);
  };

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Only validate if there's something to validate
    if (newUrl.trim()) {
      if (!validateYouTubeUrl(newUrl)) {
        setUrlError('Please enter a valid YouTube playlist URL');
      } else {
        setUrlError('');
      }
    } else {
      setUrlError('');
    }
  };
  
  // Handle video URL input change
  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setVideoUrl(newUrl);
    
    // Only validate if there's something to validate
    if (newUrl.trim()) {
      if (!validateYouTubeVideoUrl(newUrl)) {
        setVideoUrlError('Please enter a valid YouTube video URL');
      } else {
        setVideoUrlError('');
      }
    } else {
      setVideoUrlError('');
    }
  };
  
  // Add a video to the custom playlist
  const addVideoToCustomPlaylist = () => {
    if (!videoTitle.trim()) {
      return;
    }
    
    if (videoUrl.trim() && !validateYouTubeVideoUrl(videoUrl)) {
      setVideoUrlError('Please enter a valid YouTube video URL');
      return;
    }
    
    const newVideo: Video = {
      id: uuidv4(),
      title: videoTitle,
      url: videoUrl,
      thumbnail: '', // Will be fetched from API in a real implementation
      duration: 0, // Will be fetched from API in a real implementation
      status: 'unknown',
      downloaded: false,
      addedAt: new Date().toISOString()
    };
    
    setCustomVideos([...customVideos, newVideo]);
    setVideoTitle('');
    setVideoUrl('');
    setVideoUrlError('');
  };
  
  // Remove a video from the custom playlist
  const removeVideo = (id: string) => {
    setCustomVideos(customVideos.filter(video => video.id !== id));
  };

  // Separate submission logic from event handling
  function submitForm() {
    if (formMode === 'import') {
      if (!url) return;
      if (!validateYouTubeUrl(url)) {
        setUrlError('Please enter a valid YouTube playlist URL');
        return;
      }
      
      setLoadingMessage('Importing YouTube playlist...');
      
      importPlaylistMutation.mutate(url, {
        onSuccess: () => resetForm()
      });
    } else {
      if (!name) return;
      
      // Determine if this is a custom playlist with videos or a normal empty playlist
      const videos = formMode === 'custom' ? customVideos : [];
      
      setLoadingMessage(formMode === 'custom' 
        ? 'Creating custom playlist...' 
        : 'Creating empty playlist...');
      
      createPlaylistMutation.mutate(
        {
          name,
          description,
          videos,
        },
        {
          onSuccess: () => resetForm()
        }
      );
    }
  }

  // Display loading state during mutation
  const isLoading = createPlaylistMutation.isPending || importPlaylistMutation.isPending;

  // Show an error message if there's an error
  const error = createPlaylistMutation.error || importPlaylistMutation.error;

  // If loading before form is open, show the button skeleton
  if (isLoading && !isFormOpen) {
    return <CreatePlaylistFormSkeleton />;
  }

  // If the form is closed, only show the button
  if (!isFormOpen) {
    return (
      <div className="mb-6">
        <Button
          onClick={() => setIsFormOpen(true)}
          className="w-full py-6"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Create New Playlist
        </Button>
      </div>
    );
  }

  // If loading with the form open, show the expanded form skeleton
  if (isLoading) {
    return <CreatePlaylistExpandedFormSkeleton />;
  }

  return (
    <>
      <LoadingDialog isOpen={isLoading} message={loadingMessage} />
      
      <div className="bg-card text-card-foreground rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {formMode === 'import' ? 'Import Playlist' : formMode === 'custom' ? 'Create Custom Playlist' : 'Create Playlist'}
          </h2>
          <Tabs defaultValue="create" value={formMode} onValueChange={(value: string) => setFormMode(value as 'create'|'import'|'custom')}>
            <TabsList>
              <TabsTrigger value="create">
                <FilePlus className="h-4 w-4 mr-2" />
                Empty
              </TabsTrigger>
              <TabsTrigger value="custom">
                <PlusCircle className="h-4 w-4 mr-2" />
                Custom
              </TabsTrigger>
              <TabsTrigger value="import">
                <Import className="h-4 w-4 mr-2" />
                Import
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {error && (
          <div className="bg-destructive/20 text-destructive border border-destructive/50 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error.message}</span>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); submitForm(); }}>
          {formMode === 'import' ? (
            <div className="mb-4">
              <Label htmlFor="url" className="mb-1">
                YouTube Playlist URL
              </Label>
              <Input
                id="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://www.youtube.com/playlist?list=..."
                className={urlError ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {urlError && (
                <p className="mt-1 text-sm text-destructive">{urlError}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Example: https://www.youtube.com/playlist?list=PLxxxxxxxx
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Label htmlFor="name" className="mb-1">
                  Playlist Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="description" className="mb-1">
                  Description (optional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              {/* Custom playlist video management */}
              {formMode === 'custom' && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Add Videos</h3>
                  
                  <div className="mb-4">
                    <Label htmlFor="videoTitle" className="mb-1">
                      Video Title
                    </Label>
                    <Input
                      id="videoTitle"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Enter video title"
                      className="mb-2"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <Label htmlFor="videoUrl" className="mb-1">
                      YouTube Video URL (optional)
                    </Label>
                    <Input
                      id="videoUrl"
                      value={videoUrl}
                      onChange={handleVideoUrlChange}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className={videoUrlError ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {videoUrlError && (
                      <p className="mt-1 text-sm text-destructive">{videoUrlError}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addVideoToCustomPlaylist}
                    disabled={!videoTitle.trim() || (!!videoUrl.trim() && !validateYouTubeVideoUrl(videoUrl))}
                    className="mb-4"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Video
                  </Button>
                  
                  {customVideos.length > 0 && (
                    <div className="border rounded-md p-4 mb-4">
                      <h4 className="font-medium mb-2">Videos in playlist ({customVideos.length})</h4>
                      <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {customVideos.map((video) => (
                          <li key={video.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="truncate">
                              <span className="font-medium">{video.title}</span>
                              {video.url && (
                                <div className="text-xs text-muted-foreground truncate">{video.url}</div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVideo(video.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Advanced options toggle */}
          <div className="my-4">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex items-center text-sm text-muted-foreground"
            >
              <svg
                className={`w-4 h-4 mr-1 transform transition-transform ${isAdvancedOpen ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Advanced Options
            </button>
          </div>

          {isAdvancedOpen && (
            <div className="mb-4 border rounded-lg p-4 bg-secondary/10">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="auto-download"
                  checked={autoDownload}
                  onCheckedChange={(checked) => setAutoDownload(checked === true)}
                />
                <Label htmlFor="auto-download" className="text-sm cursor-pointer">
                  Automatically download videos
                </Label>
              </div>

              {autoDownload && (
                <div className="flex items-center space-x-2 mb-3 ml-6">
                  <Checkbox
                    id="highest-quality"
                    checked={downloadHighestQuality}
                    onCheckedChange={(checked) => setDownloadHighestQuality(checked === true)}
                  />
                  <Label htmlFor="highest-quality" className="text-sm cursor-pointer">
                    Download highest quality available
                  </Label>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {formMode === 'import' ? 'Import' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

export default CreatePlaylistForm; 