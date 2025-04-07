import React from 'react';
import ReactPlayer from 'react-player';
import { Button } from '../../../../components/ui/button';
import { SkipBack, SkipForward } from 'lucide-react';
import { VideoPlayerYouTubeProps } from './types';

/**
 * YouTube-specific video player implementation
 */
export function VideoPlayerYouTube({
  url,
  title,
  playing,
  volume,
  muted,
  onProgress,
  onDuration,
  onError,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}: VideoPlayerYouTubeProps) {
  return (
    <>
      <ReactPlayer
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
          youtube: {
            playerVars: {
              origin: window.location.origin,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              controls: 1,
              iv_load_policy: 3, // Disable annotations
              fs: 1, // Enable fullscreen button
              playsinline: 1, // Play inline on mobile devices
              disablekb: 0, // Enable keyboard controls
              enablejsapi: 1, // Enable JavaScript API
              autoplay: playing ? 1 : 0 // Respect the playing state
            },
            embedOptions: {},
            onUnstarted: () => console.log('Video unstarted')
          }
        }}
      />

      {/* Video title */}
      {title && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <h3 className="text-white font-medium truncate">{title}</h3>
        </div>
      )}

      {/* Simple playlist navigation for YouTube videos */}
      {(hasNext || hasPrevious) && (
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
  );
}
