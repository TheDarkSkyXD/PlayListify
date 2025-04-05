import YtDlpWrap from 'yt-dlp-wrap';
import { exec } from 'child_process';
// import { promisify } from 'util'; // Not needed as we have custom execAsync
import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron';
import { getSetting } from '../settingsManager';
import { MAX_BUFFER_SIZE } from './config';

// Custom execAsync with timeout
export const execAsync = (command: string, options: any = {}, timeout: number = 60000) => {
  return new Promise((resolve, reject) => {
    console.log(`Executing command with ${timeout}ms timeout: ${command}`);
    const childProcess = exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command execution error: ${error.message}`);
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });

    // Set timeout to kill the process if it takes too long
    const timeoutId = setTimeout(() => {
      childProcess.kill();
      console.error(`Command timed out after ${timeout}ms: ${command}`);
      reject(new Error(`Command timed out after ${timeout / 1000} seconds`));
    }, timeout);

    // Clear timeout if process completes before timeout
    childProcess.on('exit', () => {
      clearTimeout(timeoutId);
    });
  });
};

// Initialize YtDlpWrap
let ytDlp: YtDlpWrap;

/**
 * Get the path to the bundled yt-dlp binary in production mode
 */
export function getBundledYtDlpPath(): string {
  // Determine the expected path based on the platform
  let binaryName: string;
  if (process.platform === 'win32') {
    binaryName = 'yt-dlp.exe';
  } else if (process.platform === 'darwin') {
    binaryName = 'yt-dlp';
  } else {
    // Linux
    binaryName = 'yt-dlp';
  }

  // In development
  if (process.env.NODE_ENV === 'development') {
    return path.join(process.cwd(), 'ytdlp', binaryName);
  }

  // In production
  let resourcesPath: string;
  if (process.env.NODE_ENV === 'production') {
    resourcesPath = process.resourcesPath;
  } else {
    // Fallback for testing or other environments
    resourcesPath = path.join(app.getAppPath(), '..', 'resources');
  }

  return path.join(resourcesPath, 'ytdlp', binaryName);
}

/**
 * Get the current ytDlp instance or initialize a new one
 */
export function getYtDlpInstance(): YtDlpWrap {
  if (!ytDlp) {
    // Initialize with the bundled binary path
    const binaryPath = getBundledYtDlpPath();
    if (fs.existsSync(binaryPath)) {
      ytDlp = new YtDlpWrap(binaryPath);
    } else {
      // Fallback to default path
      ytDlp = new YtDlpWrap();
    }
  }
  return ytDlp;
}

/**
 * Initialize the YtDlpWrap instance
 */
export async function initYtDlp(customBinaryPath?: string, silent: boolean = false): Promise<void> {
  try {
    // If already initialized, skip reinitialization
    if (ytDlp) {
      return;
    }

    // If a custom binary path is directly provided, use it
    if (customBinaryPath && await fs.pathExists(customBinaryPath)) {
      ytDlp = new YtDlpWrap(customBinaryPath);
      if (!silent) console.log(`Using custom yt-dlp binary at: ${customBinaryPath}`);
    }
    // Check if the setting for ytDlpPath exists
    else if (getSetting('ytDlpPath')) {
      const settingsPath = getSetting('ytDlpPath') as string;
      if (await fs.pathExists(settingsPath)) {
        ytDlp = new YtDlpWrap(settingsPath);
        if (!silent) console.log(`Using yt-dlp from settings at: ${settingsPath}`);
      }
    }
    // Check for bundled binary in production mode
    else if (await fs.pathExists(getBundledYtDlpPath())) {
      const bundledPath = getBundledYtDlpPath();
      ytDlp = new YtDlpWrap(bundledPath);
      if (!silent) console.log(`Using bundled yt-dlp binary at: ${bundledPath}`);
    }
    // If all else fails, let yt-dlp-wrap try to find or download it
    else {
      if (!silent) console.log('No existing yt-dlp binary found, letting yt-dlp-wrap handle it...');
      ytDlp = new YtDlpWrap();
    }

    // Test that yt-dlp is working and log version info
    const version = await ytDlp.getVersion();
    if (!silent) console.log(`yt-dlp initialized, version: ${version}`);

    // Log available commands only if not silent
    if (!silent) {
      try {
        const result = await execAsync(`"${getBundledYtDlpPath()}" --help`, {
          maxBuffer: MAX_BUFFER_SIZE
        });
        const stdout = typeof result === 'object' && result !== null && 'stdout' in result ? (result.stdout as string) : '';
        console.log('Available yt-dlp commands:',
          stdout.split('\n')
               .filter((line: string) => line.includes('--'))
               .slice(0, 5)
               .join('\n  ') +
          '\n  ... (truncated)'
        );
      } catch (e) {
        console.log('Could not retrieve yt-dlp help information');
      }
    }

    return;
  } catch (error: any) {
    console.error('Failed to initialize yt-dlp:', error);
    throw new Error('Failed to initialize yt-dlp. Please check if it is installed correctly.');
  }
}
