import React, { useState } from 'react';
import { VideoListProps } from './types';
import VideoItem from './VideoItem';
import EmptyState from './EmptyState';
import { Input } from '../../../../components/ui/input';
import { Search } from 'lucide-react';

/**
 * Component to display the list of videos in a playlist
 * Includes search functionality
 */
const VideoList: React.FC<VideoListProps> = ({ playlist, onPlayVideo }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Filter videos based on search query
  const filteredVideos = playlist.videos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle video deletion by refreshing the list
  const handleVideoDeleted = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  // If there are no videos, show the empty state
  if (playlist.videos.length === 0) {
    return <EmptyState playlistId={playlist.id} />;
  }
  
  return (
    <div className="space-y-4" key={refreshKey}>
      {/* Search input */}
      {playlist.videos.length > 5 && (
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
      
      {/* Video list */}
      <div className="space-y-1">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No videos match your search
          </div>
        ) : (
          filteredVideos.map(video => (
            <VideoItem
              key={video.id}
              video={video}
              playlistId={playlist.id}
              onPlayVideo={onPlayVideo}
              onVideoDeleted={handleVideoDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default VideoList;
