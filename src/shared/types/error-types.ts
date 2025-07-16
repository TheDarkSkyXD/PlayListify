/**
 * TypeScript interfaces for error handling and recovery systems
 * 
 * This file defines all the types used for error handling, recovery mechanisms,
 * and user notifications throughout the application.
 */

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories for classification
export type ErrorCategory = 
  | 'system'
  | 'network'
  | 'database'
  | 'filesystem'
  | 'configuration'
  | 'validation'
  | 'security'
  | 'dependency'
  | 'ipc'
  | 'application';

// Recovery action types
export type RecoveryAction = 
  | 'retry'
  | 'fallback'
  | 'reset'
  | 'restart'
  | 'ignore'
  | 'manual';

// Error notification types
export type NotificationType = 
  | 'toast'
  | 'modal'
  | 'banner'
  | 'system'
  | 'silent';

// Base error information interface
export interface ErrorInfo {
  id: string;
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: string;
  details?: Record<string, any>;
  stack?: string;
  recoverable: boolean;
  userMessage?: string;
  suggestions?: string[];
}

// Error context for tracking where errors occur
export interface ErrorContext {
  operation: string;
  component: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  additionalData?: Record<string, any>;
}

// Recovery options for error handling
export interface RecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  fallbackAction?: () => Promise<void> | void;
  userNotification?: boolean;
  notificationType?: NotificationType;
  autoRecover?: boolean;
}

// Recovery strategy interface
export interface RecoveryStrategy {
  name: string;
  canRecover: (error: Error) => boolean;
  recover: (error: Error, context: ErrorContext) => Promise<boolean>;
  priority: number;
  timeout?: number;
}

// Error report for tracking and analytics
export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: ErrorInfo;
  context: ErrorContext;
  recoveryAttempts: number;
  recovered: boolean;
  userNotified: boolean;
  recoveryActions: RecoveryAction[];
  resolution?: string;
}

// User notification configuration
export interface ErrorNotification {
  type: NotificationType;
  title: string;
  message: string;
  severity: ErrorSeverity;
  actions?: NotificationAction[];
  autoClose?: boolean;
  duration?: number;
  persistent?: boolean;
}

// Notification action (buttons, links, etc.)
export interface NotificationAction {
  label: string;
  action: 'retry' | 'dismiss' | 'report' | 'settings' | 'restart' | 'custom';
  handler?: () => void | Promise<void>;
  primary?: boolean;
}

// Shutdown procedure configuration
export interface ShutdownProcedure {
  name: string;
  priority: number;
  timeout: number;
  procedure: () => Promise<void>;
  critical?: boolean;
}

// Error statistics for monitoring
export interface ErrorStatistics {
  totalErrors: number;
  recoveredErrors: number;
  recoveryRate: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  recentErrors: ErrorReport[];
  topErrors: Array<{
    code: string;
    count: number;
    lastOccurrence: Date;
  }>;
}

// Error handler configuration
export interface ErrorHandlerConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  userNotifications: boolean;
  reportingEnabled: boolean;
  maxReports: number;
  reportRetention: number; // in milliseconds
  shutdownTimeout: number;
  gracefulShutdown: boolean;
}

// Error boundary state for React components
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  canRecover: boolean;
  retryCount: number;
  maxRetries: number;
}

// Error boundary props
export interface ErrorBoundaryProps {
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRecover?: () => void;
  maxRetries?: number;
  autoRecover?: boolean;
  children: React.ReactNode;
}

// Error boundary fallback component props
export interface ErrorBoundaryFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  retry: () => void;
  canRetry: boolean;
  retryCount: number;
  maxRetries: number;
}

// IPC error response
export interface IPCErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    userMessage?: string;
    suggestions?: string[];
    recoverable: boolean;
    context?: string;
  };
  timestamp: string;
}

// IPC success response
export interface IPCSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

// Combined IPC response type
export type IPCResponse<T = any> = IPCSuccessResponse<T> | IPCErrorResponse;

// Error event types for event emitters
export interface ErrorEvent {
  error: Error;
  context: ErrorContext;
  report: ErrorReport;
}

export interface RecoveryEvent {
  error: Error;
  context: ErrorContext;
  recovered: boolean;
  report: ErrorReport;
  strategy?: string;
}

export interface ShutdownEvent {
  reason: string;
  graceful: boolean;
  procedures: string[];
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  jitter: boolean;
  retryCondition?: (error: Error) => boolean;
}

// Circuit breaker configuration for preventing cascading failures
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  enabled: boolean;
}

// Health check configuration
export interface HealthCheckConfig {
  interval: number;
  timeout: number;
  retries: number;
  enabled: boolean;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  critical: boolean;
  timeout?: number;
}

// Error aggregation for batch reporting
export interface ErrorAggregation {
  timeWindow: number; // in milliseconds
  maxErrors: number;
  groupBy: ('code' | 'category' | 'component')[];
  enabled: boolean;
}

// Error filtering configuration
export interface ErrorFilter {
  excludeCategories?: ErrorCategory[];
  excludeCodes?: string[];
  minSeverity?: ErrorSeverity;
  includePatterns?: string[];
  excludePatterns?: string[];
}

// Performance impact tracking
export interface PerformanceImpact {
  errorId: string;
  operationDuration: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency?: number;
  timestamp: Date;
}

// Error correlation for tracking related errors
export interface ErrorCorrelation {
  primaryErrorId: string;
  relatedErrorIds: string[];
  correlationType: 'cascade' | 'concurrent' | 'retry' | 'recovery';
  confidence: number;
}

// Default configurations
export const DEFAULT_ERROR_HANDLER_CONFIG: ErrorHandlerConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  userNotifications: true,
  reportingEnabled: true,
  maxReports: 1000,
  reportRetention: 24 * 60 * 60 * 1000, // 24 hours
  shutdownTimeout: 30000, // 30 seconds
  gracefulShutdown: true,
};

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponentialBackoff: true,
  jitter: true,
};

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 10000, // 10 seconds
  enabled: true,
};

// Error severity mapping
export const ERROR_SEVERITY_LEVELS: Record<ErrorSeverity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

// Error category descriptions
export const ERROR_CATEGORY_DESCRIPTIONS: Record<ErrorCategory, string> = {
  system: 'Operating system and hardware related errors',
  network: 'Network connectivity and communication errors',
  database: 'Database connection and query errors',
  filesystem: 'File system access and operation errors',
  configuration: 'Application configuration and settings errors',
  validation: 'Data validation and format errors',
  security: 'Security and permission related errors',
  dependency: 'External dependency and service errors',
  ipc: 'Inter-process communication errors',
  application: 'General application logic errors',
};