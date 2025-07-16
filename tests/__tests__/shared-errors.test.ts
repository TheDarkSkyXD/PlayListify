/**
 * Shared Errors Tests
 * Tests for the shared error classes and error handling utilities
 */

import {
  BaseError,
  SystemError,
  ConfigurationError,
  IPCError,
  ApplicationError,
  InvalidInputError,
  ParentTaskNotFoundError,
  InvalidStateTransitionError,
  TaskNotFoundError,
  CircularDependencyError,
  DatabaseError,
  DatabaseConnectionError,
  SchemaExecutionError,
  FileSystemReadOnlyError,
  DiskFullError,
  DependencyError,
  DependencyInstallationError,
  DependencyValidationError,
  DependencyDownloadError,
  NetworkError,
  TimeoutError,
  ValidationError,
  SecurityError,
  PermissionError,
} from '../../src/shared/errors';

describe('BaseError', () => {
  it('should create a basic error with required properties', () => {
    const error = new SystemError('Test message', 'TEST_CODE');

    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('SystemError');
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.recoverable).toBe(true); // SystemError default
    expect(error.context).toBe('System');
  });

  it('should accept optional properties', () => {
    const options = {
      context: 'CustomContext',
      details: { key: 'value' },
      recoverable: false,
      userMessage: 'User friendly message',
      suggestions: ['Try this', 'Try that'],
      cause: new Error('Original error'),
    };

    const error = new SystemError('Test message', 'TEST_CODE', options);

    expect(error.context).toBe('CustomContext');
    expect(error.details).toEqual({ key: 'value' });
    expect(error.recoverable).toBe(false);
    expect(error.userMessage).toBe('User friendly message');
    expect(error.suggestions).toEqual(['Try this', 'Try that']);
    expect(error.cause).toBeInstanceOf(Error);
  });

  it('should serialize to JSON properly', () => {
    const error = new SystemError('Test message', 'TEST_CODE', {
      context: 'TestContext',
      details: { key: 'value' },
      userMessage: 'User message',
      suggestions: ['Suggestion 1'],
    });

    const json = error.toJSON();

    expect(json).toEqual({
      name: 'SystemError',
      message: 'Test message',
      code: 'TEST_CODE',
      context: 'TestContext',
      details: { key: 'value' },
      timestamp: error.timestamp.toISOString(),
      recoverable: true,
      userMessage: 'User message',
      suggestions: ['Suggestion 1'],
      stack: error.stack,
    });
  });

  it('should maintain proper stack trace', () => {
    const error = new SystemError('Test message', 'TEST_CODE');
    
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('SystemError');
    expect(error.stack).toContain('Test message');
  });
});

describe('System Errors', () => {
  it('should create SystemError with correct defaults', () => {
    const error = new SystemError('System failure', 'SYS_FAIL');

    expect(error.name).toBe('SystemError');
    expect(error.context).toBe('System');
    expect(error.recoverable).toBe(true);
  });

  it('should create ConfigurationError with correct defaults', () => {
    const error = new ConfigurationError('Config invalid', 'CONFIG_INVALID');

    expect(error.name).toBe('ConfigurationError');
    expect(error.context).toBe('Configuration');
    expect(error.recoverable).toBe(true);
  });

  it('should create IPCError with correct defaults', () => {
    const error = new IPCError('IPC failed', 'IPC_FAILED');

    expect(error.name).toBe('IPCError');
    expect(error.context).toBe('IPC');
    expect(error.recoverable).toBe(true);
  });

  it('should create ApplicationError with correct defaults', () => {
    const error = new ApplicationError('App crashed', 'APP_CRASHED');

    expect(error.name).toBe('ApplicationError');
    expect(error.context).toBe('Application');
    expect(error.recoverable).toBe(false); // ApplicationError is not recoverable by default
  });
});

describe('Task Management Errors', () => {
  it('should create InvalidInputError with proper defaults', () => {
    const error = new InvalidInputError('Invalid input provided');

    expect(error.name).toBe('InvalidInputError');
    expect(error.code).toBe('INVALID_INPUT');
    expect(error.context).toBe('TaskManagement');
    expect(error.recoverable).toBe(true);
    expect(error.userMessage).toContain('Invalid input');
    expect(error.suggestions).toContain('Verify input format');
  });

  it('should create ParentTaskNotFoundError with proper defaults', () => {
    const error = new ParentTaskNotFoundError('Parent task missing');

    expect(error.name).toBe('ParentTaskNotFoundError');
    expect(error.code).toBe('PARENT_TASK_NOT_FOUND');
    expect(error.userMessage).toContain('Parent task not found');
    expect(error.suggestions).toContain('Refresh the task list');
  });

  it('should create InvalidStateTransitionError with proper defaults', () => {
    const error = new InvalidStateTransitionError('Invalid transition');

    expect(error.name).toBe('InvalidStateTransitionError');
    expect(error.code).toBe('INVALID_STATE_TRANSITION');
    expect(error.userMessage).toContain('Invalid task state transition');
    expect(error.suggestions).toContain('Check current task state');
  });

  it('should create TaskNotFoundError with proper defaults', () => {
    const error = new TaskNotFoundError('Task not found');

    expect(error.name).toBe('TaskNotFoundError');
    expect(error.code).toBe('TASK_NOT_FOUND');
    expect(error.userMessage).toContain('Task not found');
    expect(error.suggestions).toContain('Refresh the task list');
  });

  it('should create CircularDependencyError with proper defaults', () => {
    const error = new CircularDependencyError('Circular dependency detected');

    expect(error.name).toBe('CircularDependencyError');
    expect(error.code).toBe('CIRCULAR_DEPENDENCY');
    expect(error.userMessage).toContain('Circular dependency detected');
    expect(error.suggestions).toContain('Review task dependencies');
  });
});

