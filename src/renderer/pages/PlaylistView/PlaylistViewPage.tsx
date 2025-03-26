import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlaylist } from '../../services/queryHooks';
import { Button } from '../../components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import PlaylistDetails, { PlaylistDetailsSkeleton } from '../../features/playlists/components/PlaylistDetails';
import { Separator } from '../../components/ui/separator';

export default function PlaylistViewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: playlist, isLoading, error } = usePlaylist(id || '');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/dashboard" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Playlists
          </Link>
        </Button>
        
        <Separator className="my-4" />
      </div>
      
      {error && (
        <div className="bg-destructive/20 text-destructive border border-destructive/50 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <div>
            <strong className="font-bold">Error: </strong>
            <span>{error.message || 'Failed to load playlist'}</span>
          </div>
        </div>
      )}
      
      {isLoading && <PlaylistDetailsSkeleton />}
      
      {!isLoading && !error && playlist && (
        <PlaylistDetails playlist={playlist} />
      )}
      
      {!isLoading && !error && !playlist && (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <h3 className="text-lg font-medium mb-2">Playlist not found</h3>
          <p className="text-muted-foreground mb-4">
            The playlist you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild>
            <Link to="/dashboard">
              Return to Dashboard
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
} 