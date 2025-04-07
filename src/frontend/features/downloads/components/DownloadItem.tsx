import React from 'react';
import { DownloadItem as DownloadItemType } from '../../../../shared/types/appTypes';
import { Progress } from '../../../components/ui/progress';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardFooter } from '../../../components/ui/card';
import { cn } from '../../../../lib/utils';
import {
  Play,
  Pause,
  X,
  Check,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Folder
} from 'lucide-react';
import { formatBytes, formatTimeAgo } from '../../../utils/formatUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';

interface DownloadItemProps {
  download: DownloadItemType;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
  onOpenFolder: (path: string) => void;
}

const DownloadItem: React.FC<DownloadItemProps> = ({
  download,
  onPause,
  onResume,
  onCancel,
  onRemove,
  onOpenFolder
}) => {
  const isActive = download.status === 'downloading';
  const isPaused = download.status === 'paused';
  const isCompleted = download.status === 'completed';
  const isFailed = download.status === 'failed';
  const isCanceled = download.status === 'canceled';
  const isPending = download.status === 'pending';

  const getStatusColor = () => {
    switch (download.status) {
      case 'downloading': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'paused': return 'text-yellow-500';
      case 'canceled': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (download.status) {
      case 'downloading': return 'Downloading';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'paused': return 'Paused';
      case 'canceled': return 'Canceled';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = () => {
    switch (download.status) {
      case 'downloading': return <Play className="h-4 w-4" />;
      case 'completed': return <Check className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'canceled': return <X className="h-4 w-4" />;
      case 'pending': return <Play className="h-4 w-4 opacity-50" />;
      default: return null;
    }
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Thumbnail if available */}
          {download.thumbnail && (
            <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden">
              <img
                src={download.thumbnail}
                alt={download.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Title and status */}
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-medium text-sm truncate pr-2" title={download.title}>
                {download.title}
              </h3>
              <div className={`flex items-center text-xs ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="ml-1">{getStatusText()}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <Progress
                value={download.progress}
                className="h-2"
                style={{
                  backgroundColor: isCompleted ? "rgb(34, 197, 94)" :
                                 isFailed ? "rgb(239, 68, 68)" :
                                 isPaused ? "rgb(234, 179, 8)" :
                                 "rgb(59, 130, 246)"
                }}
              />
            </div>

            {/* Download details */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <div>
                {download.format && download.quality && (
                  <span>{download.format.toUpperCase()} • {download.quality}</span>
                )}
              </div>

              <div className="flex gap-3">
                {download.speed && <span>{download.speed}</span>}
                {download.eta && <span>ETA: {download.eta}</span>}
                {download.size && <span>{formatBytes(parseInt(download.size))}</span>}
                {download.addedAt && <span>{formatTimeAgo(download.addedAt)}</span>}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 py-2 bg-muted/30 flex justify-end gap-2">
        <TooltipProvider>
          {/* Action buttons based on status */}
          {isActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPause(download.id)}
                >
                  <Pause className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pause</p>
              </TooltipContent>
            </Tooltip>
          )}

          {isPaused && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onResume(download.id)}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Resume</p>
              </TooltipContent>
            </Tooltip>
          )}

          {(isActive || isPaused || isPending) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onCancel(download.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cancel</p>
              </TooltipContent>
            </Tooltip>
          )}

          {isCompleted && download.outputPath && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onOpenFolder(download.outputPath || download.outputDir)}
                >
                  <Folder className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open folder</p>
              </TooltipContent>
            </Tooltip>
          )}

          {(isCompleted || isFailed || isCanceled) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemove(download.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

export default DownloadItem;
