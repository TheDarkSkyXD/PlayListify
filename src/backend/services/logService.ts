import { app } from 'electron';
import path from 'path';
import winston from 'winston';
import fs from 'fs-extra';

// Create logs directory
const userDataPath = app.getPath('userData');
const logsPath = path.join(userDataPath, 'logs');
fs.ensureDirSync(logsPath);

// Configure logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Write to console in development mode
    ...(process.env.NODE_ENV === 'development' 
      ? [new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        })]
      : []),
    // Always write to log file
    new winston.transports.File({
      filename: path.join(logsPath, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logsPath, 'combined.log'),
    }),
  ],
});

// Export logger
export default logger;

// Helper to log uncaught exceptions and unhandled rejections
export const setupGlobalErrorLogging = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
  });
}; 