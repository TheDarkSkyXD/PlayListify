import React from 'react';
import {
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmAction: () => void;
  cancelAction: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  confirmAction,
  cancelAction,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
}) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={cancelAction}>
          {cancelText}
        </Button>
        <Button
          variant={isDestructive ? 'destructive' : 'default'}
          onClick={confirmAction}
        >
          {confirmText}
        </Button>
      </div>
    </>
  );
};

export default ConfirmationModal; 