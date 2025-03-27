import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Loader2 } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';

interface LoadingDialogProps {
  isOpen: boolean;
  message?: string;
  progress?: {
    current?: number;
    total?: number;
    percent?: number;
  };
}

export const LoadingDialog: React.FC<LoadingDialogProps> = ({ 
  isOpen, 
  message = 'Loading...',
  progress
}) => {
  // Calculate the percent if we have current and total values
  const percent = progress?.percent !== undefined 
    ? progress.percent 
    : (progress?.current !== undefined && progress?.total) 
      ? Math.min(Math.round((progress.current / progress.total) * 100), 100)
      : undefined;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md flex flex-col items-center justify-center py-12" hideClose>
        {/* Visually hidden title for screen readers */}
        <DialogTitle className="sr-only">Progress Dialog</DialogTitle>
        <DialogDescription className="sr-only">
          {message} {progress?.current !== undefined && progress?.total 
            ? `Processing ${progress.current} of ${progress.total} items.` 
            : ''}
        </DialogDescription>
        
        <div className="flex flex-col items-center justify-center space-y-6 w-full">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-lg font-medium text-center">{message}</p>
          
          {percent !== undefined && (
            <div className="w-full px-4 space-y-2">
              <Progress.Root 
                className="relative overflow-hidden bg-secondary rounded-full w-full h-4"
                value={percent}
              >
                <Progress.Indicator 
                  className="w-full h-full bg-primary transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${100 - percent}%)` }}
                />
              </Progress.Root>
              {progress?.current !== undefined && progress?.total && (
                <p className="text-sm text-muted-foreground text-center">
                  {progress.current} of {progress.total} ({percent}%)
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add this additional component to DialogContent.d.ts or declare it here
declare module '@radix-ui/react-dialog' {
  interface DialogContentProps {
    hideClose?: boolean;
  }
} 