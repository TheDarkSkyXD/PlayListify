import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { Loader2 } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';

interface LoadingDialogProps {
  isOpen: boolean;
  message?: string;
  progress?: {
    current?: number;
    total?: number;
    label?: string;
  };
  title?: string;
  description?: string;
}

/**
 * A loading dialog component that displays a spinner and optional progress bar
 * Used for long-running operations
 */
export default function LoadingDialog({
  isOpen,
  message = 'Please wait...',
  progress,
  title = 'Loading',
  description = 'This may take a moment',
}: LoadingDialogProps) {
  // Calculate progress percentage
  const progressPercentage = progress?.current && progress?.total
    ? Math.round((progress.current / progress.total) * 100)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          {/* Spinner */}
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          
          {/* Message */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {message}
          </p>
          
          {/* Progress bar (if progress is provided) */}
          {progress && (
            <div className="w-full space-y-2">
              <Progress.Root
                className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                value={progressPercentage || 0}
              >
                <Progress.Indicator
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPercentage || 0}%` }}
                />
              </Progress.Root>
              
              {/* Progress label */}
              {progress.label && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  {progress.label}
                </p>
              )}
              
              {/* Progress percentage */}
              {progressPercentage !== null && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  {progressPercentage}%
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
