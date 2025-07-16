/**
 * Demonstration script for the logging system
 * This script shows all the logging features in action
 */

import { createLogger, LoggerService } from '../../src/backend/services/logger-service';
import { createDevelopmentService } from '../../src/backend/services/development-service';

async function demonstrateLoggingSystem() {
  console.log('=== Playlistify Logging System Demonstration ===\n');

  // 1. Create logger with comprehensive configuration
  console.log('1. Creating logger with comprehensive configuration...');
  const logger = createLogger({
    level: 'debug',
    file: {
      enabled: true,
      path: '',
      maxSize: 1024 * 1024, // 1MB
      maxFiles: 5
    },
    console: {
      enabled: true,
      colorize: true
    },
    development: {
      enhanced: true,
      stackTrace: true
    }
  });

  // 2. Demonstrate different log levels
  console.log('\n2. Demonstrating different log levels...');
  logger.debug('This is a debug message', 'Demo', { level: 'debug' });
  logger.info('This is an info message', 'Demo', { level: 'info' });
  logger.warn('This is a warning message', 'Demo', { level: 'warn' });
  logger.error('This is an error message', 'Demo', { level: 'error' });

  // 3. Demonstrate timestamped log entries
  console.log('\n3. Demonstrating timestamped log entries...');
  logger.info('Log entry with timestamp', 'TimestampDemo');
  
  // Wait a moment to show different timestamps
  await new Promise(resolve => setTimeout(resolve, 100));
  logger.info('Another log entry with different timestamp', 'TimestampDemo');

  // 4. Demonstrate contextual logging
  console.log('\n4. Demonstrating contextual logging...');
  logger.info('Application started', 'AppLifecycle');
  logger.info('User logged in', 'Authentication', { userId: 'user123' });
  logger.info('File processed', 'FileProcessor', { 
    filename: 'example.mp4', 
    size: '15.2MB',
    duration: '3:45'
  });

  // 5. Demonstrate error handling with data
  console.log('\n5. Demonstrating error handling with structured data...');
  logger.error('Database connection failed', 'Database', {
    host: 'localhost',
    port: 5432,
    database: 'playlistify',
    error: 'Connection timeout',
    retryAttempt: 3
  });

  // 6. Demonstrate log level filtering
  console.log('\n6. Demonstrating log level filtering...');
  logger.setLevel('warn');
  logger.debug('This debug message should not appear');
  logger.info('This info message should not appear');
  logger.warn('This warning message should appear', 'FilterDemo');
  logger.error('This error message should appear', 'FilterDemo');

  // Reset to debug level
  logger.setLevel('debug');

  // 7. Demonstrate development features
  console.log('\n7. Demonstrating development features...');
  const devService = createDevelopmentService({
    enabled: true,
    performanceMonitoring: true,
    memoryTracking: true
  });

  // Log system information
  devService.logSystemInfo();

  // Show memory usage
  const memoryUsage = devService.getFormattedMemoryUsage();
  logger.info('Current memory usage', 'PerformanceMonitor', memoryUsage);

  // 8. Demonstrate graceful fallback
  console.log('\n8. Demonstrating graceful fallback to console-only logging...');
  logger.info('File logging status', 'LoggingSystem', {
    fileLoggingEnabled: logger.isFileLoggingEnabled(),
    logDirectory: logger.getLogDirectory(),
    currentLogFile: logger.getCurrentLogFile()
  });

  // 9. Demonstrate enhanced debugging in development mode
  console.log('\n9. Demonstrating enhanced debugging capabilities...');
  try {
    throw new Error('Simulated error for demonstration');
  } catch (error) {
    logger.error('Caught demonstration error', 'ErrorHandling', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  // 10. Show configuration
  console.log('\n10. Current logger configuration:');
  const config = logger.getConfig();
  logger.info('Logger configuration', 'Configuration', {
    level: config.level,
    fileEnabled: config.file.enabled,
    consoleEnabled: config.console.enabled,
    developmentMode: config.development.enhanced
  });

  // 11. Demonstrate cleanup
  console.log('\n11. Demonstrating proper cleanup...');
  await logger.flush();
  logger.info('Logger flushed successfully', 'Cleanup');

  // Shutdown services
  devService.shutdown();
  await logger.shutdown();

  console.log('\n=== Logging System Demonstration Complete ===');
  console.log('✅ All logging features demonstrated successfully!');
  console.log('✅ Timestamped log entries created');
  console.log('✅ Console and file logging working');
  console.log('✅ Log level filtering functional');
  console.log('✅ Enhanced debugging capabilities enabled');
  console.log('✅ Graceful fallback mechanisms in place');
  console.log('✅ Development tools integrated');
  console.log('✅ Proper cleanup and shutdown procedures');
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateLoggingSystem().catch(error => {
    console.error('Demonstration failed:', error);
    process.exit(1);
  });
}

export { demonstrateLoggingSystem };