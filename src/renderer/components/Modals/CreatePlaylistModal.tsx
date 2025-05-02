import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlaylist: (name: string, description: string) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreatePlaylist,
}) => {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [nameError, setNameError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name
    if (!playlistName.trim()) {
      setNameError('Playlist name is required');
      return;
    }
    
    onCreatePlaylist(playlistName, playlistDescription);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setPlaylistName('');
    setPlaylistDescription('');
    setNameError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Create New Playlist</h2>
        <button
          onClick={handleClose}
          className="text-secondary-foreground/70 hover:text-secondary-foreground"
          aria-label="Close modal"
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
          <label htmlFor="playlist-name" className="block text-sm font-medium">
            Playlist Name <span className="text-destructive">*</span>
          </label>
          <input
            id="playlist-name"
            type="text"
            value={playlistName}
            onChange={(e) => {
              setPlaylistName(e.target.value);
              if (e.target.value.trim()) setNameError('');
            }}
            placeholder="My Awesome Playlist"
            className={`w-full rounded-md border ${
              nameError ? 'border-destructive' : 'border-border'
            } bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring`}
          />
          {nameError && (
            <p className="text-sm text-destructive">{nameError}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="playlist-description" className="block text-sm font-medium">
            Description (optional)
          </label>
          <textarea
            id="playlist-description"
            value={playlistDescription}
            onChange={(e) => setPlaylistDescription(e.target.value)}
            placeholder="Describe your playlist..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            rows={3}
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            onClick={handleClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
          >
            Create Playlist
          </Button>
        </div>
      </form>
    </Modal>
  );
}; 