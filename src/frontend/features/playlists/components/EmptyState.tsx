import { Button } from '../../../components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddVideo: () => void;
}

/**
 * Component to display when a playlist has no videos
 */
export function EmptyState({ onAddVideo }: EmptyStateProps) {
  return (
    <div className="border rounded-md p-8 text-center">
      <h3 className="text-lg font-medium mb-2">No videos in this playlist</h3>
      <p className="text-muted-foreground mb-4">
        Add videos to this playlist to get started.
      </p>
      <Button onClick={onAddVideo}>
        <Plus className="h-4 w-4 mr-2" />
        Add Video
      </Button>
    </div>
  );
}
