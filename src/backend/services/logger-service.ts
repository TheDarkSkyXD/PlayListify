import { app } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

export interface LoggerConfig {
  level: LogLevel;
  file: {
    enabled: boolean;
    path: string;
    maxSize: number;
    maxFiles: number;
  };
  console: {
    enabled: boolean;
    colorize: boolean;
  };
  development: {
    enhanced: boolean;
    stackTrace: boolean;
  };
}

class LoggerService {
  private config: LoggerConfig;
  private logDirectory: string = '';
  private currentLogFile: string = '';
  private fileLoggingEnabled: boolean = true;
  private sessionId: string;

  constructor(config?: Partial<LoggerConfig>) {
    this.sessionId = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Default configuration
    this.config = {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      file: {
        enabled: true,
        path: '',
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      },
      console: {
        enabled: true,
        colorize: process.env.NODE_ENV === 'development'
      },
      development: {
        enhanced: process.env.NODE_ENV === 'development',
        stackTrace: process.env.NODE_ENV === 'development'
      },
      ...config
    };

    this.initializeLogDirectory();
  }

  private async initializeLogDirectory(): Promise<void> {
    try {
      // Create Console Logs directory in app data
      const userDataPath = app.getPath('userData');
      this.logDirectory = path.join(userDataPath, 'Console Logs');
      
      // Ensure directory exists
      await fs.ensureDir(this.logDirectory);
      
      // Clean up old log files from previous sessions
      await this.cleanupOldLogs();
      
      // Set current log file path
      this.currentLogFile = path.join(
        this.logDirectory, 
        `app-${this.sessionId}.log`
      );
      
      this.config.file.path = this.currentLogFile;
      
      // Log initialization success
      this.info('Logger initialized successfully', 'LoggerService', {
        logDirectory: this.logDirectory,
        logFile: this.currentLogFile,
        sessionId: this.sessionId
      });
      
    } catch (error) {
      // Fallback to console-only logging
      this.fileLoggingEnabled = false;
      this.config.file.enabled = false;
      
      console.warn('Failed to initialize file logging, falling back to console-only:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.warn('File logging disabled due to initialization error', 'LoggerService', { error: errorMessage });
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.logDirectory);
      const logFiles = files
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDirectory, file),
          stat: fs.statSync(path.join(this.logDirectory, file))
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

      // Keep only the most recent files (based on maxFiles config)
      const filesToDelete = logFiles.slice(this.config.file.maxFiles - 1);
      
      for (const file of filesToDelete) {
        await fs.remove(file.path);
      }
      
      if (filesToDelete.length > 0) {
        console.log(`Cleaned up ${filesToDelete.length} old log files`);
      }
    } catch (error) {
      console.warn('Failed to cleanup old log files:', error);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLogEntry(entry: LogEntry): string {
    let formatted = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    
    if (entry.context) {
      formatted += ` [${entry.context}]`;
    }
    
    formatted += ` ${entry.message}`;
    
    if (entry.data && Object.keys(entry.data).length > 0) {
      formatted += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
    }
    
    return formatted;
  }

  private getConsoleColor(level: LogLevel): string {
    if (!this.config.console.colorize) return '';
    
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[90m'  // Gray
    };
    
    return colors[level] || '';
  }

  private resetConsoleColor(): string {
    return this.config.console.colorize ? '\x1b[0m' : '';
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.config.file.enabled || !this.fileLoggingEnabled) {
      return;
    }

    try {
      const logLine = this.formatLogEntry(entry) + '\n';
      await fs.appendFile(this.currentLogFile, logLine, 'utf8');
      
      // Check file size and rotate if necessary
      await this.checkAndRotateLog();
    } catch (error) {
      // Disable file logging on persistent errors
      this.fileLoggingEnabled = false;
      console.error('File logging disabled due to write error:', error);
    }
  }

  private async checkAndRotateLog(): Promise<void> {
    try {
      const stats = await fs.stat(this.currentLogFile);
      
      if (stats.size > this.config.file.maxSize) {
        // Create new log file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.currentLogFile = path.join(
          this.logDirectory,
          `app-${this.sessionId}-${timestamp}.log`
        );
        
        this.info('Log file rotated', 'LoggerService', {
          newFile: this.currentLogFile,
          previousSize: stats.size
        });
      }
    } catch (error) {
      console.warn('Failed to check log file size:', error);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.config.console.enabled) {
      return;
    }

    const color = this.getConsoleColor(entry.level);
    const reset = this.resetConsoleColor();
    const formatted = this.formatLogEntry(entry);
    
    const consoleMethod = entry.level === 'error' ? console.error :
                         entry.level === 'warn' ? console.warn :
                         entry.level === 'debug' ? console.debug :
                         console.log;
    
    consoleMethod(`${color}${formatted}${reset}`);
    
    // Enhanced debugging in development mode
    if (this.config.development.enhanced && entry.level === 'error' && this.config.development.stackTrace) {
      const stack = new Error().stack;
      if (stack) {
        console.error(`${color}Stack trace:\n${stack}${reset}`);
      }
    }
  }

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context,
      data
    };

    // Write to console
    this.writeToConsole(entry);
    
    // Write to file (async, don't wait)
    this.writeToFile(entry).catch(error => {
      console.error('Failed to write log to file:', error);
    });
  }

  public error(message: string, context?: string, data?: any): void {
    this.log('error', message, context, data);
  }

  public warn(message: string, context?: string, data?: any): void {
    this.log('warn', message, context, data);
  }

  public info(message: string, context?: string, data?: any): void {
    this.log('info', message, context, data);
  }

  public debug(message: string, context?: string, data?: any): void {
    this.log('debug', message, context, data);
  }

  public setLevel(level: LogLevel): void {
    this.config.level = level;
    this.info(`Log level changed to ${level}`, 'LoggerService');
  }

  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  public getLogDirectory(): string {
    return this.logDirectory;
  }

  public getCurrentLogFile(): string {
    return this.currentLogFile;
  }

  public isFileLoggingEnabled(): boolean {
    return this.fileLoggingEnabled && this.config.file.enabled;
  }

  public async flush(): Promise<void> {
    // Ensure all pending file writes are completed
    // This is useful during application shutdown
    try {
      if (this.fileLoggingEnabled && this.currentLogFile) {
        // Force a final write to ensure everything is flushed
        await fs.appendFile(this.currentLogFile, '', 'utf8');
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  public async shutdown(): Promise<void> {
    this.info('Logger shutting down', 'LoggerService');
    await this.flush();
  }
}

// Create singleton instance
let loggerInstance: LoggerService | null = null;

export function createLogger(config?: Partial<LoggerConfig>): LoggerService {
  if (!loggerInstance) {
    loggerInstance = new LoggerService(config);
  }
  return loggerInstance;
}

export function getLogger(): LoggerService {
  if (!loggerInstance) {
    loggerInstance = new LoggerService();
  }
  return loggerInstance;
}

export { LoggerService };