import fs from 'fs-extra';
import path from 'path';

/**
 * A utility to write directly to a file without any abstractions
 * This is used as a last resort when other logging methods fail
 */
export function writeDirectly(message: string): void {
  try {
    // Get the logs directory
    const logsDir = path.join(process.cwd(), 'logs');

    // Ensure the logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.ensureDirSync(logsDir);
    }

    // Get the console log file path
    const consoleLogFilePath = path.join(logsDir, 'consolelogs.txt');

    // Check if the file exists
    const fileExists = fs.existsSync(consoleLogFilePath);

    // If the file doesn't exist, create it
    if (!fileExists) {
      fs.writeFileSync(consoleLogFilePath, `=== PlayListify Console Log - ${new Date().toISOString()} ===\n\n`);
    }

    // Append to the file
    fs.appendFileSync(consoleLogFilePath, message + '\n');
  } catch (error) {
    // Silently fail
  }
}
