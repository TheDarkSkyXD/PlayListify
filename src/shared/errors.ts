// src/shared/errors.ts

/**
 * Base error options interface
 */
export interface BaseErrorOptions {
  context?: string;
  details?: Record<string, any>;
  recoverable?: boolean;
  userMessage?: string;
  suggestions?: string[];
  cause?: Error;
}

/**
 * Base error class with enhanced error information
 */
export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly context?: string;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;
  public readonly userMessage?: string;
  public readonly suggestions?: string[];
  public readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    options: BaseErrorOptions = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = options.context;
    this.details = options.details;
    this.timestamp = new Date();
    this.recoverable = options.recoverable ?? false;
    this.userMessage = options.userMessage;
    this.suggestions = options.suggestions;
    this.cause = options.cause;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging and reporting
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      recoverable: this.recoverable,
      userMessage: this.userMessage,
      suggestions: this.suggestions,
      stack: this.stack,
    };
  }
}

/**
 * System-level errors (OS, hardware, permissions)
 */
export class SystemError extends BaseError {
  constructor(message: string, code: string, options: BaseErrorOptions = {}) {
    super(message, code, {
      ...options,
      context: options.context || 'System',
      recoverable: options.recoverable ?? true,
    });
  }
}

/**
 * Configuration and settings errors
 */
export class ConfigurationError extends BaseError {
  constructor(message: string, code: string, options: BaseErrorOptions = {}) {
    super(message, code, {
      ...options,
      context: options.context || 'Configuration',
      recoverable: options.recoverable ?? true,
    });
  }
}

/**
 * IPC communication errors
 */
export class IPCError extends BaseError {
  constructor(message: string, code: string, options: BaseErrorOptions = {}) {
    super(message, code, {
      ...options,
      context: options.context || 'IPC',
      recoverable: options.recoverable ?? true,
    });
  }
}

/**
 * Application lifecycle errors
 */
export class ApplicationError extends BaseError {
  constructor(message: string, code: string, options: BaseErrorOptions = {}) {
    super(message, code, {
      ...options,
      context: options.context || 'Application',
      recoverable: options.recoverable ?? false,
    });
  }
}

// Task Management Errors
export class InvalidInputError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'INVALID_INPUT', {
      ...options,
      context: options.context || 'TaskManagement',
      recoverable: true,
      userMessage: 'Invalid input provided. Please check your data and try again.',
      suggestions: ['Verify input format', 'Check required fields', 'Consult documentation'],
    });
  }
}

export class ParentTaskNotFoundError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'PARENT_TASK_NOT_FOUND', {
      ...options,
      context: options.context || 'TaskManagement',
      recoverable: true,
      userMessage: 'Parent task not found. The task may have been deleted or moved.',
      suggestions: ['Refresh the task list', 'Check if the parent task exists', 'Create the parent task first'],
    });
  }
}

export class InvalidStateTransitionError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'INVALID_STATE_TRANSITION', {
      ...options,
      context: options.context || 'TaskManagement',
      recoverable: true,
      userMessage: 'Invalid task state transition. The requested operation is not allowed.',
      suggestions: ['Check current task state', 'Review allowed transitions', 'Try a different operation'],
    });
  }
}

export class TaskNotFoundError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'TASK_NOT_FOUND', {
      ...options,
      context: options.context || 'TaskManagement',
      recoverable: true,
      userMessage: 'Task not found. The task may have been deleted or moved.',
      suggestions: ['Refresh the task list', 'Check if the task ID is correct', 'Search for the task by name'],
    });
  }
}

export class CircularDependencyError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'CIRCULAR_DEPENDENCY', {
      ...options,
      context: options.context || 'TaskManagement',
      recoverable: true,
      userMessage: 'Circular dependency detected. Tasks cannot depend on themselves.',
      suggestions: ['Review task dependencies', 'Remove circular references', 'Restructure task hierarchy'],
    });
  }
}

// Database Errors
export class DatabaseError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'DATABASE_ERROR', {
      ...options,
      context: options.context || 'Database',
      recoverable: true,
      userMessage: 'Database operation failed. Please try again.',
      suggestions: ['Retry the operation', 'Check database connection', 'Restart the application'],
    });
  }
}

export class DatabaseConnectionError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'DATABASE_CONNECTION_ERROR', {
      ...options,
      context: options.context || 'Database',
      recoverable: true,
      userMessage: 'Cannot connect to database. Please check your setup.',
      suggestions: ['Check database file permissions', 'Verify database path', 'Restart the application'],
    });
  }
}

