import React from 'react';
import { Skeleton } from '../../../../components/ui/skeleton';

/**
 * Skeleton loading component for settings forms
 */
export function SettingsFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-5 w-60" />
        <div className="flex">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10 ml-2" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-10 w-full" />
      </div>

      <Skeleton className="h-10 w-24 mt-6" />
    </div>
  );
}
