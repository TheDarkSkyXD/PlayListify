/**
 * Error Boundary Component
 * Catches JavaScript errors in React component tree and provides recovery options
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { 
  ErrorBoundaryState, 
  ErrorBoundaryProps, 
  ErrorBoundaryFallbackProps,
  ErrorInfo as CustomErrorInfo 
} from '@/shared/types/error-types';

interface State extends ErrorBoundaryState {
  errorDetails?: string;
  lastErrorTime?: Date;
}

/**
 * Default fallback component for error boundary
 */
const DefaultErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  errorInfo,
  retry,
  canRetry,
  retryCount,
  maxRetries,
}) => {
  const handleReportError = async () => {
    try {
      // Report error to main process
      await window.electronAPI?.error?.report?.(
        {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        {
          operation: 'render',
          component: 'ErrorBoundary',
          additionalData: {
            retryCount,
            maxRetries,
            errorInfo: errorInfo ? JSON.stringify(errorInfo) : undefined,
          },
        }
      );
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  const handleGoHome = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred while rendering this page.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* User-friendly error message */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {errorInfo?.userMessage || 'The application encountered an unexpected error and needs to recover.'}
            </AlertDescription>
          </Alert>

          {/* Suggestions */}
          {errorInfo?.suggestions && errorInfo.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Suggestions:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {errorInfo.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-xs mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error details (collapsible) */}
          <details className="text-sm">
            <summary className="cursor-pointer font-medium mb-2">
              Technical Details
            </summary>
            <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-auto max-h-32">
              <div><strong>Error:</strong> {error.name}</div>
              <div><strong>Message:</strong> {error.message}</div>
              {error.stack && (
                <div className="mt-2">
                  <strong>Stack Trace:</strong>
                  <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>

          {/* Retry information */}
          {canRetry && retryCount > 0 && (
            <div className="text-sm text-muted-foreground">
              Retry attempts: {retryCount} / {maxRetries}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {canRetry && (
              <Button onClick={retry} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
            
            <Button variant="outline" onClick={handleGoHome} className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Go to Home
            </Button>
            
            <Button variant="outline" onClick={handleReportError} className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Report Error
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Error Boundary Class Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      canRecover: true,
      retryCount: 0,
      maxRetries: props.maxRetries || 3,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      lastErrorTime: new Date(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const customErrorInfo: CustomErrorInfo = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: 'RENDER_ERROR',
      message: error.message,
      category: 'application',
      severity: 'high',
      timestamp: new Date(),
      context: 'React Error Boundary',
      details: {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      },
      stack: error.stack,
      recoverable: true,
      userMessage: 'A rendering error occurred. The page will attempt to recover.',
      suggestions: [
        'Try refreshing the page',
        'Clear browser cache',
        'Check for application updates',
        'Report the error if it persists',
      ],
    };

    this.setState({
      errorInfo: customErrorInfo,
      errorDetails: errorInfo.componentStack,
    });

    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, customErrorInfo);
    }

    // Report error to main process
    this.reportError(error, customErrorInfo);

    // Auto-recover if enabled
    if (this.props.autoRecover && this.state.retryCount < this.state.maxRetries) {
      this.scheduleAutoRetry();
    }
  }

  private async reportError(error: Error, errorInfo: CustomErrorInfo) {
    try {
      await window.electronAPI?.error?.report?.(
        {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        {
          operation: 'render',
          component: 'ErrorBoundary',
          additionalData: {
            errorInfo: JSON.stringify(errorInfo),
            retryCount: this.state.retryCount,
            maxRetries: this.state.maxRetries,
          },
        }
      );
    } catch (reportError) {
      console.error('Failed to report error to main process:', reportError);
    }
  }

  private scheduleAutoRetry() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Exponential backoff: 1s, 2s, 4s, etc.
    const delay = Math.pow(2, this.state.retryCount) * 1000;
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  }

  private handleRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    const newRetryCount = this.state.retryCount + 1;
    const canStillRetry = newRetryCount < this.state.maxRetries;

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorDetails: undefined,
      retryCount: newRetryCount,
      canRecover: canStillRetry,
      lastErrorTime: undefined,
    });

    // Call onRecover prop if provided
    if (this.props.onRecover) {
      this.props.onRecover();
    }
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retry={this.handleRetry}
          canRetry={this.state.canRecover}
          retryCount={this.state.retryCount}
          maxRetries={this.state.maxRetries}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling errors in functional components
 */
export const useErrorHandler = () => {
  const handleError = React.useCallback(async (error: Error, context?: string) => {
    try {
      await window.electronAPI?.error?.report?.(
        {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        {
          operation: context || 'unknown',
          component: 'useErrorHandler',
        }
      );
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }, []);

  return { handleError };
};

/**
 * Higher-order component for wrapping components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;