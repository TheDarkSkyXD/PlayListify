import React from 'react';
import { Playlist, Video } from '../../../../shared/types/appTypes';
import { Button } from '../../../components/ui/button';
import { Download, Trash2, Youtube, Clock, Check, AlertCircle } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatDuration } from '../../../utils/formatters';
import { useDownloadVideo, useRemoveVideoFromPlaylist } from '../../../services/queryHooks';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';

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
    <div className="text-center p-8 border border-dashed rounded-lg mt-8">
      <Youtube className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No videos in this playlist</h3>
      <p className="text-muted-foreground mb-4">
        Add your first video or import videos from YouTube
      </p>
    </div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-muted-foreground mt-1">{playlist.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete Playlist</span>
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center">
          <Youtube className="h-4 w-4 mr-1" />
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
          <h2 className="text-lg font-medium mb-4">Videos</h2>
          
          <div className="space-y-4">
            {playlist.videos.map((video) => (
              <div 
                key={video.id} 
                className="border rounded-md p-4 flex flex-col md:flex-row md:items-center gap-4"
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
                      <Youtube className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium">{video.title}</h3>
                  {video.url && (
                    <a 
                      href={video.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary break-all"
                    >
                      {video.url}
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
      )}
    </div>
  );
} 