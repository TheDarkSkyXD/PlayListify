import React from 'react';
import { cn } from '../../../../utils/cn';
import { VideoPlayerProps } from './types';
import { useVideoPlayer } from './useVideoPlayer';
import { VideoPlayerYouTube } from './VideoPlayerYouTube';
import { VideoPlayerLocal } from './VideoPlayerLocal';
import { VideoPlayerError } from './VideoPlayerError';
import { VideoPlayerLoading } from './VideoPlayerLoading';

/**
 * Main VideoPlayer component that handles different video sources and states
 */
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
  const {
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
  } = useVideoPlayer(videoId, playlistId, videoUrl);

  return (
    <div 
      ref={playerContainerRef}
      className={cn("relative overflow-hidden bg-black rounded-md w-full aspect-video", className)}
      data-playing={playing ? "true" : "false"}
      data-fullscreen={fullscreen ? "true" : "false"}
    >
      {loading ? (
        <VideoPlayerLoading />
      ) : error ? (
        <VideoPlayerError error={error} onRetry={handleRetry} />
      ) : videoPath ? (
        isYouTubeVideo(videoPath) ? (
          <VideoPlayerYouTube
            url={videoPath}
            title={title}
            playing={playing}
            volume={volume}
            muted={muted}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onError={handleError}
            onNext={onNext}
            onPrevious={onPrevious}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
          />
        ) : (
          <VideoPlayerLocal
            url={videoPath}
            title={title}
            playing={playing}
            volume={volume}
            muted={muted}
            played={played}
            seeking={seeking}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onPlayPause={handlePlayPause}
            onMute={handleMute}
            onVolumeChange={handleVolumeChange}
            onSeek={handleSeekChange}
            onSeekMouseDown={handleSeekMouseDown}
            onSeekMouseUp={handleSeekMouseUp}
            onFullscreen={handleFullscreen}
            onError={handleError}
            playerRef={playerRef}
            onNext={onNext}
            onPrevious={onPrevious}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
          />
        )
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          No video source available
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
