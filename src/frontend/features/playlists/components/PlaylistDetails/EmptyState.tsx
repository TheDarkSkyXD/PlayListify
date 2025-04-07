import React, { useState } from 'react';
import { EmptyStateProps } from './types';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Plus, Youtube } from 'lucide-react';
import { toast } from '../../../../components/ui/use-toast';
import { playlistService } from '../../../../services/playlistService';

/**
 * Component to display when a playlist has no videos
 * Provides options to add videos
 */
const EmptyState: React.FC<EmptyStateProps> = ({ playlistId }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Handle adding a video to the playlist
  const handleAddVideo = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid YouTube video URL',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsAdding(true);
      
      await playlistService.addVideoToPlaylist(playlistId, {
        url: videoUrl,
        title: '',
        duration: 0,
        downloaded: false,
        status: 'pending',
        addedAt: new Date().toISOString(),
      });
      
      toast({
        title: 'Video added',
        description: 'The video has been added to the playlist.',
      });
      
      setVideoUrl('');
      
      // Force a refresh of the page to show the new video
      window.location.reload();
    } catch (error) {
      console.error('Error adding video:', error);
      toast({
        title: 'Error',
        description: 'Failed to add the video. Please check the URL and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
      <div className="bg-muted rounded-full p-4">
        <Youtube className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-medium">No videos in this playlist</h3>
        <p className="text-muted-foreground">
          Add videos to get started with your playlist
        </p>
      </div>
      
      <div className="w-full max-w-md space-y-2">
        <div className="flex space-x-2">
          <Input
            placeholder="Paste a YouTube video URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={isAdding}
          />
          <Button onClick={handleAddVideo} disabled={isAdding}>
            {isAdding ? (
              <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-current animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
