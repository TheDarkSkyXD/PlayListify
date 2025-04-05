import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Loader2, Check } from 'lucide-react';
import { toast } from '../../../components/ui/use-toast';
import { QUERY_KEYS } from '../../../services/query/keys';
import { Playlist } from '../../../../shared/types/appTypes';
import { useUpdatePlaylist } from '../../../services/query/hooks';

interface EditPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist;
}

export function EditPlaylistDialog({ open, onOpenChange, playlist }: EditPlaylistDialogProps) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || '');
  const [nameError, setNameError] = useState('');
  const queryClient = useQueryClient();

  // Reset form when dialog opens with new playlist
  useEffect(() => {
    if (open) {
      setName(playlist.name);
      setDescription(playlist.description || '');
      setNameError('');
    }
  }, [open, playlist]);

  // Update playlist mutation
  const updatePlaylistMutation = useUpdatePlaylist();

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    if (!name.trim()) {
      setNameError('Playlist name is required');
      return;
    }

    if (name.trim().length < 2) {
      setNameError('Playlist name must be at least 2 characters');
      return;
    }

    // Update playlist
    updatePlaylistMutation.mutate(
      {
        ...playlist,
        name: name.trim(),
        description: description.trim() || undefined
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Playlist updated successfully",
            duration: 3000,
          });
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message || "Failed to update playlist",
            variant: "destructive",
            duration: 5000,
          });
        }
      }
    );
  };

  // Ensure dialog remains open when it should be
  React.useEffect(() => {
    if (!open) onOpenChange(true);
  }, [open, onOpenChange]);

  return (
    <Dialog
      open={true}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Playlist</DialogTitle>
          <DialogDescription>
            Update the name and description of your playlist.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-name">Playlist Name</Label>
            <Input
              id="playlist-name"
              placeholder="My Awesome Playlist"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) {
                  setNameError('');
                }
              }}
            />
            {nameError && <p className="text-sm text-red-500">{nameError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="playlist-description">Description (Optional)</Label>
            <Textarea
              id="playlist-description"
              placeholder="Add a description for your playlist"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updatePlaylistMutation.isPending || !name.trim() || name.length < 2}
            >
              {updatePlaylistMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Update Playlist
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
