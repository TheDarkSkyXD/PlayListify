import { Playlist } from '../../../../shared/types/appTypes';
import { Button } from '../../../components/ui/button';
import { Download, Trash2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Link } from '@tanstack/react-router';

interface PlaylistHeaderProps {
  playlist: Playlist;
  onEdit: () => void;
  onDownload: () => void;
  onDelete: () => void;
  isDownloadDisabled: boolean;
}

/**
 * Header component for the playlist details page
 * Shows the playlist title, description, and action buttons
 */
export function PlaylistHeader({ 
  playlist, 
  onEdit, 
  onDownload, 
  onDelete,
  isDownloadDisabled
}: PlaylistHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold">{playlist.name}</h1>
        {playlist.description && (
          <p className="text-muted-foreground mt-1 max-h-20 overflow-y-auto text-sm">
            {playlist.description}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {/* Edit button for custom playlists */}
        {!playlist.sourceUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={isDownloadDisabled}
        >
          <Download className="h-4 w-4 mr-2" />
          Download All
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Playlist
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the playlist "{playlist.name}"?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive hover:bg-destructive/90"
                asChild
              >
                <Link to="/">Delete</Link>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
