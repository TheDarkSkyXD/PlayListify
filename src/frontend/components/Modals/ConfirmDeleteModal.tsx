import React from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  playlistName?: string;
  isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Playlist',
  description,
  playlistName,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="text-secondary-foreground/70 hover:text-secondary-foreground"
          aria-label="Close modal"
          type="button"
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
      
      <div className="mb-6">
        <div className="p-4 bg-destructive/10 rounded-md mb-4">
          <p className="text-sm text-center">
            {description || (playlistName ? 
              `Are you sure you want to delete "${playlistName}"? This action cannot be undone.` :
              'Are you sure you want to proceed with this action? This cannot be undone.'
            )}
          </p>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          onClick={onClose}
          variant="outline"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          variant="destructive"
          disabled={isLoading}
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Modal>
  );
}; 