/**
 * Logger utility for consistent logging across the application
 * Provides different log levels and formatting options
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Current log level - can be changed at runtime
let currentLogLevel = LogLevel.INFO;

// Log level colors
const LOG_COLORS = {
  [LogLevel.DEBUG]: '#888',
  [LogLevel.INFO]: '#0070f3',
  [LogLevel.WARN]: '#f5a623',
  [LogLevel.ERROR]: '#ff0000',
};

// Module colors for different parts of the application
const MODULE_COLORS = {
  IMPORT: '#8a2be2',
  PROGRESS: '#00bcd4',
  UI: '#4caf50',
  API: '#ff9800',
  DEFAULT: '#888',
};

// Set the current log level function (will be exported as part of the logger object)
function setLogLevel(level: LogLevel) {
  currentLogLevel = level;
}

// Main logger function
function log(level: LogLevel, module: string, message: string, ...args: any[]) {
  // Skip if below current log level
  if (level < currentLogLevel) return;

  const moduleColor = MODULE_COLORS[module as keyof typeof MODULE_COLORS] || MODULE_COLORS.DEFAULT;
  const levelColor = LOG_COLORS[level];

  // Format the log message
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const levelName = LogLevel[level];

  // Create the formatted message
  console.log(
    `%c[${timestamp}]%c [${levelName}]%c [${module}]%c ${message}`,
    'color: #888',
    `color: ${levelColor}; font-weight: bold`,
    `color: ${moduleColor}; font-weight: bold`,
    'color: inherit',
    ...args
  );
}

// Export convenience methods for different log levels
export const logger = {
  // Set the log level
  setLogLevel,

  // Log level methods
  debug: (module: string, message: string, ...args: any[]) =>
    log(LogLevel.DEBUG, module, message, ...args),

  info: (module: string, message: string, ...args: any[]) =>
    log(LogLevel.INFO, module, message, ...args),

  warn: (module: string, message: string, ...args: any[]) =>
    log(LogLevel.WARN, module, message, ...args),

  error: (module: string, message: string, ...args: any[]) =>
    log(LogLevel.ERROR, module, message, ...args),

  // Group related logs together
  group: (name: string) => console.group(name),
  groupEnd: () => console.groupEnd(),

  // Track phases clearly
  phase: (module: string, phase: string, message: string, ...args: any[]) => {
    log(LogLevel.INFO, module, `PHASE [${phase}] ${message}`, ...args);
  }
};
