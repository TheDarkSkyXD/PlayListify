import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';

// Formatting utility function
const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  // Format with leading zeros for minutes and seconds
  const formattedMinutes = minutes.toString();
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
  
  // Include hours only if there are any
  if (hours > 0) {
    return `${hours}:${formattedMinutes.padStart(2, '0')}:${formattedSeconds}`;
  }
  
  return `${formattedMinutes}:${formattedSeconds}`;
};

// Utility to combine class names
const cn = (...classes: (string | undefined | boolean | null | { [key: string]: boolean })[]): string => {
  return classes.filter(Boolean)
    .map(cls => {
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key);
      }
      return cls;
    })
    .flat()
    .join(' ');
};

// Simple Button component
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost';
  size?: 'default' | 'icon';
  children: React.ReactNode;
}> = ({ 
  variant = 'default', 
  size = 'default', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded font-medium transition-colors";
  const variantStyles = variant === 'default' 
    ? "bg-blue-600 text-white hover:bg-blue-700" 
    : "hover:bg-gray-200 text-gray-700";
  const sizeStyles = size === 'default' 
    ? "px-4 py-2" 
    : "h-8 w-8 p-0";
  
  return (
    <button 
      className={cn(baseStyles, variantStyles, sizeStyles, className)}
      {...props}
    >
      {children}
    </button>
  );
};

// Simple Slider component
const Slider: React.FC<{
  value: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  onValueCommit?: () => void;
  className?: string;
}> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  onValueCommit,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onValueChange?.([newValue]);
  };

  const handleMouseUp = () => {
    onValueCommit?.();
  };

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
      <input
        type="range"
        value={value[0]}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(value[0] - min) / (max - min) * 100}%, #e5e7eb ${(value[0] - min) / (max - min) * 100}%, #e5e7eb 100%)`
        }}
      />
    </div>
  );
};

interface VideoPlayerProps {
  videoId: string;
  playlistId?: string;
  videoUrl?: string;
  title?: string;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

// Define types for playlist video
interface PlaylistVideo {
  id: string;
  title: string;
  url?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  playlistId,
  videoUrl,
  title,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false
}) => {
  const playerRef = useRef<ReactPlayer | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Player state
  const [playing, setPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.5); // 0-1
  const [muted, setMuted] = useState<boolean>(false);
  const [played, setPlayed] = useState<number>(0); // 0-1
  const [loaded, setLoaded] = useState<number>(0); // 0-1
  const [duration, setDuration] = useState<number>(0);
  const [seeking, setSeeking] = useState<boolean>(false);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [useAltPlayer, setUseAltPlayer] = useState<boolean>(false);

  // Check if video file exists locally
  useEffect(() => {
    const checkVideoExists = async () => {
      if (!playlistId || !videoId) return;
      
      try {
        const exists = await window.api.fs.videoExists(
          playlistId,
          'playlist', // Replace with actual playlist name
          videoId,
          'mp4'
        );
        
        if (exists) {
          console.log('Using local video file');
          // Logic to use local file instead of videoUrl
        }
      } catch (err) {
        console.error('Failed to check if video exists:', err);
      }
    };
    
    checkVideoExists();
  }, [videoId, playlistId]);

  // Handle end of video
  const handleEnded = () => {
    if (onNext && hasNext) {
      onNext();
    } else {
      setPlaying(false);
      setPlayed(0);
    }
  };

  // Handle player errors
  const handleError = (error: any) => {
    console.error('Player error:', error);
    setError('Failed to play video. Trying alternative player...');
    setUseAltPlayer(true);
  };

  // Handle player ready state
  const handleReady = () => {
    setReady(true);
    setError(null);
  };

  // Handle progress updates
  const handleProgress = (state: { played: number; loaded: number; playedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
      setLoaded(state.loaded);
    }
  };

  // Handle seeking
  const handleSeekChange = (value: number[]) => {
    setSeeking(true);
    setPlayed(value[0] / 100);
  };

  // Handle seek commit
  const handleSeekCommit = () => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(played);
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
    if (muted) setMuted(false);
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (wrapperRef.current) {
      if (!document.fullscreenElement) {
        wrapperRef.current.requestFullscreen().catch(err => {
          console.error('Error attempting to enable fullscreen:', err);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  // Add fullscreen event listeners
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
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          setPlaying(prev => !prev);
          e.preventDefault();
          break;
        case 'm':
          setMuted(prev => !prev);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'arrowright':
          if (playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            playerRef.current.seekTo(Math.min(currentTime + 5, duration), 'seconds');
          }
          break;
        case 'arrowleft':
          if (playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            playerRef.current.seekTo(Math.max(currentTime - 5, 0), 'seconds');
          }
          break;
        case 'n':
          if (onNext && hasNext) onNext();
          break;
        case 'p':
          if (onPrevious && hasPrevious) onPrevious();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNext, onPrevious, hasNext, hasPrevious, duration]);

  return (
    <div 
      ref={wrapperRef}
      className={cn(
        "relative overflow-hidden bg-black rounded-lg aspect-video",
        fullscreen && "fixed inset-0 z-50 rounded-none"
      )}
    >
      {/* Main Player */}
      <ReactPlayer 
        ref={playerRef}
        url={videoUrl}
        playing={playing}
        volume={volume}
        muted={muted}
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
        progressInterval={500}
        onProgress={handleProgress}
        onDuration={setDuration}
        onEnded={handleEnded}
        onError={handleError}
        onReady={handleReady}
        config={{
          youtube: {
            playerVars: {
              disablekb: 0,
              modestbranding: 1,
              showinfo: 0,
              rel: 0,
              iv_load_policy: 3
            }
          },
          file: {
            attributes: {
              controlsList: 'nodownload'
            }
          }
        }}
      />

      {/* Video Title Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-10 opacity-0 hover:opacity-100 transition-opacity">
        <h2 className="text-white text-lg font-medium">{title}</h2>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent z-10 opacity-0 hover:opacity-100 transition-opacity">
        {/* Progress Bar */}
        <div className="mb-2 px-2">
          <Slider 
            value={[played * 100]} 
            onValueChange={handleSeekChange}
            onValueCommit={handleSeekCommit}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-white mt-1">
            <span>{formatDuration(duration * played)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Button Controls */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            {/* Play/Pause Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setPlaying(!playing)}
              className="text-white hover:bg-white/20"
            >
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </Button>

            {/* Previous Button (if in playlist) */}
            {hasPrevious && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onPrevious}
                className="text-white hover:bg-white/20"
              >
                <SkipBack size={18} />
              </Button>
            )}

            {/* Next Button (if in playlist) */}
            {hasNext && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onNext}
                className="text-white hover:bg-white/20"
              >
                <SkipForward size={18} />
              </Button>
            )}

            {/* Volume Control */}
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMuted(!muted)}
                className="text-white hover:bg-white/20"
              >
                {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>
              <div className="w-20 hidden sm:block">
                <Slider 
                  value={[muted ? 0 : volume * 100]} 
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right Side Controls */}
          <div>
            {/* Fullscreen Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-center p-4">
          <div>
            <p className="mb-2">{error}</p>
            {useAltPlayer && (
              <div className="animate-pulse">Attempting to use YouTube player...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 