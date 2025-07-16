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
declare class LoggerService {
    private config;
    private logDirectory;
    private currentLogFile;
    private fileLoggingEnabled;
    private sessionId;
    constructor(config?: Partial<LoggerConfig>);
    private initializeLogDirectory;
    private cleanupOldLogs;
    private shouldLog;
    private formatTimestamp;
    private formatLogEntry;
    private getConsoleColor;
    private resetConsoleColor;
    private writeToFile;
    private checkAndRotateLog;
    private writeToConsole;
    private log;
    error(message: string, context?: string, data?: any): void;
    warn(message: string, context?: string, data?: any): void;
    info(message: string, context?: string, data?: any): void;
    debug(message: string, context?: string, data?: any): void;
    setLevel(level: LogLevel): void;
    getConfig(): LoggerConfig;
    getLogDirectory(): string;
    getCurrentLogFile(): string;
    isFileLoggingEnabled(): boolean;
    flush(): Promise<void>;
    shutdown(): Promise<void>;
}
export declare function createLogger(config?: Partial<LoggerConfig>): LoggerService;
export declare function getLogger(): LoggerService;
export { LoggerService };
//# sourceMappingURL=logger-service.d.ts.map