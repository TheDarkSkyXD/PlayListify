import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/frontend/components/ui/dropdown-menu'; // Standardized to alias
import { Button } from '@/frontend/components/ui/button'; // Standardized to alias
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/frontend/components/ui/tooltip'; // Added Tooltip imports
import {
  MoreHorizontal,
  PlayCircle,
  RefreshCw,
  Trash2,
  Download,
  Edit3,
  Copy,
  YoutubeIcon,
  Save, // Assuming Save is a suitable icon for "Save to Library"
  ListPlus, // Assuming ListPlus for "Add Videos"
  ListX, // Assuming ListX for "Remove Videos"
  Share2, // For "Share Playlist"
  Library,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';

// Import the shared Playlist type
import { Playlist as SharedPlaylist } from '../../../../../shared/types/index';

// Local Playlist interface removed, props will use SharedPlaylist directly or a subset if preferred.

interface PlaylistActionsDropdownProps {
  // Use the imported SharedPlaylist type for the playlist prop
  playlist: SharedPlaylist; 
  onPlay?: (playlistId: string) => void;
  onRefresh?: (playlistId: string) => void;
  onDelete?: (playlistId: string) => void;
  onDuplicate?: (playlistId: string) => void;
  onDownload?: (playlistId: string) => void;
  onEdit?: (playlistId: string) => void;
  onSaveToLibrary?: (playlistId: string) => void;
  onAddVideos?: (playlistId: string) => void;
  onRemoveVideos?: (playlistId: string) => void;
  onSharePlaylist?: (playlistId: string) => void;
  // No specific handler for "Open in YouTube" as it's direct navigation
}

const PlaylistActionsDropdown: React.FC<PlaylistActionsDropdownProps> = ({
  playlist,
  onPlay,
  onRefresh,
  onDelete,
  onDuplicate,
  onDownload,
  onEdit,
  onSaveToLibrary,
  onAddVideos,
  onRemoveVideos,
  onSharePlaylist,
}) => {
  const handleOpenInYouTube = async () => { // Made async to potentially await the IPC call
    if (playlist.source_url) { // Prefer source_url as it is defined in the Playlist type
      try {
        await window.electronAPI.shell.openExternal(playlist.source_url);
      } catch (error) {
        console.error('Failed to open URL in external browser:', error);
        // Optionally, show a toast notification to the user about the failure
      }
    } else if (playlist.source === 'youtube' && playlist.id) { // Changed: Use playlist.source
      // Fallback: if it's a YouTube playlist and source_url is missing for some reason,
      // construct the URL using playlist.id (assuming it's the YouTube Playlist ID).
      const youtubeUrl = `https://www.youtube.com/playlist?list=${playlist.id}`;
      try {
        await window.electronAPI.shell.openExternal(youtubeUrl);
      } catch (error) {
        console.error('Failed to open constructed YouTube URL in external browser:', error);
    }
    } else {
      console.warn('No valid URL found to open in YouTube for playlist:', playlist.id);
      // Optionally, show a toast notification to the user
    }
  };

  const itemClassName = "relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground dark:focus:bg-accent/80 dark:focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-default";
  const destructiveItemClassName = "relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors text-red-600 dark:text-red-500 focus:bg-red-500/10 focus:text-red-600 dark:focus:text-red-500 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-default";
  const separatorClassName = "-mx-1 my-1 h-px bg-border";

  // Determine if the playlist is a YouTube playlist by its source
  const isYouTube = playlist.source === 'youtube';

  return (
    <TooltipProvider>
    <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <div onClick={(e) => {
              e.stopPropagation();
              // console.log('Dropdown trigger wrapper clicked, propagation stopped.'); // Keep this if useful for debugging
            }}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
                  className="h-8 w-8 p-0 rounded-full text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-black/20 focus-visible:ring-offset-0 focus-visible:ring-1"
        >
          <MoreHorizontal className="h-5 w-5" />
                  <span className="sr-only">More playlist actions</span>
        </Button>
      </DropdownMenuTrigger>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>More playlist actions</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl overflow-hidden shadow-md">
          <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">Playlist Options</DropdownMenuLabel>
          <DropdownMenuSeparator className={separatorClassName} />
          <DropdownMenuGroup>
        {onPlay && (
            <DropdownMenuItem onClick={() => onPlay?.(playlist.id)} className={itemClassName}>
            <PlayCircle className="mr-2 h-4 w-4" />
                Play
            </DropdownMenuItem>
          )}
          {onSaveToLibrary && (
            <DropdownMenuItem onClick={() => onSaveToLibrary?.(playlist.id)} className={itemClassName}>
                <Library className="mr-2 h-4 w-4" />
              Save to Library
            </DropdownMenuItem>
          )}
          </DropdownMenuGroup>

          {/* Separator 1 */}
          {((onPlay || onSaveToLibrary)) && (onDownload || (onAddVideos || onRemoveVideos) || (onEdit || onRefresh || onDuplicate || onSharePlaylist || (isYouTube || playlist.source_url))) && <DropdownMenuSeparator className={separatorClassName} />}

          {/* Group 2 */}
          <DropdownMenuGroup>
            {onDownload && (
              <DropdownMenuItem onClick={() => onDownload?.(playlist.id)} className={itemClassName}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
            )}
          {onAddVideos && (
            <DropdownMenuItem onClick={() => onAddVideos?.(playlist.id)} className={itemClassName}>
                <PlusCircle className="mr-2 h-4 w-4" />
              Add Videos
            </DropdownMenuItem>
          )}
          {onRemoveVideos && (
            <DropdownMenuItem onClick={() => onRemoveVideos?.(playlist.id)} className={itemClassName}>
                <MinusCircle className="mr-2 h-4 w-4" />
              Remove Videos
          </DropdownMenuItem>
        )}
          </DropdownMenuGroup>

          {/* Separator 2 */}
          {(onDownload || (onAddVideos || onRemoveVideos)) && (onEdit || onRefresh || onDuplicate || onSharePlaylist || (isYouTube || playlist.source_url)) && <DropdownMenuSeparator className={separatorClassName} />}
          
          {/* Group 3 */}
        {onEdit && playlist.source === 'custom' && (
            <DropdownMenuItem onClick={() => onEdit?.(playlist.id)} className={itemClassName}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Details
          </DropdownMenuItem>
        )}
        {onRefresh && (
           <DropdownMenuItem onClick={() => onRefresh?.(playlist.id)} className={itemClassName}>
            <RefreshCw className="mr-2 h-4 w-4" />
              Refresh from YouTube
          </DropdownMenuItem>
        )}
        {onDuplicate && (
            <DropdownMenuItem onClick={() => onDuplicate?.(playlist.id)} className={itemClassName}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
        )}
           {onSharePlaylist && (
            <DropdownMenuItem onClick={() => onSharePlaylist?.(playlist.id)} className={itemClassName}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Playlist
            </DropdownMenuItem>
          )}

          {/* Separator 3 */}
          {(onEdit || onRefresh || onDuplicate || onSharePlaylist) && ((isYouTube || playlist.source_url)) && onDelete && <DropdownMenuSeparator className={separatorClassName} />}

          {/* Group 4 */}
          {(isYouTube || playlist.source_url) && ( // Show if it has a source_url or is a YouTube playlist by source
            <DropdownMenuItem onClick={handleOpenInYouTube} className={itemClassName}>
            <YoutubeIcon className="mr-2 h-4 w-4" />
            Open in YouTube
          </DropdownMenuItem>
        )}

        {onDelete && (
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50 dark:text-red-500 rounded-sm"
              onSelect={(e) => {
                e.stopPropagation(); // Prevent click from bubbling to the card/row
                onDelete(playlist.id);
              }}
            >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Playlist
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    </TooltipProvider>
  );
};

export default PlaylistActionsDropdown; 