const getTimestamp = (): string => new Date().toISOString();

export const logger = {
  info: (...args: any[]): void => {
    console.log(`[${getTimestamp()}] [INFO]`, ...args);
  },
  warn: (...args: any[]): void => {
    console.warn(`[${getTimestamp()}] [WARN]`, ...args);
  },
  error: (...args: any[]): void => {
    console.error(`[${getTimestamp()}] [ERROR]`, ...args);
  },
  debug: (...args: any[]): void => {
    // In a more advanced logger, this could be conditional based on NODE_ENV
    console.debug(`[${getTimestamp()}] [DEBUG]`, ...args);
  },
}; 