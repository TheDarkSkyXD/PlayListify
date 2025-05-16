import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from '@/frontend/components/ui/dialog';
import { Button } from '@/frontend/components/ui/button';
import { Input } from '@/frontend/components/ui/input';
import { Textarea } from '@/frontend/components/ui/textarea';
import { Label } from '@/frontend/components/ui/label';
import { Loader2 } from 'lucide-react';

// Import the shared Playlist type and the specific payload for updating
import { Playlist as SharedPlaylist, UpdatePlaylistPayload } from '../../../../shared/types/index';
import { useUpdatePlaylistDetails } from '../../../hooks/usePlaylistQueries';

interface EditPlaylistDetailsDialogProps {
  playlist: SharedPlaylist | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const EditPlaylistDetailsDialog: React.FC<EditPlaylistDetailsDialogProps> = ({
  playlist,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const updatePlaylistMutation = useUpdatePlaylistDetails();

  const isLoading = updatePlaylistMutation.isPending;

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChangeHandler = controlledOnOpenChange || setInternalOpen;

  const MAX_TITLE_LENGTH = 150;
  const MAX_DESC_LENGTH = 5000;

  useEffect(() => {
    if (playlist && open) {
      setTitle(playlist.name);
      setDescription(playlist.description || '');
      setFormError(null);
      updatePlaylistMutation.reset();
    } else if (!open) {
        setTitle('');
        setDescription('');
        setFormError(null);
        updatePlaylistMutation.reset();
    }
  }, [playlist, open]);

  const handleSubmit = async () => {
    if (!playlist) return;
    if (!title.trim()) {
      setFormError('Playlist title cannot be empty.');
      return;
    }
    setFormError(null);

    const payload: UpdatePlaylistPayload = {
      id: playlist.id,
      name: title,
      description: description,
    };

    try {
      await updatePlaylistMutation.mutateAsync(payload);
      onOpenChangeHandler(false);
    } catch (apiError: any) {
      setFormError(apiError?.message || 'Failed to update playlist details.');
    }
  };
  
  const displayError = formError || updatePlaylistMutation.error?.message;

  // Early return if the dialog shouldn't be open or is misconfigured
  if (!open && !trigger) return null; // If not controlled and no trigger, nothing to render
  if (open && !playlist) {
    console.warn('EditPlaylistDetailsDialog was opened without a playlist.');
    // onOpenChangeHandler(false); // Avoid causing state update during render, parent should manage this if playlist becomes null
    return null;
  }

  const dialogMainContent = (
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Playlist Details</DialogTitle>
          <DialogDescription>
            Update the title and description for '{playlist?.name || "this playlist"}'.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
          <Label htmlFor={`edit-title-${playlist?.id}`}>Playlist Title</Label>
          <div className="relative">
            <Input
              id={`edit-title-${playlist?.id}`}
              value={title}
              onChange={(e) => {
                if (e.target.value.length <= MAX_TITLE_LENGTH) {
                  setTitle(e.target.value);
                }
              }}
              placeholder="My Awesome Playlist"
              disabled={isLoading}
              maxLength={MAX_TITLE_LENGTH}
              className="pr-16"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-muted-foreground">
              {`${title.length}/${MAX_TITLE_LENGTH}`}
            </div>
          </div>
          </div>
          <div className="space-y-2">
          <Label htmlFor={`edit-description-${playlist?.id}`}>Description (Optional)</Label>
          <div className="relative">
            <Textarea
              id={`edit-description-${playlist?.id}`}
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                if (e.target.value.length <= MAX_DESC_LENGTH) {
                  setDescription(e.target.value);
                }
              }}
              placeholder="A collection of my favorite tunes..."
              rows={4}
              disabled={isLoading}
              maxLength={MAX_DESC_LENGTH}
              className="pr-16 resize-none"
            />
            <div className="absolute bottom-2 right-2 pr-1 text-xs text-muted-foreground bg-background/80 rounded px-1 py-0.5">
              {`${description.length}/${MAX_DESC_LENGTH}`}
            </div>
          </div>
          </div>
        </div>

      {displayError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">Error: {displayError}</p>
        )}

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>Cancel</Button>
          </DialogClose>
        <Button type="submit" onClick={handleSubmit} disabled={isLoading || !playlist} className="min-w-[100px]">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
  );

  // The Dialog component itself handles the open/closed state based on the `open` prop.
  // It should always be present in the render tree if there's a possibility of it being open.
  return (
    <Dialog open={open} onOpenChange={onOpenChangeHandler}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {/* Conditionally render content only if open, but Dialog wrapper is always there to provide context */}
      {open && playlist && dialogMainContent} 
    </Dialog>
  );

};

export default EditPlaylistDetailsDialog; 