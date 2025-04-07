import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Slider } from '../../../../components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { formatDuration } from '../../../../utils/formatting';
import { VideoPlayerControlsProps } from './types';

/**
 * Custom controls for the video player
 */
export function VideoPlayerControls({
  playing,
  muted,
  volume,
  played,
  duration,
  fullscreen,
  onPlayPause,
  onMute,
  onVolumeChange,
  onSeek,
  onSeekMouseDown,
  onSeekMouseUp,
  onFullscreen,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}: VideoPlayerControlsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity">
      {/* Progress bar */}
      <div className="mb-2">
        <Slider
          value={[played * 100]}
          min={0}
          max={100}
          step={0.1}
          onValueChange={(value) => onSeek(value[0] / 100)}
          onValueCommit={onSeekMouseUp}
          onMouseDown={onSeekMouseDown}
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
            onClick={onPlayPause}
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

          {/* Volume control */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={onMute}
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <Slider
              value={[muted ? 0 : volume * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => onVolumeChange(value[0] / 100)}
              className="w-24"
            />
          </div>

          {/* Time display */}
          <div className="text-white text-xs">
            {formatDuration(played * duration)} / {formatDuration(duration)}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Fullscreen button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={onFullscreen}
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
