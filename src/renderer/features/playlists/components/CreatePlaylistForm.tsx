import React, { useState } from 'react';
import { useCreatePlaylist, useImportPlaylist } from '../../../services/queryHooks';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';

function CreatePlaylistForm() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportMode, setIsImportMode] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [autoDownload, setAutoDownload] = useState(false);
  const [downloadHighestQuality, setDownloadHighestQuality] = useState(false);
  const [urlError, setUrlError] = useState('');

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
    setIsImportMode(false);
    setIsFormOpen(false);
  };

  // Validate YouTube URL
  const validateYouTubeUrl = (url: string): boolean => {
    // Simple validation for YouTube playlist URLs
    const youtubePlaylistRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.*(\?|&)list=/;
    return youtubePlaylistRegex.test(url);
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

  // Separate submission logic from event handling
  function submitForm() {
    if (isImportMode) {
      if (!url) return;
      if (!validateYouTubeUrl(url)) {
        setUrlError('Please enter a valid YouTube playlist URL');
        return;
      }
      
      importPlaylistMutation.mutate(url, {
        onSuccess: () => resetForm()
      });
    } else {
      if (!name) return;
      createPlaylistMutation.mutate(
        {
          name,
          description,
          videos: [],
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

  // If the form is closed, only show the button
  if (!isFormOpen) {
    return (
      <div className="mb-6">
        <Button
          onClick={() => setIsFormOpen(true)}
          className="w-full py-6"
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create New Playlist
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {isImportMode ? 'Import Playlist' : 'Create Playlist'}
        </h2>
        <div className="flex space-x-2">
          <Button
            variant={!isImportMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsImportMode(false)}
          >
            Create
          </Button>
          <Button
            variant={isImportMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsImportMode(true)}
          >
            Import
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/20 text-destructive border border-destructive/50 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error.message}</span>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); submitForm(); }}>
        {isImportMode ? (
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
                onCheckedChange={(checked) => setAutoDownload(checked as boolean)}
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
                  onCheckedChange={(checked) => setDownloadHighestQuality(checked as boolean)}
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
          <Button
            type="submit"
            disabled={isLoading || (isImportMode && !!urlError)}
          >
            {isLoading ? 'Processing...' : isImportMode ? 'Import' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreatePlaylistForm; 