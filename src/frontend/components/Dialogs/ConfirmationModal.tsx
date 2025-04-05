import React from 'react';
import {
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'destructive';
}

/**
 * A reusable confirmation modal component
 * Used for confirming potentially destructive actions
 */
export default function ConfirmationModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmationModalProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </div>
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </>
  );
}
