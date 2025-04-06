import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Button } from '../../../components/ui/button';
import { Slider } from '../../../components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { formatDuration } from '../../../utils/formatting';
import { cn } from '../../../utils/cn';

interface VideoPlayerProps {
  videoId: string;
  playlistId: string;
  videoUrl?: string;
  title?: string;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  playlistId,
  videoUrl,
  title,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  className
}) => {
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
        const autoPlay = await window.api.settings.get('autoPlay');
        setVolume(defaultVolume ? defaultVolume / 100 : 0.8);
        setPlaying(autoPlay || false);
      } catch (err) {
        console.error('Failed to load player settings:', err);
        // Use default values if settings can't be loaded
        setVolume(0.8);
        setPlaying(false);
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
          if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
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
        // Get the playlist by ID to get its name
        const playlist = await window.api.playlists.getById(playlistId);

        if (!playlist) {
          throw new Error('Playlist not found');
        }

        // Check if the video exists locally
        const downloadLocation = await window.api.settings.get('downloadLocation');
        if (!downloadLocation) {
          throw new Error('Download location not set');
        }

        const videoExists = await window.api.fs.videoExists(
          playlistId,
          playlist.name,
          videoId,
          'mp4'
        );

        if (videoExists) {
          // Construct the file path
          const filePath = `file://${downloadLocation}/${playlist.name}/${videoId}.mp4`;
          setVideoPath(filePath);
        } else {
          // Try to find the video in the playlist and get its URL
          const video = playlist.videos.find((v: { id: string }) => v.id === videoId);
          if (video && video.url) {
            console.log('Video not found locally, using URL:', video.url);
            setVideoPath(video.url);
          } else {
            throw new Error('Video not found locally and no URL provided');
          }
        }
      } catch (err) {
        console.error('Error checking video file:', err);
        // If we have a URL, use it as fallback even if local check failed
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

  // Handle play/pause
  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setMuted(value[0] === 0);
  };

  // Handle mute toggle
  const handleMute = () => {
    setMuted(!muted);
  };

  // Handle seeking
  const handleSeekChange = (value: number[]) => {
    setPlayed(value[0]);
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekMouseUp = (value: number[]) => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(value[0]);
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
    if (playerContainerRef.current) {
      if (!document.fullscreenElement) {
        playerContainerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if the player is focused
      if (!playerContainerRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            playerRef.current.seekTo(Math.max(0, currentTime - 5));
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            playerRef.current.seekTo(Math.min(duration, currentTime + 5));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          setMuted(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'f':
          e.preventDefault();
          handleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          handleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [volume, duration, playing]);

  return (
    <div
      ref={playerContainerRef}
      className={cn(
        "relative overflow-hidden bg-black rounded-md",
        fullscreen ? "fixed inset-0 z-50" : "w-full aspect-video",
        className
      )}
      tabIndex={0}
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p className="text-center mb-4">{error}</p>

          {/* Retry button */}
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              setLoading(true);
              // Force reload the player
              if (videoPath) {
                const currentPath = videoPath;
                setVideoPath(null);
                setTimeout(() => setVideoPath(currentPath), 100);
              }
              setLoading(false);
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          {videoPath && (
            <ReactPlayer
              ref={playerRef}
              url={videoPath}
              playing={playing}
              volume={volume}
              muted={muted}
              width="100%"
              height="100%"
              onProgress={handleProgress}
              onDuration={handleDuration}
              onError={(e) => {
                console.error('Player error:', e);
                setError('Failed to play video. The file may be corrupted or in an unsupported format.');
              }}
              config={{
                youtube: {
                  playerVars: {
                    origin: window.location.origin,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    controls: 1,
                    iv_load_policy: 3,  // Disable annotations
                    fs: 1,              // Enable fullscreen button
                    playsinline: 1,     // Play inline on mobile devices
                    disablekb: 0,       // Enable keyboard controls
                    enablejsapi: 1,     // Enable JavaScript API
                    autoplay: playing ? 1 : 0  // Respect the playing state
                  },
                  embedOptions: {},
                  onUnstarted: () => console.log('Video unstarted')
                },
                file: {
                  attributes: {
                    controlsList: 'nodownload',
                  },
                },
              }}
            />
          )}

          {/* Video title overlay */}
          {title && (
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
              <h3 className="text-white font-medium truncate">{title}</h3>
            </div>
          )}

          {/* Controls overlay - only show for non-YouTube videos */}
          {videoPath && !videoPath.includes('youtube.com') && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity">
              {/* Progress bar */}
              <div className="mb-2">
                <Slider
                  value={[played]}
                  min={0}
                  max={1}
                  step={0.001}
                  onValueChange={handleSeekChange}
                  onValueCommit={handleSeekMouseUp}
                  onMouseDown={handleSeekMouseDown}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {/* Play/Pause button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={handlePlayPause}
                  >
                    {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  {/* Previous/Next buttons */}
                  {hasPrevious && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={onPrevious}
                      disabled={!onPrevious}
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                  )}

                  {hasNext && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={onNext}
                      disabled={!onNext}
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  )}

                  {/* Time display */}
                  <div className="text-white text-xs">
                    {formatDuration(played * duration)} / {formatDuration(duration)}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Volume control */}
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={handleMute}
                    >
                      {muted || volume === 0 ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>
                    <Slider
                      value={[muted ? 0 : volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                    />
                  </div>

                  {/* Fullscreen button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={handleFullscreen}
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Simple playlist navigation for YouTube videos */}
          {videoPath && videoPath.includes('youtube.com') && (hasNext || hasPrevious) && (
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              {hasPrevious && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onPrevious}
                  disabled={!onPrevious}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <SkipBack className="h-4 w-4" />
                  <span className="ml-1">Previous</span>
                </Button>
              )}

              {hasNext && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onNext}
                  disabled={!onNext}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <span className="mr-1">Next</span>
                  <SkipForward className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoPlayer;
