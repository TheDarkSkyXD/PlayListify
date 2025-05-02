import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPlaylist: (url: string) => void;
  isLoading?: boolean;
}

export const ImportPlaylistModal: React.FC<ImportPlaylistModalProps> = ({
  isOpen,
  onClose,
  onImportPlaylist,
  isLoading = false,
}) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation for YouTube playlist URL
    const youtubePlaylistRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.*(\?|&)list=([^&]+).*/;
    
    if (!playlistUrl.trim()) {
      setUrlError('Playlist URL is required');
      return;
    }
    
    if (!youtubePlaylistRegex.test(playlistUrl)) {
      setUrlError('Please enter a valid YouTube playlist URL');
      return;
    }
    
    onImportPlaylist(playlistUrl);
    // Don't reset yet, let the caller close the modal if import is successful
  };

  const resetForm = () => {
    setPlaylistUrl('');
    setUrlError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      preventClose={isLoading}
      className="w-full max-w-md p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Import YouTube Playlist</h2>
        <button
          onClick={handleClose}
          className="text-secondary-foreground/70 hover:text-secondary-foreground"
          aria-label="Close modal"
          disabled={isLoading}
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
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="playlist-url" className="block text-sm font-medium">
            YouTube Playlist URL <span className="text-destructive">*</span>
          </label>
          <input
            id="playlist-url"
            type="text"
            value={playlistUrl}
            onChange={(e) => {
              setPlaylistUrl(e.target.value);
              if (e.target.value.trim()) setUrlError('');
            }}
            placeholder="https://www.youtube.com/playlist?list=..."
            className={`w-full rounded-md border ${
              urlError ? 'border-destructive' : 'border-border'
            } bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring`}
            disabled={isLoading}
          />
          {urlError && (
            <p className="text-sm text-destructive">{urlError}</p>
          )}
        </div>
        
        <div className="mt-2 text-sm text-secondary-foreground/70">
          <p>Enter a YouTube playlist URL to import it into PlayListify. The app will fetch all video information and create a local copy of the playlist.</p>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            onClick={handleClose}
            variant="outline"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={isLoading}
          >
            {isLoading ? (
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
        </div>
      </form>
    </Modal>
  );
}; 