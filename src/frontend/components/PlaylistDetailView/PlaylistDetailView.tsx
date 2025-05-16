import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button'; // Assuming Button is in ui folder relative to components
import { Loader2, AlertTriangle, ArrowLeft, PlayCircle, ImageOff as ImageOffIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Playlist, Video } from '../../../shared/types'; // Adjust path as necessary
import AddVideoToPlaylistDialog from '../Modals/AddVideoToPlaylistDialog/AddVideoToPlaylistDialog'; // Import the new dialog
import { formatRelativeDate, formatDuration } from '@/frontend/utils/date'; // Import formatRelativeDate
import { useRemoveVideoFromPlaylist } from '@/frontend/hooks/usePlaylistQueries';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/frontend/components/ui/tooltip';

interface PlaylistDetailViewProps {
  playlist: Playlist | undefined;
  videos: Video[] | undefined;
  onBack: () => void;
  refetchPlaylist: () => void;
}

const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({ 
  playlist: playlistDetails,
  videos: playlistVideos,
  onBack,
  refetchPlaylist,
}) => {
  const [isAddVideoDialogOpen, setIsAddVideoDialogOpen] = useState(false);
  const removeVideoMutation = useRemoveVideoFromPlaylist();

  useEffect(() => {
    // if (playlistVideos) {
    //   console.log('[PlaylistDetailView] Received playlist videos prop (length):', playlistVideos.length);
    //   console.log('[PlaylistDetailView] Actual videos prop:', JSON.stringify(playlistVideos.map(v => ({id: v.id, title: v.title})), null, 2));
    // }
    // if (playlistDetails) {
    //   console.log('[PlaylistDetailView] Received playlist details prop (itemCount):', playlistDetails.itemCount);
    // }
  }, [playlistVideos, playlistDetails]);

  if (!playlistDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertTriangle className="h-12 w-12 mb-4 text-muted-foreground" />
        <p className="text-xl font-semibold">Playlist data not available.</p>
        <Button variant="outline" onClick={onBack} className="mt-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const handleRemoveVideo = (videoId: string) => {
    if (!playlistDetails) return;
    
    console.log(`Attempting to remove video ${videoId} from playlist ${playlistDetails.id}`);
    removeVideoMutation.mutate(
      { playlistId: playlistDetails.id, videoId },
      {
        onSuccess: () => {
          console.log(`Successfully triggered removal for video ${videoId}`);
          // Invalidation is handled within the hook's onSuccess
        },
        onError: (error) => {
          console.error(`Failed to remove video ${videoId}:`, error);
          // TODO: Show error toast/message to user
        },
      }
    );
  };

  return (
    <TooltipProvider>
    <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="-ml-2 sm:-ml-4">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Playlists
        </Button>
        {/* Future: Add Playlist Actions Dropdown here if needed */}
      </div>

      <div className="mb-6 pb-4 border-b border-border">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
          {playlistDetails.name}
        </h1>
        <p className="text-base text-muted-foreground">
          {playlistDetails.description || 'No description available for this playlist.'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {playlistDetails.itemCount} video{playlistDetails.itemCount === 1 ? '' : 's'}
          {playlistDetails.totalDurationSeconds !== undefined && (
            <>
              {' '}
              &bull; {' '}
              {formatDuration(playlistDetails.totalDurationSeconds)}
            </>
          )}
          {playlistDetails.source === 'youtube' && playlistDetails.sourceUrl && (
            <>
              {' '}
              &bull;{' '}
              <a 
                href={playlistDetails.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  window.electronAPI.shell.openExternal(playlistDetails.sourceUrl || '');
                }}
              >
                View on YouTube
              </a>
            </>
          )}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground">Videos</h2>
        {playlistDetails.source === 'custom' && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAddVideoDialogOpen(true)} // Open the dialog
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        )}
      </div>

      <div className="flex-grow overflow-y-auto pr-1 styled-scrollbar">
        {playlistVideos && playlistVideos.length > 0 ? (
          <ul className="space-y-3">
            {playlistVideos.map((video, index) => (
              <li 
                key={video.id || index} 
                  className="flex items-center p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="mr-3 flex-shrink-0 w-28 h-16 sm:w-32 sm:h-[72px] bg-muted rounded overflow-hidden relative">
                  {video.thumbnail ? (
                    <img 
                      src={video.thumbnail} 
                      alt={`Thumbnail for ${video.title}`} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                        <ImageOffIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                   <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                     {formatDuration(video.duration ?? 0)}
                   </span>
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-foreground truncate" title={video.title}>
                    {video.title}
                  </p>
                  {video.channelTitle && (
                    <p className="text-xs text-muted-foreground truncate" title={video.channelTitle}>
                      {video.channelTitle}
                    </p>
                  )}
                  {video.uploadDate && (
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeDate(video.uploadDate)}
                    </p>
                  )}
                </div>
                  
                  {playlistDetails.source === 'custom' && ( 
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="ml-2 flex-shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveVideo(video.id);
                          }}
                          disabled={removeVideoMutation.isPending && removeVideoMutation.variables?.videoId === video.id}
                          aria-label="Remove video from playlist"
                        >
                          {removeVideoMutation.isPending && removeVideoMutation.variables?.videoId === video.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove from playlist</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10">
            <PlayCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">This playlist is empty.</p>
          </div>
        )}
      </div>

      {/* Add Video Dialog */}
      {playlistDetails.source === 'custom' && (
        <AddVideoToPlaylistDialog 
          isOpen={isAddVideoDialogOpen}
          onOpenChange={setIsAddVideoDialogOpen}
          playlistId={playlistDetails.id}
          playlistName={playlistDetails.name}
        />
      )}
    </div>
    </TooltipProvider>
  );
};

export default PlaylistDetailView; 