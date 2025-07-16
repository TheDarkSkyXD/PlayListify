"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
exports.createLogger = createLogger;
exports.getLogger = getLogger;
const tslib_1 = require("tslib");
const electron_1 = require("electron");
const fs = tslib_1.__importStar(require("fs-extra"));
const path = tslib_1.__importStar(require("path"));
class LoggerService {
    constructor(config) {
        this.logDirectory = '';
        this.currentLogFile = '';
        this.fileLoggingEnabled = true;
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
    async initializeLogDirectory() {
        try {
            // Create Console Logs directory in app data
            const userDataPath = electron_1.app.getPath('userData');
            this.logDirectory = path.join(userDataPath, 'Console Logs');
            // Ensure directory exists
            await fs.ensureDir(this.logDirectory);
            // Clean up old log files from previous sessions
            await this.cleanupOldLogs();
            // Set current log file path
            this.currentLogFile = path.join(this.logDirectory, `app-${this.sessionId}.log`);
            this.config.file.path = this.currentLogFile;
            // Log initialization success
            this.info('Logger initialized successfully', 'LoggerService', {
                logDirectory: this.logDirectory,
                logFile: this.currentLogFile,
                sessionId: this.sessionId
            });
        }
        catch (error) {
            // Fallback to console-only logging
            this.fileLoggingEnabled = false;
            this.config.file.enabled = false;
            console.warn('Failed to initialize file logging, falling back to console-only:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.warn('File logging disabled due to initialization error', 'LoggerService', { error: errorMessage });
        }
    }
    async cleanupOldLogs() {
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
        }
        catch (error) {
            console.warn('Failed to cleanup old log files:', error);
        }
    }
    shouldLog(level) {
        const levels = ['error', 'warn', 'info', 'debug'];
        const currentLevelIndex = levels.indexOf(this.config.level);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex <= currentLevelIndex;
    }
    formatTimestamp() {
        return new Date().toISOString();
    }
    formatLogEntry(entry) {
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
    getConsoleColor(level) {
        if (!this.config.console.colorize)
            return '';
        const colors = {
            error: '\x1b[31m', // Red
            warn: '\x1b[33m', // Yellow
            info: '\x1b[36m', // Cyan
            debug: '\x1b[90m' // Gray
        };
        return colors[level] || '';
    }
    resetConsoleColor() {
        return this.config.console.colorize ? '\x1b[0m' : '';
    }
    async writeToFile(entry) {
        if (!this.config.file.enabled || !this.fileLoggingEnabled) {
            return;
        }
        try {
            const logLine = this.formatLogEntry(entry) + '\n';
            await fs.appendFile(this.currentLogFile, logLine, 'utf8');
            // Check file size and rotate if necessary
            await this.checkAndRotateLog();
        }
        catch (error) {
            // Disable file logging on persistent errors
            this.fileLoggingEnabled = false;
            console.error('File logging disabled due to write error:', error);
        }
    }
    async checkAndRotateLog() {
        try {
            const stats = await fs.stat(this.currentLogFile);
            if (stats.size > this.config.file.maxSize) {
                // Create new log file with timestamp
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                this.currentLogFile = path.join(this.logDirectory, `app-${this.sessionId}-${timestamp}.log`);
                this.info('Log file rotated', 'LoggerService', {
                    newFile: this.currentLogFile,
                    previousSize: stats.size
                });
            }
        }
        catch (error) {
            console.warn('Failed to check log file size:', error);
        }
    }
    writeToConsole(entry) {
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
    log(level, message, context, data) {
        if (!this.shouldLog(level)) {
            return;
        }
        const entry = {
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
    error(message, context, data) {
        this.log('error', message, context, data);
    }
    warn(message, context, data) {
        this.log('warn', message, context, data);
    }
    info(message, context, data) {
        this.log('info', message, context, data);
    }
    debug(message, context, data) {
        this.log('debug', message, context, data);
    }
    setLevel(level) {
        this.config.level = level;
        this.info(`Log level changed to ${level}`, 'LoggerService');
    }
    getConfig() {
        return { ...this.config };
    }
    getLogDirectory() {
        return this.logDirectory;
    }
    getCurrentLogFile() {
        return this.currentLogFile;
    }
    isFileLoggingEnabled() {
        return this.fileLoggingEnabled && this.config.file.enabled;
    }
    async flush() {
        // Ensure all pending file writes are completed
        // This is useful during application shutdown
        try {
            if (this.fileLoggingEnabled && this.currentLogFile) {
                // Force a final write to ensure everything is flushed
                await fs.appendFile(this.currentLogFile, '', 'utf8');
            }
        }
        catch (error) {
            console.error('Failed to flush logs:', error);
        }
    }
    async shutdown() {
        this.info('Logger shutting down', 'LoggerService');
        await this.flush();
    }
}
exports.LoggerService = LoggerService;
// Create singleton instance
let loggerInstance = null;
function createLogger(config) {
    if (!loggerInstance) {
        loggerInstance = new LoggerService(config);
    }
    return loggerInstance;
}
function getLogger() {
    if (!loggerInstance) {
        loggerInstance = new LoggerService();
    }
    return loggerInstance;
}
//# sourceMappingURL=logger-service.js.map