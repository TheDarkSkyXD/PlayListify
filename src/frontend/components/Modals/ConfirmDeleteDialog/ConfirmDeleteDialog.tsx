import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/frontend/components/ui/dialog'; // Assuming Shadcn UI path alias
import { Button } from '@/frontend/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  message?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void; // Callback when confirm is clicked
  isDestructive?: boolean; // If true, confirm button will have destructive styling
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onOpenChange,
  trigger,
  title = 'Are you sure?',
  message = 'This action cannot be undone. This will permanently delete the item.',
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  onConfirm,
  isDestructive = true,
}) => {
  const handleConfirm = () => {
    onConfirm();
    if (onOpenChange) {
      onOpenChange(false); // Close the dialog after confirmation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center">
            {isDestructive && <AlertTriangle className="h-6 w-6 text-red-500 mr-2 flex-shrink-0" />}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="mt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline">{cancelButtonText}</Button>
          </DialogClose>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {confirmButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteDialog; 