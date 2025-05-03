import React, { forwardRef, useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export interface ToastProps {
  variant?: 'default' | 'destructive' | 'success' | 'info';
  title?: string;
  description?: string;
  open?: boolean;
  onClose?: () => void;
  duration?: number;
  id?: string;
}

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  ({ variant = 'default', title, description, open, onClose, duration = 5000 }, ref) => {
    const [isVisible, setIsVisible] = useState(open);
    
    // Handle visibility change when open prop changes
    useEffect(() => {
      setIsVisible(open);
    }, [open]);
    
    // Auto-close after duration
    useEffect(() => {
      if (isVisible && duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          if (onClose) onClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }, [isVisible, duration, onClose]);
    
    // Handle animation end
    const handleAnimationEnd = () => {
      if (!isVisible && onClose) {
        onClose();
      }
    };
    
    // Don't render anything if not visible
    if (!open && !isVisible) return null;
    
    // Get variant styles
    const variantStyles = {
      default: 'bg-background border-border',
      destructive: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-300',
      success: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-300',
      info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300',
    };
    
    // Get icon based on variant
    const Icon = {
      default: null,
      destructive: <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />,
      success: <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />,
      info: <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />
    }[variant];
    
    return (
      <div
        ref={ref}
        className={`
          fixed bottom-4 right-4 w-full max-w-sm border rounded-md shadow-lg
          ${variantStyles[variant]}
          ${isVisible ? 'animate-slide-in-right' : 'animate-slide-out-right'}
          z-50
        `}
        onAnimationEnd={handleAnimationEnd}
        role="alert"
      >
        <div className="flex items-start p-4">
          {Icon && <div className="flex-shrink-0 mr-3">{Icon}</div>}
          
          <div className="flex-1">
            {title && (
              <h3 className="text-sm font-medium">
                {title}
              </h3>
            )}
            
            {description && (
              <div className="mt-1 text-sm text-muted-foreground">
                {description}
              </div>
            )}
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              if (onClose) onClose();
            }}
            className="flex-shrink-0 ml-3 h-5 w-5 text-gray-400 hover:text-gray-500 focus:outline-none"
            aria-label="Close"
          >
            <X className="w-full h-full" />
          </button>
        </div>
      </div>
    );
  }
);

Toast.displayName = 'Toast'; 