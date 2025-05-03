import React, { useState, useEffect } from 'react';
import { useGetPlaylistDetails, useUpdateVideoPosition } from '../../hooks/usePlaylistQueries';
import { Playlist, PlaylistVideo } from '../../../shared/types/appTypes';
import { VideoItem, PlaylistVideoFromDb } from './VideoItem';
import { usePlaylistStore } from '../../store/playlistStore';
import { Button } from '../ui/Button';
import { Download, Pencil, Trash, ExternalLink } from 'lucide-react';
import DownloadOptionsDialog from '../../features/downloads/components/DownloadOptionsDialog';
import { formatDuration, formatDate } from '../../utils/formatting';

// Define the structure of the data returned by useGetPlaylistDetails
interface PlaylistDetails {
  playlist: Playlist & { 
    source?: string; 
    videos: PlaylistVideoFromDb[];
    duration_seconds?: number;
  };
  videos: PlaylistVideoFromDb[];
}

interface PlaylistViewProps {
  playlistId: number;
  onVideoAction: (action: 'play' | 'download' | 'remove', video: PlaylistVideoFromDb) => void;
  onPlaylistAction: (action: 'refresh' | 'export' | 'rename' | 'delete', playlist: Playlist) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlistId,
  onVideoAction,
  onPlaylistAction,
}) => {
  const { data, isLoading, error } = useGetPlaylistDetails(playlistId) as { 
    data: PlaylistDetails | undefined; 
    isLoading: boolean; 
    error: Error | null 
  };
  const updatePositionMutation = useUpdateVideoPosition();
  
  const { selectedVideoId, setSelectedVideoId } = usePlaylistStore();
  
  // State for search/filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVideos, setFilteredVideos] = useState<PlaylistVideoFromDb[]>([]);
  
  // State for drag and drop
  const [draggedVideoId, setDraggedVideoId] = useState<number | null>(null);
  const [dragOverVideoId, setDragOverVideoId] = useState<number | null>(null);

  // State for download options
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  
  // Update filtered videos when data or search term changes
  useEffect(() => {
    if (!data?.videos) {
      setFilteredVideos([]);
      return;
    }
    
    if (!searchTerm) {
      setFilteredVideos(data.videos);
      return;
    }
    
    const filtered = data.videos.filter((video: PlaylistVideoFromDb) => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        video.title.toLowerCase().includes(searchTermLower) ||
        (video.author && video.author.toLowerCase().includes(searchTermLower))
      );
    });
    
    setFilteredVideos(filtered);
  }, [data?.videos, searchTerm]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle video selection
  const handleSelectVideo = (id: number) => {
    setSelectedVideoId(id);
  };
  
  // Handle drag start
  const handleDragStart = (video: PlaylistVideoFromDb) => {
    setDraggedVideoId(video.id);
  };
  
  // Handle drag over
  const handleDragOver = (video: PlaylistVideoFromDb) => {
    if (draggedVideoId !== null && draggedVideoId !== video.id) {
      setDragOverVideoId(video.id);
    }
  };
  
  // Handle drag end and reordering
  const handleDragEnd = () => {
    if (draggedVideoId !== null && dragOverVideoId !== null && data) {
      const draggedVideo = data.videos.find((v: PlaylistVideoFromDb) => v.id === draggedVideoId);
      const dragOverVideo = data.videos.find((v: PlaylistVideoFromDb) => v.id === dragOverVideoId);
      
      if (draggedVideo && dragOverVideo) {
        updatePositionMutation.mutate({
          playlistId,
          videoId: draggedVideoId,
          newPosition: dragOverVideo.position,
        });
      }
    }
    
    setDraggedVideoId(null);
    setDragOverVideoId(null);
  };
  
  // Compute playlist duration in human-readable format
  const formatTotalDuration = (totalSeconds?: number) => {
    if (!totalSeconds) return '0 min';
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  // Calculate total duration and estimate size (rough estimate)
  const totalDuration = data?.videos.reduce((total, video) => 
    total + (video.duration_seconds || 0), 0) || 0;
  
  // Rough estimation: ~50MB per 10 minutes at 1080p
  const estimatedSize = (totalDuration / 600) * 50 * 1024 * 1024; // in bytes
  
  const handleDownloadAll = () => {
    setShowDownloadOptions(true);
  };
  
  const handleDownloadConfirm = (options: any) => {
    if (!data || !data.videos || data.videos.length === 0) return;
    
    // Log the download request
    console.log('Download playlist with options:', options);
    
    // If downloadAllVideos is true, download all videos in the playlist
    // Otherwise, only download selected videos (this would require additional UI for selection)
    if (options.downloadAllVideos) {
      data.videos.forEach(video => {
        // Only download videos that haven't been downloaded yet
        if (!video.downloaded) {
          onVideoAction('download', video);
        }
      });
    }
    
    // Here we would call the API to start downloading the playlist
    // window.api.downloads.addPlaylistToQueue could be implemented in the future
  };

  // Component to display when loading
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="mt-2 text-secondary-foreground/70">Loading playlist...</p>
    </div>
  );

  // Component to display when there's an error
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-destructive mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">Failed to load playlist</h3>
      <p className="text-secondary-foreground/70 mb-4">
        {error instanceof Error ? error.message : 'An error occurred while loading the playlist.'}
      </p>
      <Button
        onClick={() => window.location.reload()}
        variant="outline"
        size="sm"
      >
        Retry
      </Button>
    </div>
  );

  // Component to display when the playlist is empty
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-secondary-foreground/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">No videos in this playlist</h3>
      <p className="text-secondary-foreground/70 mb-4">
        This playlist doesn't have any videos yet.
      </p>
      {data?.playlist.source === 'youtube' && (
        <Button 
          onClick={() => onPlaylistAction('refresh', data.playlist)} 
          variant="outline" 
          size="sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh Playlist
        </Button>
      )}
    </div>
  );

  // No results found state
  const NoResultsState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-secondary-foreground/70"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2">No videos found</h3>
      <p className="text-secondary-foreground/70 mb-4">
        No videos match your search criteria.
      </p>
      <Button 
        onClick={() => setSearchTerm('')} 
        variant="outline" 
        size="sm"
      >
        Clear Search
      </Button>
    </div>
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return <ErrorState />;
  }

  const { playlist, videos } = data;
  const totalVideos = videos.length;

  return (
    <div className="h-full flex flex-col">
      {/* Playlist header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold truncate">{playlist.name}</h2>
          <div className="flex space-x-2">
            <Button 
              variant="default" 
              onClick={handleDownloadAll}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
            
            {playlist.source === 'youtube' && (
              <Button
                onClick={() => onPlaylistAction('refresh', playlist)}
                variant="ghost"
                size="sm"
                className="flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </Button>
            )}
            
            <Button
              onClick={() => onPlaylistAction('export', playlist)}
              variant="ghost"
              size="sm"
              className="flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Export
            </Button>
            
            <Button
              onClick={() => onPlaylistAction('rename', playlist)}
              variant="ghost"
              size="sm"
              className="flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Rename
            </Button>
            
            <Button
              onClick={() => onPlaylistAction('delete', playlist)}
              variant="ghost"
              size="sm"
              className="flex items-center text-destructive hover:text-destructive/90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </Button>
          </div>
        </div>
        
        {/* Playlist details */}
        <div className="flex items-center text-sm text-secondary-foreground mt-1">
          <span>{totalVideos} {totalVideos === 1 ? 'video' : 'videos'}</span>
          <span className="mx-1">•</span>
          <span>{formatTotalDuration(playlist.duration_seconds)}</span>
          {playlist.source && (
            <>
              <span className="mx-1">•</span>
              <span className="capitalize">{playlist.source}</span>
            </>
          )}
        </div>
        
        {/* Description if available */}
        {playlist.description && (
          <div className="mt-2 text-sm text-secondary-foreground/80">
            {playlist.description}
          </div>
        )}
      </div>
      
      {/* Search bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-secondary-foreground/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-secondary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Search videos by title or author..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-secondary-foreground/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Video list */}
      <div className="flex-grow overflow-y-auto">
        {totalVideos === 0 ? (
          <EmptyState />
        ) : filteredVideos.length === 0 ? (
          <NoResultsState />
        ) : (
          <div className="p-2 space-y-1">
            {filteredVideos.map((video) => (
              <VideoItem
                key={video.id}
                video={video}
                isSelected={video.id === selectedVideoId}
                onSelect={handleSelectVideo}
                onVideoAction={onVideoAction}
                isDragging={video.id === draggedVideoId}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {onPlaylistAction && (
            <Button 
              variant="outline" 
              onClick={() => onPlaylistAction('rename', playlist)}
              className="flex items-center"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          
          {onPlaylistAction && (
            <Button 
              variant="destructive" 
              onClick={() => onPlaylistAction('delete', playlist)}
              className="flex items-center"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
        
        {playlist.source === 'youtube' && playlist.videos && playlist.videos.length > 0 && playlist.videos[0].url && (
          <Button
            variant="outline"
            onClick={() => window.open(playlist.videos[0].url, '_blank', 'noopener,noreferrer')}
            className="flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in YouTube
          </Button>
        )}
      </div>
      
      {/* Download Options Dialog */}
      <DownloadOptionsDialog
        open={showDownloadOptions}
        onOpenChange={setShowDownloadOptions}
        onDownload={handleDownloadConfirm}
        playlistName={playlist.name}
        videoCount={playlist.videos?.length || 0}
        estimatedSize={estimatedSize}
        isPlaylist={true}
      />
    </div>
  );
}; 