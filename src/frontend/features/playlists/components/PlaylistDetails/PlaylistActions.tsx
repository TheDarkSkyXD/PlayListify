import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaylistActionsProps } from './types';
import { Button } from '../../../../components/ui/button';
import {
  Download,
  Edit,
  Trash2,
  MoreVertical,
  RefreshCw,
  Plus,
  Gauge
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../components/ui/alert-dialog';
import { toast } from '../../../../components/ui/use-toast';
import { playlistService } from '../../../../services/playlistService';
import { useDownloadPlaylistModal } from '../../../downloads/hooks/useDownloadPlaylistModal';
import { useEditPlaylistModal } from '../../hooks/useEditPlaylistModal';
import { useAddVideoModal } from '../../hooks/useAddVideoModal';

/**
 * Component for playlist action buttons
 * Includes edit, download, delete, and add video actions
 */
const PlaylistActions: React.FC<PlaylistActionsProps> = ({ playlist, onRefresh }) => {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingQualities, setIsUpdatingQualities] = useState(false);

  // Custom hooks for modals
  const { openDownloadModal } = useDownloadPlaylistModal();
  const { openEditModal } = useEditPlaylistModal();
  const { openAddVideoModal } = useAddVideoModal();

  // Handle playlist deletion
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await playlistService.deletePlaylist(playlist.id);
      toast({
        title: 'Playlist deleted',
        description: 'The playlist has been deleted successfully.',
      });
      navigate('/playlists');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the playlist. Please try again.',
        variant: 'destructive',
      });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle playlist refresh (for YouTube playlists)
  const handleRefresh = async () => {
    if (playlist.source !== 'youtube' || !playlist.sourceUrl) {
      return;
    }

    try {
      setIsRefreshing(true);
      await playlistService.importPlaylist(playlist.sourceUrl);
      toast({
        title: 'Playlist refreshed',
        description: 'The playlist has been refreshed with the latest videos.',
      });
      onRefresh();
    } catch (error) {
      console.error('Error refreshing playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh the playlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle updating video qualities
  const handleUpdateQualities = async () => {
    try {
      setIsUpdatingQualities(true);

      // Create a toast that will be updated with progress
      const toastId = toast({
        title: 'Updating video qualities',
        description: 'Starting quality update...',
        duration: 100000, // Long duration as we'll dismiss it manually
      }).id;

      // Set up progress handler
      const handleProgress = (status: string, count?: number, total?: number) => {
        // Update the toast with progress information
        toast({
          id: toastId,
          title: 'Updating video qualities',
          description: status + (count && total ? ` (${count}/${total})` : ''),
        });
      };

      // Start the update
      const updatedCount = await playlistService.updatePlaylistVideoQualities(
        playlist.id,
        handleProgress
      );

      // Dismiss the progress toast
      toast.dismiss(toastId);

      // Show completion toast
      toast({
        title: 'Quality update complete',
        description: `Updated quality information for ${updatedCount} videos.`,
      });

      // Refresh the playlist to show the updated qualities
      onRefresh();
    } catch (error) {
      console.error('Error updating video qualities:', error);
      toast({
        title: 'Error',
        description: 'Failed to update video qualities. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingQualities(false);
    }
  };



  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Main action buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEditModal(playlist)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => openDownloadModal(playlist)}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openAddVideoModal(playlist.id)}>
              <Plus className="h-4 w-4 mr-2" />
              Add video
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleUpdateQualities} disabled={isUpdatingQualities}>
              <Gauge className={`h-4 w-4 mr-2 ${isUpdatingQualities ? 'animate-spin' : ''}`} />
              Update video qualities
            </DropdownMenuItem>

            {playlist.source === 'youtube' && playlist.sourceUrl && (
              <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh from YouTube
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-500 focus:text-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete playlist
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the playlist "{playlist.name}" and remove it from your library.
              Downloaded videos will not be deleted from your computer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PlaylistActions;
