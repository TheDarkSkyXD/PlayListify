import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../../components/ui/use-toast';
import { importService } from '../../../services/importService';

// Function to validate YouTube URLs
function isValidYoutubeUrl(url: string): boolean {
  return url.includes('youtube.com/') || url.includes('youtu.be/');
}

interface CreatePlaylistFormProps {
  onSuccess?: () => void;
  inModal?: boolean;
}

export function CreatePlaylistForm({ onSuccess, inModal = true }: CreatePlaylistFormProps) {
  // Form state
  const [name, setName] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [nameError, setNameError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const queryClient = useQueryClient();

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (playlist: { name: string, videos: any[] }) => {
      return window.api.playlists.create(playlist.name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  // Reset form
  const resetForm = () => {
    setName('');
    setYoutubeUrl('');
    setNameError('');
    setUrlError('');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    let valid = true;
    
    if (!name || name.length < 2) {
      setNameError('Playlist name must be at least 2 characters');
      valid = false;
    } else {
      setNameError('');
    }
    
    if (youtubeUrl && !isValidYoutubeUrl(youtubeUrl)) {
      setUrlError('Please enter a valid YouTube URL');
      valid = false;
    } else {
      setUrlError('');
    }
    
    if (!valid) return;
    
    setIsSubmitting(true);
    
    try {
      // If YouTube URL is provided, import from YouTube
      if (youtubeUrl) {
        try {
          // Start the background import process
          await importService.importYoutubePlaylist(youtubeUrl, name);
          
          // Reset form
          resetForm();
          
          // Call onSuccess if provided
          if (onSuccess) onSuccess();
          
          // No toast needed here as the importService shows toasts
        } catch (error: any) {
          toast({
            title: "Import Failed",
            description: error.message || "Failed to import playlist",
            variant: "destructive",
            duration: 5000,
          });
        }
      } else {
        // Regular playlist creation
        await createPlaylistMutation.mutateAsync({
          name,
          videos: [],
        });
        
        toast({
          title: "Success",
          description: "Playlist created successfully",
          duration: 3000,
        });
        
        // Reset form
        resetForm();
        
        // Call onSuccess if provided
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create playlist",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Conditional rendering based on whether component is in a modal or standalone
  if (inModal) {
    return (
      <div className="px-4 py-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Playlist Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Playlist"
            />
            {nameError && <p className="text-sm text-red-500">{nameError}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="youtubeUrl">YouTube Playlist URL (optional)</Label>
            <Input
              id="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/playlist?list=..."
            />
            <p className="text-sm text-muted-foreground">
              Import videos from a YouTube playlist
            </p>
            {urlError && <p className="text-sm text-red-500">{urlError}</p>}
          </div>
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>Create Playlist</>
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Playlist</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Playlist Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Playlist"
            />
            {nameError && <p className="text-sm text-red-500">{nameError}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="youtubeUrl">YouTube Playlist URL (optional)</Label>
            <Input
              id="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/playlist?list=..."
            />
            <p className="text-sm text-muted-foreground">
              Import videos from a YouTube playlist
            </p>
            {urlError && <p className="text-sm text-red-500">{urlError}</p>}
          </div>
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>Create Playlist</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 