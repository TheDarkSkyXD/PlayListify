import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlaylistDetailsProps } from './types';
import { Playlist, Video } from '../../../../../shared/types/appTypes';
import { playlistService } from '../../../../services/playlistService';
import { toast } from '../../../../components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import PlaylistHeader from './PlaylistHeader';
import PlaylistInfo from './PlaylistInfo';
import VideoList from './VideoList';

/**
 * Main component for displaying playlist details
 * Handles loading the playlist and rendering the appropriate components
 */
const PlaylistDetails: React.FC<Partial<PlaylistDetailsProps>> = ({
  playlist: propPlaylist,
  onPlayVideo: propOnPlayVideo,
  onRefresh: propOnRefresh
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(propPlaylist || null);
  const [loading, setLoading] = useState(!propPlaylist);
  const [error, setError] = useState<string | null>(null);

  // Load the playlist if not provided as a prop
  useEffect(() => {
    if (propPlaylist) {
      setPlaylist(propPlaylist);
      return;
    }

    if (!id) {
      setError('No playlist ID provided');
      return;
    }

    const fetchPlaylist = async () => {
      try {
        setLoading(true);
        const fetchedPlaylist = await playlistService.getPlaylist(id);

        if (!fetchedPlaylist) {
          setError('Playlist not found');
          return;
        }

        setPlaylist(fetchedPlaylist);
      } catch (error) {
        console.error('Error fetching playlist:', error);
        setError('Failed to load playlist');
        toast({
          title: 'Error',
          description: 'Failed to load playlist. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id, propPlaylist]);

  // Automatically check and update video qualities in the background
  useEffect(() => {
    if (!playlist || loading) {
      console.log('Playlist not loaded or loading, skipping quality update');
      return;
    }

    console.log('Checking if videos need quality information...');
    console.log('Playlist:', playlist.name, 'ID:', playlist.id);
    console.log('Videos count:', playlist.videos.length);

    // Check if any videos need quality information
    const videosNeedingQualityInfo = playlist.videos.filter(
      video => !video.maxQuality || video.maxQuality === 'unknown'
    );

    console.log('Videos needing quality info:', videosNeedingQualityInfo.length);
    console.log('Videos with quality info:', playlist.videos.length - videosNeedingQualityInfo.length);

    // Log some sample videos
    if (playlist.videos.length > 0) {
      console.log('Sample video 1:', JSON.stringify(playlist.videos[0]));
      if (playlist.videos.length > 1) {
        console.log('Sample video 2:', JSON.stringify(playlist.videos[1]));
      }
    }

    if (videosNeedingQualityInfo.length === 0) {
      console.log('All videos already have quality information');
      return;
    }

    // Show a toast notification to inform the user that quality information is being updated
    toast({
      title: 'Updating video qualities',
      description: `Checking quality for ${videosNeedingQualityInfo.length} videos...`,
      duration: 3000,
    });

    console.log(`Updating quality information for ${videosNeedingQualityInfo.length} videos in the background`);

    // Update qualities in the background with UI feedback
    const updateQualities = async () => {
      try {
        // Create a toast ID for updating progress
        const toastId = toast({
          title: 'Updating video qualities',
          description: 'Starting quality checks...',
          duration: 5000,
        }).id;

        // Process videos in batches to avoid overwhelming the system
        const batchSize = 2; // Reduced batch size to avoid rate limiting
        let updatedCount = 0;

        for (let i = 0; i < videosNeedingQualityInfo.length; i += batchSize) {
          const batch = videosNeedingQualityInfo.slice(i, i + batchSize);

          // Update progress toast
          toast({
            id: toastId,
            title: 'Updating video qualities',
            description: `Checking videos ${i+1}-${Math.min(i+batchSize, videosNeedingQualityInfo.length)} of ${videosNeedingQualityInfo.length}...`,
            duration: 5000,
          });

          // Process each video in the batch concurrently
          await Promise.all(
            batch.map(async (video) => {
              try {
                console.log(`Updating quality for video ${video.id}`);
                const updatedVideo = await playlistService.updateVideoQuality(playlist.id, video.id);
                if (updatedVideo) {
                  updatedCount++;
                  console.log(`Successfully updated quality for video ${video.id}: ${updatedVideo.maxQuality}`);
                }
              } catch (error) {
                console.error(`Error updating quality for video ${video.id}:`, error);
              }
            })
          );

          // Refresh the playlist after each batch to show progress
          if (updatedCount > 0) {
            console.log(`Refreshing playlist after updating ${updatedCount} videos so far`);
            await handleRefresh();
          }

          // Larger delay between batches to avoid rate limiting
          if (i + batchSize < videosNeedingQualityInfo.length) {
            console.log(`Waiting before processing next batch of videos...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        console.log(`Updated quality information for ${updatedCount} videos`);

        // Show completion toast
        toast({
          title: 'Quality update complete',
          description: `Updated quality information for ${updatedCount} videos.`,
          duration: 3000,
        });

        // Final refresh of the playlist to show all updated qualities
        if (updatedCount > 0) {
          console.log('Final refresh of playlist to show all updated qualities');
          handleRefresh();
        }
      } catch (error) {
        console.error('Error updating video qualities:', error);
        toast({
          title: 'Error updating qualities',
          description: 'There was a problem updating video qualities.',
          variant: 'destructive',
          duration: 3000,
        });
      }
    };

    // Start the background update process
    updateQualities();
  }, [playlist, loading, handleRefresh]);

  // Handle playing a video
  const handlePlayVideo = (video: Video) => {
    if (propOnPlayVideo) {
      propOnPlayVideo(video);
    } else {
      navigate(`/player/${playlist?.id}/${video.id}`);
    }
  };

  // Handle refreshing the playlist
  const handleRefresh = async () => {
    if (propOnRefresh) {
      propOnRefresh();
      return;
    }

    if (!id) return;

    try {
      setLoading(true);
      const refreshedPlaylist = await playlistService.getPlaylist(id);

      if (!refreshedPlaylist) {
        setError('Playlist not found');
        return;
      }

      setPlaylist(refreshedPlaylist);
    } catch (error) {
      console.error('Error refreshing playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh playlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show error state
  if (error || !playlist) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold text-red-500">
          {error || 'Playlist not found'}
        </h2>
        <p className="text-muted-foreground">
          The playlist you're looking for doesn't exist or couldn't be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlaylistHeader playlist={playlist} onRefresh={handleRefresh} />
      <PlaylistInfo playlist={playlist} />
      <VideoList playlist={playlist} onPlayVideo={handlePlayVideo} />
    </div>
  );
};

export default PlaylistDetails;
