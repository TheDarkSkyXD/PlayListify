import React from 'react';
import { PlusCircle } from 'lucide-react';

interface AddNewPlaylistCardProps {
  onClick: () => void;
}

const AddNewPlaylistCard: React.FC<AddNewPlaylistCardProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center aspect-video bg-neutral-200 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 rounded-lg p-4 transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
      aria-label="Add new playlist"
    >
      <PlusCircle className="h-16 w-16 text-neutral-500 dark:text-neutral-400 mb-3" strokeWidth={1.5} />
      <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
        Add New Playlist
      </span>
    </button>
  );
};

export default AddNewPlaylistCard; 