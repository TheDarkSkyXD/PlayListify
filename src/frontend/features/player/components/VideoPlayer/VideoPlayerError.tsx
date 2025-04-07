import React from 'react';
import { Button } from '../../../../components/ui/button';
import { VideoPlayerErrorProps } from './types';

/**
 * Error display component for the video player
 */
export function VideoPlayerError({ error, onRetry }: VideoPlayerErrorProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
      <p className="text-lg font-semibold mb-2">Error</p>
      <p className="text-center mb-4">{error}</p>

      {/* Retry button */}
      <Button
        variant="outline"
        onClick={onRetry}
        className="mt-2"
      >
        Retry
      </Button>
    </div>
  );
}
