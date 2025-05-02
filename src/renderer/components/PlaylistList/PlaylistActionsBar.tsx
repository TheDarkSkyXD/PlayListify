import React from 'react';
import { Button } from '../ui/Button';

interface PlaylistActionsBarProps {
  onCreatePlaylist: () => void;
  onImportPlaylist: () => void;
  onImportJson: () => void;
}

export const PlaylistActionsBar: React.FC<PlaylistActionsBarProps> = ({
  onCreatePlaylist,
  onImportPlaylist,
  onImportJson,
}) => {
  return (
    <div className="flex justify-between items-center p-4 border-b">
      <h2 className="text-lg font-semibold">My Playlists</h2>
      
      <div className="flex space-x-2">
        <Button
          onClick={onCreatePlaylist}
          variant="outline"
          size="sm"
          className="flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New
        </Button>
        
        <Button
          onClick={onImportPlaylist}
          variant="outline"
          size="sm"
          className="flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Import YouTube
        </Button>

        <Button
          onClick={onImportJson}
          variant="outline"
          size="sm"
          className="flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Import JSON
        </Button>
      </div>
    </div>
  );
}; 