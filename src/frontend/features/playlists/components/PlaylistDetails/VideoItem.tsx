import React, { useState } from 'react';
import { VideoItemProps } from './types';
import { formatDuration } from '../../../../../shared/utils/formatUtils';
import { Button } from '../../../../components/ui/button';
import { CachedImage } from '../../../../components/Media/CachedImage';
import {
  Play,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../components/ui/alert-dialog';
import { toast } from '../../../../components/ui/use-toast';
import { playlistService } from '../../../../services/playlistService';

/**
 * Component to display a single video item in the playlist
 */
const VideoItem: React.FC<VideoItemProps> = ({
  video,
  playlistId,
  onPlayVideo,
  onVideoDeleted
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Handle video deletion
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await playlistService.removeVideoFromPlaylist(playlistId, video.id);
      toast({
        title: 'Video removed',
        description: 'The video has been removed from the playlist.',
      });
      onVideoDeleted();
    } catch (error) {
      console.error('Error removing video:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove the video. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle video download
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      await playlistService.downloadVideo(
        playlistId,
        video.id,
        (progress) => {
          setDownloadProgress(progress);
        }
      );

      toast({
        title: 'Download complete',
        description: 'The video has been downloaded successfully.',
      });

      // Refresh the playlist to update the downloaded status
      onVideoDeleted();
    } catch (error) {
      console.error('Error downloading video:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download the video. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Render status icon based on video status
  const renderStatusIcon = () => {
    if (video.downloaded) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    switch (video.status) {
      case 'available':
        return null;
      case 'unavailable':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'private':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex items-center p-2 hover:bg-accent rounded-md group">
        {/* Video thumbnail */}
        <div className="flex-shrink-0 mr-3 w-12 h-12 rounded overflow-hidden">
          <CachedImage
            src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
            fallbackSrc="/assets/images/video-placeholder.png"
            alt={video.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            {renderStatusIcon()}
            {renderStatusIcon() && <span className="ml-1"></span>}
            <span className="font-medium truncate">{video.title}</span>
            {video.maxQuality && (
              <span className="ml-2 px-1.5 py-0.5 bg-primary/30 text-primary rounded text-[10px] font-semibold border border-primary/30 shadow-sm">
                {video.maxQuality}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center">
            {formatDuration(video.duration)}
            {!video.maxQuality && (
              <span
                className="ml-2 px-1.5 py-0.5 bg-secondary rounded text-[10px] font-medium animate-pulse cursor-help"
                title="Quality information is being checked. This may take a moment."
              >
                Checking...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPlayVideo(video)}
            title="Play video"
          >
            <Play className="h-4 w-4" />
          </Button>

          {!video.downloaded && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={isDownloading || video.status !== 'available'}
              title={
                video.status !== 'available'
                  ? 'Video is not available for download'
                  : 'Download video'
              }
            >
              {isDownloading ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            title="Remove from playlist"
          >
            {isDeleting ? (
              <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-red-500 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 text-red-500 opacity-70 group-hover:opacity-100" />
            )}
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove video from playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the video from this playlist. The video file will not be deleted if it has been downloaded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Download progress indicator */}
      {isDownloading && downloadProgress > 0 && (
        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full"
            style={{ width: `${downloadProgress}%` }}
          />
        </div>
      )}
    </>
  );
};

export default VideoItem;
