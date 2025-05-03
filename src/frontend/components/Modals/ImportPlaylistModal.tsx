import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useGetYouTubePlaylistInfo, useImportPlaylist } from '../../hooks/usePlaylistQueries';
import { useThumbnail } from '../../hooks/useThumbnail';

// ThumbnailImage component for playlist preview
const PlaylistThumbnail = ({ thumbnailUrl, title }: { thumbnailUrl?: string, title: string }) => {
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2; // Maximum number of retries if thumbnail loading fails
  
  // Extract video ID from the thumbnail URL if needed for fallbacks
  const extractVideoId = thumbnailUrl ? 
    thumbnailUrl.match(/\/vi(?:_webp)?\/([a-zA-Z0-9_-]{11})\//)?.at(1) || 
    thumbnailUrl.match(/\/([a-zA-Z0-9_-]{11})\//)?.at(1) : 
    null;
  
  // For YouTube videos, prioritize reliable formats to avoid 404s
  let thumbUrl = thumbnailUrl;
  let fallbackUrl = '';
  
  if (extractVideoId) {
    // Always use hqdefault as primary - it's the most reliable format across all videos
    thumbUrl = `https://img.youtube.com/vi/${extractVideoId}/hqdefault.jpg`;
    
    // Set up multiple fallbacks
    fallbackUrl = [
      `https://i.ytimg.com/vi/${extractVideoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${extractVideoId}/mqdefault.jpg`,
      `https://i.ytimg.com/vi/${extractVideoId}/mqdefault.jpg`
    ].join('|');
  }
  
  // If no video ID was extracted but we have a thumbnail URL, use it with no fallbacks
  if (!extractVideoId && thumbnailUrl) {
    thumbUrl = thumbnailUrl;
  }
  
  // Use a key for the useThumbnail to force a complete re-render when retrying
  const thumbnailKey = `${thumbUrl}-${retryCount}`;
  
  // Only call useThumbnail if we have a URL to fetch
  const { dataUrl, isLoading, error } = useThumbnail(thumbUrl || '', thumbUrl ? fallbackUrl : '');
  
  // Retry loading thumbnail if we get an error
  useEffect(() => {
    if (error && retryCount < maxRetries) {
      const timer = setTimeout(() => {
        // Silent retry without logging
        setRetryCount(prev => prev + 1);
      }, 1000); // Wait 1 second before retrying
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);
  
  if (isLoading) {
    return (
      <div className="w-full max-w-[480px] h-48 bg-secondary/50 rounded-md flex items-center justify-center">
        <svg 
          className="h-8 w-8 animate-spin text-primary/70" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }
  
  if (error || !dataUrl) {
    // Only log fatal errors after all retries are exhausted
    if (retryCount >= maxRetries) {
      console.error('Unable to load thumbnail after multiple attempts:', thumbUrl);
    }
    
    return (
      <div className="w-full max-w-[480px] h-48 bg-secondary/50 rounded-md flex items-center justify-center">
        <span className="text-secondary-foreground/70">No thumbnail available</span>
      </div>
    );
  }
  
  return (
    <img 
      src={dataUrl} 
      alt={title || 'Playlist thumbnail'} 
      className="w-full h-auto object-cover max-h-48 rounded-md" 
      style={{ 
        maxWidth: '480px',
        aspectRatio: '16/9',
        objectPosition: 'center'
      }}
      onError={(e) => {
        // Silent error handling to avoid log spam
        e.currentTarget.src = '';
      }}
    />
  );
};

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  isLoading?: boolean;
}

export const ImportPlaylistModal: React.FC<ImportPlaylistModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  
  const youtubeInfoMutation = useGetYouTubePlaylistInfo();
  const importMutation = useImportPlaylist();
  
  const isLoadingInfo = youtubeInfoMutation.isPending;
  const isImporting = importMutation.isPending;
  const infoError = youtubeInfoMutation.error?.message;
  const playlistInfo = youtubeInfoMutation.data;
  
  // Reference for debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const validateUrl = (url: string) => {
    // Basic validation for YouTube playlist URL
    const youtubePlaylistRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.*(\?|&)list=([^&]+).*/;
    
    if (!url.trim()) {
      setUrlError('Playlist URL is required');
      return false;
    }
    
    if (!youtubePlaylistRegex.test(url)) {
      setUrlError('Please enter a valid YouTube playlist URL');
      return false;
    }
    
    return true;
  };

  // Auto-fetch playlist info when URL changes
  const fetchPlaylistInfo = (url: string) => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Don't validate empty URLs
    if (!url.trim()) {
      return;
    }
    
    // Debounce the API call (wait 800ms after typing stops)
    debounceTimerRef.current = setTimeout(async () => {
      if (validateUrl(url)) {
        try {
          await youtubeInfoMutation.mutateAsync({ url });
        } catch (error) {
          // Error will be handled via the mutation state
        }
      }
    }, 800);
  };

  // Update handler for URL input
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setPlaylistUrl(newUrl);
    
    // Clear error when typing
    if (newUrl.trim()) {
      setUrlError('');
    }
    
    // Auto-fetch on URL change
    fetchPlaylistInfo(newUrl);
  };

  const handleImport = async () => {
    try {
      await importMutation.mutateAsync({ url: playlistUrl });
      resetForm();
      onClose();
    } catch (error) {
      // Error will be handled elsewhere
    }
  };

  const resetForm = () => {
    // Clear debounce timer when resetting
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setPlaylistUrl('');
    setUrlError('');
    youtubeInfoMutation.reset();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      preventClose={isLoadingInfo || isImporting}
      className="w-full max-w-md p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Import YouTube Playlist</h2>
        <button
          onClick={handleClose}
          className="text-secondary-foreground/70 hover:text-secondary-foreground"
          aria-label="Close modal"
          disabled={isLoadingInfo || isImporting}
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        {/* URL Input - Always visible */}
        <div className="space-y-2">
          <label htmlFor="playlist-url" className="block text-sm font-medium">
            YouTube Playlist URL <span className="text-destructive">*</span>
          </label>
          <input
            id="playlist-url"
            type="text"
            value={playlistUrl}
            onChange={handleUrlChange}
            placeholder="https://www.youtube.com/playlist?list=..."
            className={`w-full rounded-md border ${
              urlError || infoError ? 'border-destructive' : 'border-border'
            } bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring`}
            disabled={isImporting}
          />
          {urlError && (
            <p className="text-sm text-destructive">{urlError}</p>
          )}
          {infoError && (
            <p className="text-sm text-destructive">{infoError}</p>
          )}
          {isLoadingInfo && (
            <div className="flex items-center space-x-2 text-sm text-secondary-foreground/70">
              <svg 
                className="h-4 w-4 animate-spin" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Fetching playlist information...</span>
            </div>
          )}
        </div>
        
        {!playlistInfo ? (
          <div className="mt-2 text-sm text-secondary-foreground/70">
            <p>Enter a YouTube playlist URL to import it into PlayListify. The app will automatically fetch playlist information.</p>
          </div>
        ) : (
          <>
            {/* Playlist Preview */}
            <div className="bg-secondary/20 rounded-md p-4 space-y-3 mt-4">
              {playlistInfo.thumbnailUrl && (
                <div className="overflow-hidden rounded-md relative">
                  <div className="flex justify-center">
                    <PlaylistThumbnail 
                      thumbnailUrl={playlistInfo.thumbnailUrl}
                      title={playlistInfo.title || 'YouTube Playlist'}
                    />
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{playlistInfo.title || 'Untitled Playlist'}</h3>
                <div className="flex items-center mt-1 text-sm text-secondary-foreground/70">
                  {playlistInfo.channelTitle && (
                    <p className="mr-2">{playlistInfo.channelTitle}</p>
                  )}
                  {playlistInfo.videoCount !== undefined && (
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {playlistInfo.videoCount} {playlistInfo.videoCount === 1 ? 'video' : 'videos'}
                    </p>
                  )}
                </div>
                {playlistInfo.description && (
                  <p className="text-sm mt-2 line-clamp-3">{playlistInfo.description}</p>
                )}
              </div>
            </div>
            
            <div className="mt-2 text-sm text-secondary-foreground/70">
              <p>This will create a copy of the YouTube playlist in your library. You can then download videos individually or by playlist.</p>
            </div>
          </>
        )}
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            onClick={handleClose}
            variant="outline"
            disabled={isImporting}
          >
            Cancel
          </Button>
          
          {playlistInfo && (
            <Button
              type="button"
              onClick={handleImport}
              variant="default"
              disabled={isImporting || !playlistUrl.trim()}
            >
              {isImporting ? (
                <>
                  <svg 
                    className="mr-2 h-4 w-4 animate-spin" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Importing...
                </>
              ) : (
                'Import Playlist'
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}; 