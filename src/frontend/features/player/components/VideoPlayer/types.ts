import { ReactPlayer } from 'react-player';

/**
 * Props for the VideoPlayer component
 */
export interface VideoPlayerProps {
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

/**
 * Props for the VideoPlayerControls component
 */
export interface VideoPlayerControlsProps {
  playing: boolean;
  muted: boolean;
  volume: number;
  played: number;
  duration: number;
  fullscreen: boolean;
  onPlayPause: () => void;
  onMute: () => void;
  onVolumeChange: (value: number) => void;
  onSeek: (value: number) => void;
  onSeekMouseDown: () => void;
  onSeekMouseUp: () => void;
  onFullscreen: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

/**
 * Props for the VideoPlayerYouTube component
 */
export interface VideoPlayerYouTubeProps {
  url: string;
  title?: string;
  playing: boolean;
  volume: number;
  muted: boolean;
  onProgress: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onDuration: (duration: number) => void;
  onError: (error: any) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

/**
 * Props for the VideoPlayerLocal component
 */
export interface VideoPlayerLocalProps {
  url: string;
  title?: string;
  playing: boolean;
  volume: number;
  muted: boolean;
  played: number;
  seeking: boolean;
  onProgress: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onDuration: (duration: number) => void;
  onPlayPause: () => void;
  onMute: () => void;
  onVolumeChange: (value: number) => void;
  onSeek: (value: number) => void;
  onSeekMouseDown: () => void;
  onSeekMouseUp: () => void;
  onFullscreen: () => void;
  onError: (error: any) => void;
  playerRef: React.RefObject<ReactPlayer>;
}

/**
 * Props for the VideoPlayerError component
 */
export interface VideoPlayerErrorProps {
  error: string;
  onRetry: () => void;
}

/**
 * Props for the VideoPlayerLoading component
 */
export interface VideoPlayerLoadingProps {
  // No props needed for now
}

/**
 * Return type for the useVideoPlayer hook
 */
export interface UseVideoPlayerReturn {
  playing: boolean;
  volume: number;
  muted: boolean;
  played: number;
  duration: number;
  seeking: boolean;
  fullscreen: boolean;
  error: string | null;
  videoPath: string | null;
  loading: boolean;
  playerRef: React.RefObject<ReactPlayer>;
  playerContainerRef: React.RefObject<HTMLDivElement>;
  handlePlayPause: () => void;
  handleMute: () => void;
  handleVolumeChange: (value: number) => void;
  handleSeekChange: (value: number[]) => void;
  handleSeekMouseDown: () => void;
  handleSeekMouseUp: () => void;
  handleProgress: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  handleDuration: (duration: number) => void;
  handleFullscreen: () => void;
  handleError: (error: any) => void;
  handleRetry: () => void;
  isYouTubeVideo: (path: string | null) => boolean;
}
