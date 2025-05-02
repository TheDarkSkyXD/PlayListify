import React from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      preventClose={isLoading}
      className="w-full max-w-sm p-6"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="rounded-full bg-destructive/10 p-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-center">{title}</h2>
        <p className="text-center text-secondary-foreground/70">{message}</p>
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          type="button"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={isLoading}
          type="button"
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
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </Button>
      </div>
    </Modal>
  );
}; 