describe('Database Errors', () => {
  it('should create DatabaseError with proper defaults', () => {
    const error = new DatabaseError('Database operation failed');

    expect(error.name).toBe('DatabaseError');
    expect(error.code).toBe('DATABASE_ERROR');
    expect(error.context).toBe('Database');
    expect(error.recoverable).toBe(true);
    expect(error.userMessage).toContain('Database operation failed');
    expect(error.suggestions).toContain('Retry the operation');
  });

  it('should create DatabaseConnectionError with proper defaults', () => {
    const error = new DatabaseConnectionError('Cannot connect to database');

    expect(error.name).toBe('DatabaseConnectionError');
    expect(error.code).toBe('DATABASE_CONNECTION_ERROR');
    expect(error.userMessage).toContain('Cannot connect to database');
    expect(error.suggestions).toContain('Check database file permissions');
  });

  it('should create SchemaExecutionError with proper defaults', () => {
    const error = new SchemaExecutionError('Schema execution failed');

    expect(error.name).toBe('SchemaExecutionError');
    expect(error.code).toBe('SCHEMA_EXECUTION_ERROR');
    expect(error.recoverable).toBe(false); // Schema errors are not recoverable
    expect(error.userMessage).toContain('Database schema error');
    expect(error.suggestions).toContain('Restart the application');
  });
});

describe('File System Errors', () => {
  it('should create FileSystemReadOnlyError with proper defaults', () => {
    const error = new FileSystemReadOnlyError('File system is read-only');

    expect(error.name).toBe('FileSystemReadOnlyError');
    expect(error.code).toBe('FILESYSTEM_READONLY');
    expect(error.context).toBe('FileSystem');
    expect(error.userMessage).toContain('Cannot write to file system');
    expect(error.suggestions).toContain('Check file permissions');
  });

  it('should create DiskFullError with proper defaults', () => {
    const error = new DiskFullError('Disk is full');

    expect(error.name).toBe('DiskFullError');
    expect(error.code).toBe('DISK_FULL');
    expect(error.userMessage).toContain('Not enough disk space');
    expect(error.suggestions).toContain('Free up disk space');
  });
});

describe('Dependency Errors', () => {
  it('should create DependencyError with proper defaults', () => {
    const error = new DependencyError('Dependency error occurred');

    expect(error.name).toBe('DependencyError');
    expect(error.code).toBe('DEPENDENCY_ERROR');
    expect(error.context).toBe('Dependencies');
    expect(error.userMessage).toContain('Dependency management error');
    expect(error.suggestions).toContain('Restart the application');
  });

  it('should create DependencyInstallationError with proper defaults', () => {
    const error = new DependencyInstallationError('Installation failed');

    expect(error.name).toBe('DependencyInstallationError');
    expect(error.code).toBe('DEPENDENCY_INSTALLATION_ERROR');
    expect(error.userMessage).toContain('Failed to install required dependencies');
    expect(error.suggestions).toContain('Check internet connection');
  });

  it('should create DependencyValidationError with proper defaults', () => {
    const error = new DependencyValidationError('Validation failed');

    expect(error.name).toBe('DependencyValidationError');
    expect(error.code).toBe('DEPENDENCY_VALIDATION_ERROR');
    expect(error.userMessage).toContain('Dependency validation failed');
    expect(error.suggestions).toContain('Reinstall dependencies');
  });

  it('should create DependencyDownloadError with proper defaults', () => {
    const error = new DependencyDownloadError('Download failed');

    expect(error.name).toBe('DependencyDownloadError');
    expect(error.code).toBe('DEPENDENCY_DOWNLOAD_ERROR');
    expect(error.userMessage).toContain('Failed to download required dependencies');
    expect(error.suggestions).toContain('Check internet connection');
  });
});

