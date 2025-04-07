import React from 'react';
import { PlaylistHeaderProps } from './types';
import PlaylistActions from './PlaylistActions';

/**
 * Header component for the playlist details page
 * Shows the playlist title, description, and action buttons
 */
const PlaylistHeader: React.FC<PlaylistHeaderProps> = ({ playlist, onRefresh }) => {
  return (
    <div className="flex flex-col space-y-2 mb-6">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-bold break-words pr-4 max-w-[80%]">{playlist.name}</h1>
        <PlaylistActions playlist={playlist} onRefresh={onRefresh} />
      </div>
      
      {playlist.description && (
        <div className="text-muted-foreground max-h-24 overflow-y-auto">
          <p className="whitespace-pre-wrap break-words">{playlist.description}</p>
        </div>
      )}
    </div>
  );
};

export default PlaylistHeader;
