import { Playlist, Video } from '../../../../shared/types/appTypes';
import { Button } from '../../../components/ui/button';
import { Download, Trash2, Play, Check, AlertCircle } from 'lucide-react';
import { formatDuration } from '../../../utils/formatting';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';

interface VideoItemProps {
  video: Video;
  playlist: Playlist;
  onPlay: (video: Video, playlist: Playlist) => void;
  onDownload: (videoId: string) => void;
  onRemove: (videoId: string) => void;
  isDownloadPending: boolean;
}

/**
 * Component to display a single video item in the playlist
 */
export function VideoItem({
  video,
  playlist,
  onPlay,
  onDownload,
  onRemove,
  isDownloadPending
}: VideoItemProps) {
  const getVideoStatusIcon = (video: Video) => {
    if (video.downloaded) {
      return <Check className="h-4 w-4 text-green-500" />;
    }

    if (video.status === 'unavailable') {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }

    return null;
  };

  return (
    <div className="border rounded-md p-3 flex flex-col md:flex-row md:items-center gap-3">
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
          onClick={() => onPlay(video, playlist)}
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
            onClick={() => onDownload(video.id)}
            disabled={isDownloadPending}
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
                onClick={() => onRemove(video.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
