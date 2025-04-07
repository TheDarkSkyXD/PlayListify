import { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { UseVideoPlayerReturn } from './types';

/**
 * Custom hook for managing video player state and functionality
 */
export function useVideoPlayer(
  videoId: string,
  playlistId: string,
  videoUrl?: string
): UseVideoPlayerReturn {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const playerRef = useRef<ReactPlayer>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const defaultVolume = await window.api.settings.get('defaultVolume');
        if (defaultVolume !== undefined && defaultVolume !== null) {
          setVolume(defaultVolume);
        }

        const defaultMuted = await window.api.settings.get('defaultMuted');
        if (defaultMuted !== undefined && defaultMuted !== null) {
          setMuted(defaultMuted);
        }
      } catch (error) {
        console.error('Error loading player settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Check if the video file exists and get its path
  useEffect(() => {
    const checkVideoFile = async () => {
      setLoading(true);
      setError(null);

      try {
        // If we have a direct URL, use it first
        if (videoUrl) {
          // For YouTube videos, we want to use the URL directly
          if (isYouTubeVideo(videoUrl)) {
            console.log('Using YouTube URL:', videoUrl);
            setVideoPath(videoUrl);
            setLoading(false);
            return;
          }

          // For other URLs, we'll still use them directly
          setVideoPath(videoUrl);
          setLoading(false);
          return;
        }

        // Otherwise try to get the local file
        const playlist = await window.api.playlists.getById(playlistId);

        if (!playlist) {
          throw new Error('Playlist not found');
        }

        // Find the video in the playlist
        const video = playlist.videos.find((v: any) => v.id === videoId);
        if (!video) {
          throw new Error('Video not found in playlist');
        }

        // Check if the video exists locally
        if (video.downloaded) {
          // Get the download location
          const downloadLocation = await window.api.settings.get('downloadLocation');
          if (!downloadLocation) {
            throw new Error('Download location not set');
          }

          // Construct the file path
          const filePath = `file://${downloadLocation}/${playlist.name}/${videoId}.mp4`;
          setVideoPath(filePath);
        } else if (video.url) {
          // If not downloaded, use the URL
          console.log('Video not downloaded, using URL:', video.url);
          setVideoPath(video.url);
        } else {
          throw new Error('Video not downloaded and no URL provided');
        }
      } catch (err) {
        console.error('Error checking video file:', err);
        if (videoUrl) {
          setVideoPath(videoUrl);
        } else {
          setError('Failed to load video. It may not be downloaded yet.');
        }
      } finally {
        setLoading(false);
      }
    };

    checkVideoFile();
  }, [videoId, playlistId, videoUrl]);

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if the player is mounted
      if (!playerRef.current) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'm':
          e.preventDefault();
          handleMute();
          break;
        case 'f':
          e.preventDefault();
          handleFullscreen();
          break;
        case 'arrowright':
          e.preventDefault();
          playerRef.current.seekTo(playerRef.current.getCurrentTime() + 10);
          break;
        case 'arrowleft':
          e.preventDefault();
          playerRef.current.seekTo(playerRef.current.getCurrentTime() - 10);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(volume + 0.1, 1));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(volume - 0.1, 0));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [volume, playing]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle play/pause
  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  // Handle mute toggle
  const handleMute = () => {
    setMuted(!muted);
  };

  // Handle volume change
  const handleVolumeChange = (value: number) => {
    setVolume(value);
    setMuted(value === 0);
  };

  // Handle seek change
  const handleSeekChange = (value: number[]) => {
    setPlayed(value[0]);
  };

  // Handle seek mouse down
  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  // Handle seek mouse up
  const handleSeekMouseUp = () => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(played);
    }
  };

  // Handle progress
  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };

  // Handle duration
  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  // Handle fullscreen
  const handleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Handle error
  const handleError = (error: any) => {
    console.error('Player error:', error);
    setError('Failed to play video. The file may be corrupted or in an unsupported format.');
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Force reload the player
    if (videoPath) {
      const currentPath = videoPath;
      setVideoPath(null);
      setTimeout(() => setVideoPath(currentPath), 100);
    }
    setLoading(false);
  };

  // Check if a video is a YouTube video
  const isYouTubeVideo = (path: string | null) => {
    if (!path) return false;
    return path.includes('youtube.com') || path.includes('youtu.be');
  };

  return {
    playing,
    volume,
    muted,
    played,
    duration,
    seeking,
    fullscreen,
    error,
    videoPath,
    loading,
    playerRef,
    playerContainerRef,
    handlePlayPause,
    handleMute,
    handleVolumeChange,
    handleSeekChange,
    handleSeekMouseDown,
    handleSeekMouseUp,
    handleProgress,
    handleDuration,
    handleFullscreen,
    handleError,
    handleRetry,
    isYouTubeVideo
  };
}