export class SchemaExecutionError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'SCHEMA_EXECUTION_ERROR', {
      ...options,
      context: options.context || 'Database',
      recoverable: false,
      userMessage: 'Database schema error. The application may need to be reinstalled.',
      suggestions: ['Restart the application', 'Clear application data', 'Reinstall the application'],
    });
  }
}

// File System Errors
export class FileSystemReadOnlyError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'FILESYSTEM_READONLY', {
      ...options,
      context: options.context || 'FileSystem',
      recoverable: true,
      userMessage: 'Cannot write to file system. Check permissions or disk space.',
      suggestions: ['Check file permissions', 'Verify disk space', 'Run as administrator', 'Choose different location'],
    });
  }
}

export class DiskFullError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'DISK_FULL', {
      ...options,
      context: options.context || 'FileSystem',
      recoverable: true,
      userMessage: 'Not enough disk space. Please free up space and try again.',
      suggestions: ['Free up disk space', 'Choose different download location', 'Delete unnecessary files'],
    });
  }
}

// Dependency Management Errors
export class DependencyError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'DEPENDENCY_ERROR', {
      ...options,
      context: options.context || 'Dependencies',
      recoverable: true,
      userMessage: 'Dependency management error. Some features may not work properly.',
      suggestions: ['Restart the application', 'Check internet connection', 'Try manual installation'],
    });
  }
}

export class DependencyInstallationError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'DEPENDENCY_INSTALLATION_ERROR', {
      ...options,
      context: options.context || 'Dependencies',
      recoverable: true,
      userMessage: 'Failed to install required dependencies. Some features may not work.',
      suggestions: ['Check internet connection', 'Retry installation', 'Check firewall settings', 'Try manual installation'],
    });
  }
}

export class DependencyValidationError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'DEPENDENCY_VALIDATION_ERROR', {
      ...options,
      context: options.context || 'Dependencies',
      recoverable: true,
      userMessage: 'Dependency validation failed. The installed version may be corrupted.',
      suggestions: ['Reinstall dependencies', 'Check file integrity', 'Clear dependency cache'],
    });
  }
}

export class DependencyDownloadError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'DEPENDENCY_DOWNLOAD_ERROR', {
      ...options,
      context: options.context || 'Dependencies',
      recoverable: true,
      userMessage: 'Failed to download required dependencies. Check your internet connection.',
      suggestions: ['Check internet connection', 'Retry download', 'Check firewall settings', 'Use different network'],
    });
  }
}

// Network and Connectivity Errors
export class NetworkError extends BaseError {
  constructor(message: string, code: string, options: BaseErrorOptions = {}) {
    super(message, code, {
      ...options,
      context: options.context || 'Network',
      recoverable: true,
      userMessage: 'Network connection error. Please check your internet connection.',
      suggestions: ['Check internet connection', 'Try again later', 'Check firewall settings'],
    });
  }
}

export class TimeoutError extends BaseError {
  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message, 'TIMEOUT_ERROR', {
      ...options,
      context: options.context || 'Network',
      recoverable: true,
      userMessage: 'Operation timed out. Please try again.',
      suggestions: ['Try again', 'Check internet connection', 'Increase timeout settings'],
    });
  }
}

// Validation Errors
export class ValidationError extends BaseError {
  constructor(message: string, field?: string, options: BaseErrorOptions = {}) {
    super(message, 'VALIDATION_ERROR', {
      ...options,
      context: options.context || 'Validation',
      recoverable: true,
      details: { ...options.details, field },
      userMessage: `Validation failed${field ? ` for ${field}` : ''}. Please check your input.`,
      suggestions: ['Check input format', 'Verify required fields', 'Review validation rules'],
    });
  }
}

// Security Errors
export class SecurityError extends BaseError {
  constructor(message: string, code: string, options: BaseErrorOptions = {}) {
    super(message, code, {
      ...options,
      context: options.context || 'Security',
      recoverable: false,
      userMessage: 'Security violation detected. Operation blocked for safety.',
      suggestions: ['Contact support', 'Check application integrity', 'Restart application'],
    });
  }
}

// Permission Errors
export class PermissionError extends BaseError {
  constructor(message: string, resource?: string, options: BaseErrorOptions = {}) {
    super(message, 'PERMISSION_ERROR', {
      ...options,
      context: options.context || 'Permissions',
      recoverable: true,
      details: { ...options.details, resource },
      userMessage: `Permission denied${resource ? ` for ${resource}` : ''}. Check file permissions.`,
      suggestions: ['Run as administrator', 'Check file permissions', 'Change file location'],
    });
  }
}
