/**
 * Error Notification Component
 * Displays user-friendly error notifications with recovery options
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, RefreshCw, Bug, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ErrorNotification as ErrorNotificationType } from '@/shared/types/error-types';

interface ErrorNotificationProps {
  notification: ErrorNotificationType;
  onDismiss?: () => void;
  onAction?: (action: string) => void;
}

interface ErrorNotificationManagerProps {
  className?: string;
}

/**
 * Individual error notification component
 */
export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Auto-close timer
  useEffect(() => {
    if (notification.autoClose && notification.duration) {
      setTimeLeft(notification.duration / 1000);
      
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            if (onDismiss) onDismiss();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [notification.autoClose, notification.duration, onDismiss]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-l-4 border-l-destructive">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getSeverityIcon(notification.severity)}
            <CardTitle className="text-sm font-medium">
              {notification.title}
            </CardTitle>
            <Badge variant={getSeverityColor(notification.severity)} className="text-xs">
              {notification.severity}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {timeLeft && (
              <span className="text-xs text-muted-foreground">
                {timeLeft}s
              </span>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="text-sm mb-3">
          {notification.message}
        </CardDescription>

        {/* Action buttons */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {notification.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.primary ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (action.handler) {
                    action.handler();
                  } else {
                    handleAction(action.action);
                  }
                }}
                className="text-xs"
              >
                {action.action === 'retry' && <RefreshCw className="h-3 w-3 mr-1" />}
                {action.action === 'report' && <Bug className="h-3 w-3 mr-1" />}
                {action.action === 'settings' && <Settings className="h-3 w-3 mr-1" />}
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Expandable details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <div><strong>Type:</strong> {notification.type}</div>
              <div><strong>Severity:</strong> {notification.severity}</div>
              {notification.persistent && (
                <div><strong>Persistent:</strong> Yes</div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

/**
 * Error notification manager component
 */
export const ErrorNotificationManager: React.FC<ErrorNotificationManagerProps> = ({
  className = '',
}) => {
  const [notifications, setNotifications] = useState<Array<ErrorNotificationType & { id: string }>>([]);

  useEffect(() => {
    // Listen for error notifications from main process
    const cleanup = window.electronAPI?.error?.onNotification?.((event, notification) => {
      const notificationWithId = {
        ...notification,
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      setNotifications(prev => [...prev, notificationWithId]);
    });

    return cleanup;
  }, []);

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAction = async (id: string, action: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;

    try {
      switch (action) {
        case 'retry':
          // Retry the operation that caused the error
          // This would need to be implemented based on the specific error context
          break;
        
        case 'report':
          // Report the error
          await window.electronAPI?.error?.report?.(
            {
              message: notification.message,
              name: 'UserReportedError',
            },
            {
              operation: 'user-report',
              component: 'ErrorNotificationManager',
              additionalData: { notificationId: id },
            }
          );
          break;
        
        case 'settings':
          // Navigate to settings
          window.location.hash = '#/settings';
          break;
        
        case 'restart':
          // Request application restart
          await window.electronAPI?.error?.gracefulShutdown?.('User requested restart');
          break;
        
        case 'dismiss':
          handleDismiss(id);
          break;
        
        default:
          console.warn(`Unknown error notification action: ${action}`);
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {notifications.map(notification => (
        <ErrorNotification
          key={notification.id}
          notification={notification}
          onDismiss={() => handleDismiss(notification.id)}
          onAction={(action) => handleAction(notification.id, action)}
        />
      ))}
    </div>
  );
};

/**
 * Hook for manually triggering error notifications
 */
export const useErrorNotification = () => {
  const showError = React.useCallback(async (
    title: string,
    message: string,
    options: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      actions?: Array<{
        label: string;
        action: string;
        primary?: boolean;
      }>;
      persistent?: boolean;
      autoClose?: boolean;
      duration?: number;
    } = {}
  ) => {
    try {
      // Create a mock error to report
      const error = new Error(message);
      error.name = title;
      
      await window.electronAPI?.error?.report?.(
        {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
        {
          operation: 'manual-notification',
          component: 'useErrorNotification',
          additionalData: options,
        }
      );
    } catch (reportError) {
      console.error('Failed to show error notification:', reportError);
    }
  }, []);

  return { showError };
};

export default ErrorNotificationManager;