import * as path from 'path';
import * as fs from 'fs'; // Will add fs later if direct file existence checks are needed here

const binariesPathEnvVar = 'PLAYLISTIFY_BINARIES_PATH';

/**
 * Retrieves the path to the yt-dlp executable.
 * @returns {string} The full path to the yt-dlp executable.
 * @throws {Error} If the PLAYLISTIFY_BINARIES_PATH environment variable is not set.
 */
export function getYtDlpPath(): string {
  const binariesDir = process.env[binariesPathEnvVar];
  if (!binariesDir) {
    throw new Error(`Environment variable ${binariesPathEnvVar} is not set. yt-dlp path cannot be determined.`);
  }
  const executableName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  return path.join(binariesDir, executableName);
}

/**
 * Retrieves the path to the ffmpeg executable.
 * @returns {string} The full path to the ffmpeg executable.
 * @throws {Error} If the PLAYLISTIFY_BINARIES_PATH environment variable is not set.
 */
export function getFfmpegPath(): string {
  const binariesDir = process.env[binariesPathEnvVar];
  if (!binariesDir) {
    throw new Error(`Environment variable ${binariesPathEnvVar} is not set. ffmpeg path cannot be determined.`);
  }
  // According to the task, ffmpeg might be in a subdirectory, e.g. APP_DATA_DIR/bin/ffmpeg/ffmpeg
  // For now, let's assume it's directly in the binariesDir, similar to yt-dlp.
  // This can be adjusted if start.js places it in a nested directory.
  const executableName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  return path.join(binariesDir, executableName);
}

// Basic check to ensure the directory from env var exists, and files exist.
// This is more of a diagnostic utility, actual error handling for missing files
// should be closer to where these paths are used.
/**
 * Verifies if the specified executable exists at the given path.
 * This is a helper function and might be expanded or moved.
 * @param executablePath The path to the executable to check.
 * @param executableName The name of the executable (for logging).
 * @returns {boolean} True if the executable exists, false otherwise.
 */
export function verifyExecutableExists(executablePath: string, executableName: string): boolean {
  if (!fs.existsSync(executablePath)) {
    console.warn(`Warning: ${executableName} not found at expected path: ${executablePath}`);
    return false;
  }
  // Could add execute permission check for non-Windows platforms if necessary
  return true;
}