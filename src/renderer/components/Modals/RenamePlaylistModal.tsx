import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

interface RenamePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  currentName: string;
  isLoading?: boolean;
}

export const RenamePlaylistModal: React.FC<RenamePlaylistModalProps> = ({
  isOpen,
  onClose,
  onRename,
  currentName,
  isLoading = false,
}) => {
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setNameError('');
    }
  }, [isOpen, currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      setNameError('Playlist name is required');
      return;
    }
    
    if (newName.trim() === currentName) {
      setNameError('The new name is the same as the current name');
      return;
    }
    
    onRename(newName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Rename Playlist</h2>
          <button
            onClick={onClose}
            className="text-secondary-foreground/70 hover:text-secondary-foreground"
            aria-label="Close modal"
            disabled={isLoading}
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
              New Name <span className="text-destructive">*</span>
            </label>
            <input
              id="playlist-name"
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (e.target.value.trim()) setNameError('');
              }}
              className={`w-full rounded-md border ${
                nameError ? 'border-destructive' : 'border-border'
              } bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring`}
              disabled={isLoading}
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              onClick={onClose}
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
                  Saving...
                </>
              ) : (
                'Rename'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 