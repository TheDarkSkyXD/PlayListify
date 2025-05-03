import React from 'react';
import { Button } from '../ui/Button';

interface PlaylistActionsBarProps {
  onCreatePlaylist: () => void;
  onImportPlaylist: () => void;
  onImportJson: () => void;
  displayMode?: 'list' | 'grid';
  onDisplayModeChange?: (mode: 'list' | 'grid') => void;
}

export const PlaylistActionsBar: React.FC<PlaylistActionsBarProps> = ({
  onCreatePlaylist,
  onImportPlaylist,
  onImportJson,
  displayMode = 'list',
  onDisplayModeChange,
}) => {
  return (
    <div className="flex justify-between items-center p-4 border-b">
      <h2 className="text-lg font-semibold">My Playlists</h2>
      
      <div className="flex space-x-2">
        {/* Display mode toggle buttons */}
        {onDisplayModeChange && (
          <div className="mr-2 flex border rounded-md overflow-hidden">
            <button
              onClick={() => onDisplayModeChange('list')}
              className={`p-1.5 ${
                displayMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent hover:bg-secondary/80'
              }`}
              aria-label="List view"
              title="List view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <button
              onClick={() => onDisplayModeChange('grid')}
              className={`p-1.5 ${
                displayMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent hover:bg-secondary/80'
              }`}
              aria-label="Grid view"
              title="Grid view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
          </div>
        )}

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