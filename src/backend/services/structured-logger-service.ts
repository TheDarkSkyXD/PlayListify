// src/backend/services/structured-logger-service.ts

import fs from 'fs';
import path from 'path';
import { BaseError } from '../../shared/errors';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    code?: string;
    message: string;
    stack?: string;
    recoverable?: boolean;
    userMessage?: string;
    suggestions?: string[];
  };
  performance?: {
    duration: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  logLevel: LogLevel;
  logToFile: boolean;
  logToConsole: boolean;
  logFilePath?: string;
  maxFileSize: number; // in bytes
  maxFiles: number;
  enablePerformanceLogging: boolean;
  enableStructuredLogging: boolean;
}

export class StructuredLoggerService {
  private config: LoggerConfig;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      logLevel: 'info',
      logToFile: true,
      logToConsole: true,
      logFilePath: path.join(process.cwd(), 'logs', 'application.log'),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      enablePerformanceLogging: true,
      enableStructuredLogging: true,
      ...config,
    };

    this.ensureLogDirectory();
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, { context });
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, { context });
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, { context });
  }

  /**
   * Log error message
   */
  error(
    message: string,
    error?: Error | BaseError,
    context?: Record<string, any>,
  ): void {
    const errorInfo = error ? this.formatError(error) : undefined;
    this.log('error', message, { context, error: errorInfo });
  }

  /**
   * Log fatal error message
   */
  fatal(
    message: string,
    error?: Error | BaseError,
    context?: Record<string, any>,
  ): void {
    const errorInfo = error ? this.formatError(error) : undefined;
    this.log('fatal', message, { context, error: errorInfo });
  }

  /**
   * Log operation start
   */
  startOperation(operation: string, context?: Record<string, any>): () => void {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    this.log('info', `Operation started: ${operation}`, {
      operation,
      context,
      metadata: { type: 'operation_start' },
    });

    // Return function to log operation completion
    return () => {
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();

      this.log('info', `Operation completed: ${operation}`, {
        operation,
        context,
        performance: {
          duration,
          memoryUsage: endMemory,
        },
        metadata: {
          type: 'operation_end',
          memoryDelta: {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          },
        },
      });
    };
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(
    operation: string,
    query: string,
    params: any[],
    duration: number,
    rowsAffected?: number,
  ): void {
    this.log('debug', `Database operation: ${operation}`, {
      operation: 'database',
      context: {
        query: this.sanitizeQuery(query),
        paramCount: params.length,
        rowsAffected,
      },
      performance: {
        duration,
        memoryUsage: process.memoryUsage(),
      },
      metadata: { type: 'database_operation' },
    });
  }

  /**
   * Log user action
   */
  logUserAction(
    action: string,
    userId: string,
    sessionId: string,
    details?: Record<string, any>,
  ): void {
    this.log('info', `User action: ${action}`, {
      operation: 'user_action',
      userId,
      sessionId,
      context: details,
      metadata: { type: 'user_action' },
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
  ): void {
    const level: LogLevel =
      severity === 'critical'
        ? 'fatal'
        : severity === 'high'
          ? 'error'
          : severity === 'medium'
            ? 'warn'
            : 'info';

    this.log(level, `Security event: ${event}`, {
      operation: 'security',
      context: details,
      metadata: {
        type: 'security_event',
        severity,
      },
    });
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics(
    operation: string,
    metrics: {
      duration: number;
      memoryUsage: NodeJS.MemoryUsage;
      cpuUsage?: NodeJS.CpuUsage;
      customMetrics?: Record<string, number>;
    },
  ): void {
    if (!this.config.enablePerformanceLogging) return;

    this.log('info', `Performance metrics: ${operation}`, {
      operation: 'performance',
      performance: {
        duration: metrics.duration,
        memoryUsage: metrics.memoryUsage,
      },
      context: {
        cpuUsage: metrics.cpuUsage,
        customMetrics: metrics.customMetrics,
      },
      metadata: { type: 'performance_metrics' },
    });
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    data: {
      operation?: string;
      userId?: string;
      sessionId?: string;
      context?: Record<string, any>;
      error?: any;
      performance?: any;
      metadata?: Record<string, any>;
    } = {},
  ): void {
    // Check if we should log this level
    if (this.logLevels[level] < this.logLevels[this.config.logLevel]) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      operation: data.operation,
      userId: data.userId,
      sessionId: data.sessionId,
      context: data.context,
      error: data.error,
      performance: data.performance,
      metadata: data.metadata,
    };

    // Log to console
    if (this.config.logToConsole) {
      this.logToConsole(logEntry);
    }

    // Log to file
    if (this.config.logToFile) {
      this.logToFile(logEntry);
    }
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase().padEnd(5);
    const message = entry.message;

    let logLine = `[${timestamp}] ${level} ${message}`;

    if (entry.operation) {
      logLine += ` (${entry.operation})`;
    }

    // Add context if available and not too verbose
    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = JSON.stringify(entry.context);
      if (contextStr.length < 200) {
        logLine += ` ${contextStr}`;
      }
    }

    // Use appropriate console method
    switch (entry.level) {
      case 'debug':
        console.debug(logLine);
        break;
      case 'info':
        console.info(logLine);
        break;
      case 'warn':
        console.warn(logLine);
        break;
      case 'error':
      case 'fatal':
        console.error(logLine);
        if (entry.error?.stack) {
          console.error(entry.error.stack);
        }
        break;
    }

    // Log structured data for errors and complex entries
    if (
      this.config.enableStructuredLogging &&
      (entry.level === 'error' || entry.level === 'fatal' || entry.performance)
    ) {
      console.log('Structured data:', JSON.stringify(entry, null, 2));
    }
  }

  /**
   * Log to file
   */
  private logToFile(entry: LogEntry): void {
    if (!this.config.logFilePath) return;

    try {
      // Check file size and rotate if necessary
      this.rotateLogFileIfNeeded();

      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.config.logFilePath, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Rotate log file if it exceeds max size
   */
  private rotateLogFileIfNeeded(): void {
    if (!this.config.logFilePath) return;

    try {
      if (fs.existsSync(this.config.logFilePath)) {
        const stats = fs.statSync(this.config.logFilePath);
        if (stats.size >= this.config.maxFileSize) {
          this.rotateLogFiles();
        }
      }
    } catch (error) {
      console.error('Failed to check log file size:', error);
    }
  }

  /**
   * Rotate log files
   */
  private rotateLogFiles(): void {
    if (!this.config.logFilePath) return;

    try {
      const logDir = path.dirname(this.config.logFilePath);
      const logName = path.basename(this.config.logFilePath, '.log');

      // Move existing numbered files
      for (let i = this.config.maxFiles - 1; i >= 1; i--) {
        const oldFile = path.join(logDir, `${logName}.${i}.log`);
        const newFile = path.join(logDir, `${logName}.${i + 1}.log`);

        if (fs.existsSync(oldFile)) {
          if (i === this.config.maxFiles - 1) {
            fs.unlinkSync(oldFile); // Delete oldest file
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      // Move current file to .1
      const firstRotatedFile = path.join(logDir, `${logName}.1.log`);
      if (fs.existsSync(this.config.logFilePath)) {
        fs.renameSync(this.config.logFilePath, firstRotatedFile);
      }
    } catch (error) {
      console.error('Failed to rotate log files:', error);
    }
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!this.config.logFilePath) return;

    try {
      const logDir = path.dirname(this.config.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
      this.config.logToFile = false; // Disable file logging if directory creation fails
    }
  }

  /**
   * Format error for logging
   */
  private formatError(error: Error | BaseError): any {
    const baseErrorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    if (error instanceof BaseError) {
      return {
        ...baseErrorInfo,
        code: error.code,
        recoverable: error.recoverable,
        userMessage: error.userMessage,
        suggestions: error.suggestions,
        context: error.context,
        details: error.details,
      };
    }

    return baseErrorInfo;
  }

  /**
   * Sanitize SQL query for logging (remove sensitive data)
   */
  private sanitizeQuery(query: string): string {
    // Remove potential sensitive data patterns
    return query
      .replace(/('.*?')/g, "'***'") // Replace string literals
      .replace(/(\d{4,})/g, '***') // Replace long numbers (potential IDs)
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Get log statistics
   */
  getLogStats(): {
    totalEntries: number;
    entriesByLevel: Record<LogLevel, number>;
    fileSize: number;
    oldestEntry?: string;
    newestEntry?: string;
  } {
    const stats = {
      totalEntries: 0,
      entriesByLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0,
      } as Record<LogLevel, number>,
      fileSize: 0,
      oldestEntry: undefined as string | undefined,
      newestEntry: undefined as string | undefined,
    };

    if (!this.config.logFilePath || !fs.existsSync(this.config.logFilePath)) {
      return stats;
    }

    try {
      const fileStats = fs.statSync(this.config.logFilePath);
      stats.fileSize = fileStats.size;

      const content = fs.readFileSync(this.config.logFilePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      stats.totalEntries = lines.length;

      if (lines.length > 0) {
        // Parse first and last entries for timestamps
        try {
          const firstEntry = JSON.parse(lines[0]);
          const lastEntry = JSON.parse(lines[lines.length - 1]);
          stats.oldestEntry = firstEntry.timestamp;
          stats.newestEntry = lastEntry.timestamp;
        } catch (parseError) {
          // Ignore parse errors for timestamp extraction
        }

        // Count entries by level
        lines.forEach(line => {
          try {
            const entry = JSON.parse(line);
            if (
              entry.level &&
              stats.entriesByLevel.hasOwnProperty(entry.level)
            ) {
              stats.entriesByLevel[entry.level as LogLevel]++;
            }
          } catch (parseError) {
            // Ignore parse errors for individual entries
          }
        });
      }
    } catch (error) {
      console.error('Failed to get log stats:', error);
    }

    return stats;
  }
}
