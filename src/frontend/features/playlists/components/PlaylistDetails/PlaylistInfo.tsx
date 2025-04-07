import React from 'react';
import { PlaylistInfoProps } from './types';
import { formatDate } from '../../../../../shared/utils/dateUtils';
import { Badge } from '../../../../components/ui/badge';

/**
 * Component to display playlist metadata
 * Shows video count, creation date, and source
 */
const PlaylistInfo: React.FC<PlaylistInfoProps> = ({ playlist }) => {
  const videoCount = playlist.videos.length;
  const downloadedCount = playlist.videos.filter(video => video.downloaded).length;
  
  return (
    <div className="flex flex-col space-y-2 mb-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>{videoCount} {videoCount === 1 ? 'video' : 'videos'}</span>
        <span>•</span>
        <span>Created {formatDate(playlist.createdAt)}</span>
        
        {playlist.source && (
          <>
            <span>•</span>
            <span>Source: {playlist.source}</span>
          </>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {downloadedCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {downloadedCount} downloaded
          </Badge>
        )}
        
        {playlist.source === 'youtube' && (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200 text-xs">
            YouTube
          </Badge>
        )}
      </div>
    </div>
  );
};

export default PlaylistInfo;
