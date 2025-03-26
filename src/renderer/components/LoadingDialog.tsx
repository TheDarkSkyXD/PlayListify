import React from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Loader2 } from 'lucide-react';

interface LoadingDialogProps {
  isOpen: boolean;
  message?: string;
}

export const LoadingDialog: React.FC<LoadingDialogProps> = ({ 
  isOpen, 
  message = 'Loading...' 
}) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md flex flex-col items-center justify-center py-12" hideClose>
        <div className="flex flex-col items-center justify-center space-y-6">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-lg font-medium text-center">{message}</p>
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