describe('Network Errors', () => {
  it('should create NetworkError with custom code', () => {
    const error = new NetworkError('Network timeout', 'NETWORK_TIMEOUT');

    expect(error.name).toBe('NetworkError');
    expect(error.code).toBe('NETWORK_TIMEOUT');
    expect(error.context).toBe('Network');
    expect(error.recoverable).toBe(true);
    expect(error.userMessage).toContain('Network connection error');
    expect(error.suggestions).toContain('Check internet connection');
  });

  it('should create TimeoutError with proper defaults', () => {
    const error = new TimeoutError('Operation timed out');

    expect(error.name).toBe('TimeoutError');
    expect(error.code).toBe('TIMEOUT_ERROR');
    expect(error.context).toBe('Network');
    expect(error.userMessage).toContain('Operation timed out');
    expect(error.suggestions).toContain('Try again');
  });
});

describe('Validation Errors', () => {
  it('should create ValidationError with field information', () => {
    const error = new ValidationError('Email is invalid', 'email');

    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.context).toBe('Validation');
    expect(error.details?.field).toBe('email');
    expect(error.userMessage).toContain('Validation failed for email');
    expect(error.suggestions).toContain('Check input format');
  });

  it('should create ValidationError without field information', () => {
    const error = new ValidationError('Validation failed');

    expect(error.userMessage).toContain('Validation failed.');
    expect(error.details?.field).toBeUndefined();
  });
});

describe('Security Errors', () => {
  it('should create SecurityError with proper defaults', () => {
    const error = new SecurityError('Security violation', 'SEC_VIOLATION');

    expect(error.name).toBe('SecurityError');
    expect(error.code).toBe('SEC_VIOLATION');
    expect(error.context).toBe('Security');
    expect(error.recoverable).toBe(false); // Security errors are not recoverable
    expect(error.userMessage).toContain('Security violation detected');
    expect(error.suggestions).toContain('Contact support');
  });

  it('should create PermissionError with resource information', () => {
    const error = new PermissionError('Access denied', '/path/to/file');

    expect(error.name).toBe('PermissionError');
    expect(error.code).toBe('PERMISSION_ERROR');
    expect(error.context).toBe('Permissions');
    expect(error.details?.resource).toBe('/path/to/file');
    expect(error.userMessage).toContain('Permission denied for /path/to/file');
    expect(error.suggestions).toContain('Run as administrator');
  });

  it('should create PermissionError without resource information', () => {
    const error = new PermissionError('Access denied');

    expect(error.userMessage).toContain('Permission denied.');
    expect(error.details?.resource).toBeUndefined();
  });
});

describe('Error Inheritance', () => {
  it('should properly inherit from Error', () => {
    const error = new SystemError('Test error', 'TEST_CODE');

    expect(error instanceof Error).toBe(true);
    expect(error instanceof BaseError).toBe(true);
    expect(error instanceof SystemError).toBe(true);
  });

  it('should work with instanceof checks', () => {
    const systemError = new SystemError('System error', 'SYS_ERROR');
    const networkError = new NetworkError('Network error', 'NET_ERROR');
    const validationError = new ValidationError('Validation error');

    expect(systemError instanceof BaseError).toBe(true);
    expect(networkError instanceof BaseError).toBe(true);
    expect(validationError instanceof BaseError).toBe(true);

    expect(systemError instanceof SystemError).toBe(true);
    expect(systemError instanceof NetworkError).toBe(false);

    expect(networkError instanceof NetworkError).toBe(true);
    expect(networkError instanceof SystemError).toBe(false);
  });

  it('should work with try-catch blocks', () => {
    expect(() => {
      throw new SystemError('Test error', 'TEST_CODE');
    }).toThrow(SystemError);

    expect(() => {
      throw new SystemError('Test error', 'TEST_CODE');
    }).toThrow(BaseError);

    expect(() => {
      throw new SystemError('Test error', 'TEST_CODE');
    }).toThrow(Error);
  });
});

describe('Error Context and Details', () => {
  it('should handle complex details objects', () => {
    const details = {
      userId: '123',
      operation: 'test',
      nested: {
        key: 'value',
        array: [1, 2, 3],
      },
      timestamp: new Date(),
    };

    const error = new SystemError('Test error', 'TEST_CODE', { details });

    expect(error.details).toEqual(details);
    expect(error.toJSON().details).toEqual(details);
  });

  it('should handle error chaining with cause', () => {
    const originalError = new Error('Original error');
    const wrappedError = new SystemError('Wrapped error', 'WRAPPED', {
      cause: originalError,
    });

    expect(wrappedError.cause).toBe(originalError);
    expect(wrappedError.toJSON()).toHaveProperty('cause');
  });

  it('should preserve error context through serialization', () => {
    const error = new DatabaseError('DB error', {
      context: 'UserService',
      details: { query: 'SELECT * FROM users', params: { id: 123 } },
    });

    const json = error.toJSON();
    const restored = Object.assign(new DatabaseError(''), json);

    expect(restored.context).toBe('UserService');
    expect(restored.details).toEqual({ query: 'SELECT * FROM users', params: { id: 123 } });
  });
});