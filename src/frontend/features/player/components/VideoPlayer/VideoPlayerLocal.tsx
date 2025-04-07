import React from 'react';
import ReactPlayer from 'react-player';
import { VideoPlayerLocalProps } from './types';
import { VideoPlayerControls } from './VideoPlayerControls';

/**
 * Local video player implementation
 */
export function VideoPlayerLocal({
  url,
  title,
  playing,
  volume,
  muted,
  played,
  seeking,
  onProgress,
  onDuration,
  onPlayPause,
  onMute,
  onVolumeChange,
  onSeek,
  onSeekMouseDown,
  onSeekMouseUp,
  onFullscreen,
  onError,
  playerRef,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}: VideoPlayerLocalProps) {
  return (
    <>
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        volume={volume}
        muted={muted}
        width="100%"
        height="100%"
        onProgress={onProgress}
        onDuration={onDuration}
        onError={onError}
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
            },
          },
        }}
      />

      {/* Video title */}
      {title && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <h3 className="text-white font-medium truncate">{title}</h3>
        </div>
      )}

      {/* Custom controls */}
      <VideoPlayerControls
        playing={playing}
        muted={muted}
        volume={volume}
        played={played}
        duration={playerRef.current?.getDuration() || 0}
        fullscreen={false}
        onPlayPause={onPlayPause}
        onMute={onMute}
        onVolumeChange={onVolumeChange}
        onSeek={onSeek}
        onSeekMouseDown={onSeekMouseDown}
        onSeekMouseUp={onSeekMouseUp}
        onFullscreen={onFullscreen}
        onNext={onNext}
        onPrevious={onPrevious}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
      />
    </>
  );
}
