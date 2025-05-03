import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Skeleton component for loading states
 * 
 * @example
 * ```tsx
 * <Skeleton className="h-20 w-36 rounded-md" />
 * <Skeleton className="h-5 w-3/4 mt-2" />
 * <Skeleton className="h-4 w-1/2 mt-2" />
 * ```
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-secondary/60",
        className
      )}
      {...props}
    />
  );
}

/**
 * Playlist Skeleton component for displaying skeleton loaders for playlists
 */
export function PlaylistSkeleton() {
  return (
    <div className="p-4 border rounded-md bg-card flex items-center space-x-4">
      {/* Thumbnail skeleton */}
      <Skeleton className="h-12 w-12 rounded-md flex-shrink-0" />
      
      {/* Content skeleton */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      
      {/* Action buttons skeleton */}
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Grid Skeleton component for displaying a grid of playlist skeletons
 */
export function PlaylistGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <div 
            key={index} 
            className="border rounded-md bg-card overflow-hidden flex flex-col"
          >
            {/* Thumbnail skeleton */}
            <Skeleton className="w-full h-32" />
            
            {/* Content skeleton */}
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between items-center mt-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        ))}
    </div>
  );
} 