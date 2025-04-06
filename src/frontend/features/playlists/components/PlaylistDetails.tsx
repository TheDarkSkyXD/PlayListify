
import { Playlist, Video, DownloadOptions } from '../../../../shared/types/appTypes';
import { Button } from '../../../components/ui/button';
import { Download, Trash2, Clock, Check, AlertCircle, Play, Plus, Edit } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatDuration } from '../../../utils/formatting';
import { useDownloadVideo, useRemoveVideoFromPlaylist, useDeletePlaylist, useDownloadPlaylist } from '../../../services/query/hooks';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';
import { Link } from '@tanstack/react-router';
import { AddVideoDialog } from './AddVideoDialog';
import { useState } from 'react';
import { EditPlaylistDialog } from './EditPlaylistDialog';
import { usePlayerStore } from '../../player/stores/playerStore';
import VideoPlayer from '../../player/components/VideoPlayer';
import DownloadOptionsDialog from '../../downloads/components/DownloadOptionsDialog';
import { toast } from '../../../components/ui/use-toast';

interface PlaylistDetailsProps {
  playlist: Playlist;
  isLoading?: boolean;
}

export function PlaylistDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Playlist header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-80 mb-2" />
          <Skeleton className="h-4 w-60" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>

      {/* Playlist info skeleton */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Videos list skeleton */}
      <div className="mt-8">
        <Skeleton className="h-6 w-40 mb-4" />

        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="border rounded-md p-4 flex flex-col md:flex-row md:items-center gap-4">
              <Skeleton className="h-20 w-36 rounded-md" />
              <div className="flex-1">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="flex gap-2 self-end md:self-center mt-2 md:mt-0">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PlaylistDetails({ playlist, isLoading = false }: PlaylistDetailsProps) {
  const downloadVideoMutation = useDownloadVideo();
  const removeVideoMutation = useRemoveVideoFromPlaylist();
  const deletePlaylistMutation = useDeletePlaylist();
  const downloadPlaylistMutation = useDownloadPlaylist();
  const [addVideoDialogOpen, setAddVideoDialogOpen] = useState(false);
  const [editPlaylistDialogOpen, setEditPlaylistDialogOpen] = useState(false);
  const [downloadOptionsOpen, setDownloadOptionsOpen] = useState(false);

  // Player state
  const { playVideo, currentVideo, isPlayerVisible } = usePlayerStore();

  if (isLoading) {
    return <PlaylistDetailsSkeleton />;
  }

  const handleDownloadVideo = (videoId: string) => {
    downloadVideoMutation.mutate({
      playlistId: playlist.id,
      videoId
    });
  };

  const handleRemoveVideo = (videoId: string) => {
    removeVideoMutation.mutate({
      playlistId: playlist.id,
      videoId
    });
  };

  const handleDeletePlaylist = () => {
    deletePlaylistMutation.mutate(playlist.id);
  };

  const handleDownloadPlaylist = () => {
    setDownloadOptionsOpen(true);
  };

  const handleDownloadWithOptions = async (options: DownloadOptions & { downloadLocation: string }) => {
    try {
      // Save the selected download location as the default for future downloads
      await window.api.settings.set('downloadLocation', options.downloadLocation);

      // Save the selected format and quality as defaults
      if (options.format) {
        await window.api.settings.set('downloadFormat', options.format);
      }

      if (options.quality) {
        await window.api.settings.set('maxQuality', options.quality);
      }

      // Close the dialog
      setDownloadOptionsOpen(false);

      // Start the download with the selected options
      downloadPlaylistMutation.mutate(playlist.id);

      toast({
        title: 'Download Started',
        description: `Downloading ${playlist.name} with ${options.format || 'mp4'} format at ${options.quality || '1080p'} quality`,
      });
    } catch (error) {
      console.error('Error starting download:', error);
      toast({
        title: 'Error',
        description: 'Failed to start download',
        variant: 'destructive'
      });
    }
  };

  const getVideoStatusIcon = (video: Video) => {
    if (video.downloaded) {
      return <Check className="h-4 w-4 text-green-500" />;
    }

    if (video.status === 'unavailable') {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }

    return null;
  };

  const emptyState = (
    <>
      <div className="text-center p-8 border border-dashed rounded-lg mt-8">
        <Play className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No videos in this playlist</h3>
        <p className="text-muted-foreground mb-4">
          {playlist.sourceUrl
            ? "This playlist doesn't have any videos yet. Try refreshing the playlist."
            : "Add your first video to this playlist"}
        </p>
        {!playlist.sourceUrl && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddVideoDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </div>
        )}
      </div>

      {/* Add Video Dialog for empty state */}
      {addVideoDialogOpen && !playlist.sourceUrl && (
        <AddVideoDialog
          open={addVideoDialogOpen}
          onOpenChange={setAddVideoDialogOpen}
          playlist={playlist}
        />
      )}

      {/* Edit Playlist Dialog for empty state */}
      {editPlaylistDialogOpen && !playlist.sourceUrl && (
        <EditPlaylistDialog
          open={editPlaylistDialogOpen}
          onOpenChange={setEditPlaylistDialogOpen}
          playlist={playlist}
        />
      )}
    </>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-muted-foreground mt-1 max-h-20 overflow-y-auto text-sm">{playlist.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {/* Edit button for custom playlists */}
          {!playlist.sourceUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditPlaylistDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPlaylist}
            disabled={downloadPlaylistMutation.isPending || playlist.videos.length === 0}
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
                  onClick={handleDeletePlaylist}
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

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center">
          <Play className="h-4 w-4 mr-1" />
          {playlist.videos.length} {playlist.videos.length === 1 ? 'video' : 'videos'}
        </span>
        {playlist.sourceUrl && (
          <span className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Imported from YouTube
          </span>
        )}
      </div>

      {playlist.videos.length === 0 ? (
        emptyState
      ) : (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Videos ({playlist.videos.length})</h2>
            {/* Add Video button for custom playlists */}
            {!playlist.sourceUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddVideoDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            )}
          </div>

          {/* Render AddVideoDialog only when needed */}
          {addVideoDialogOpen && (
            <AddVideoDialog
              open={addVideoDialogOpen}
              onOpenChange={setAddVideoDialogOpen}
              playlist={playlist}
            />
          )}

          {/* Render EditPlaylistDialog only when needed */}
          {editPlaylistDialogOpen && !playlist.sourceUrl && (
            <EditPlaylistDialog
              open={editPlaylistDialogOpen}
              onOpenChange={setEditPlaylistDialogOpen}
              playlist={playlist}
            />
          )}

          <div className="video-list-container">
            <div className="space-y-2">
              {playlist.videos.map((video) => (
              <div
                key={video.id}
                className="border rounded-md p-3 flex flex-col md:flex-row md:items-center gap-3"
              >
                <div className="h-20 w-36 bg-muted/40 rounded-md overflow-hidden flex-shrink-0">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium break-words" title={video.title}>{video.title}</h3>
                  {video.url && (
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary inline-block max-w-full truncate"
                      title={video.url}
                    >
                      {video.url.replace(/^https?:\/\/(www\.)?youtube\.com\/watch\?v=/, 'youtube.com/...')}
                    </a>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    {getVideoStatusIcon(video)}
                    {video.downloaded ? (
                      <span className="text-green-500">Downloaded</span>
                    ) : (
                      <span>{video.status || 'Not downloaded'}</span>
                    )}
                    {video.duration && (
                      <span>• {formatDuration(video.duration)}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 self-end md:self-center mt-2 md:mt-0">
                  {/* Play button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => playVideo(video, playlist)}
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Play className="h-4 w-4" />
                    <span className="sr-only">Play</span>
                  </Button>

                  {/* Download button */}
                  {!video.downloaded && video.status !== 'unavailable' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadVideo(video.id)}
                      disabled={downloadVideoMutation.isPending}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Video</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove "{video.title}" from this playlist?
                          {video.downloaded && ' The downloaded file will not be deleted.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveVideo(video.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Video Player */}
          {isPlayerVisible && currentVideo && (
            <div className="mt-6">
              <VideoPlayer
                videoId={currentVideo.id}
                playlistId={playlist.id}
                videoUrl={currentVideo.url}
                title={currentVideo.title}
                onNext={() => usePlayerStore.getState().playNext()}
                onPrevious={() => usePlayerStore.getState().playPrevious()}
                hasNext={usePlayerStore.getState().currentVideoIndex < playlist.videos.length - 1}
                hasPrevious={usePlayerStore.getState().currentVideoIndex > 0}
              />
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <AddVideoDialog
        open={addVideoDialogOpen}
        onOpenChange={setAddVideoDialogOpen}
        playlist={playlist}
      />

      <EditPlaylistDialog
        open={editPlaylistDialogOpen}
        onOpenChange={setEditPlaylistDialogOpen}
        playlist={playlist}
      />

      <DownloadOptionsDialog
        open={downloadOptionsOpen}
        onOpenChange={setDownloadOptionsOpen}
        playlist={playlist}
        onDownload={handleDownloadWithOptions}
        isDownloading={downloadPlaylistMutation.isPending}
      />
    </div>
  );
}