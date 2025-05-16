import path from 'path';
import fs from 'fs-extra';
import { app } from 'electron'; // Import app to potentially use app paths
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const IS_DEV = process.env.NODE_ENV === 'development';

// Define base directories based on environment
const PROJECT_ROOT = path.resolve('.'); // Root of the project

// Production/Default paths (User AppData)
const APP_DATA_DIR = path.join(app.getPath('userData')); // Use Electron's recommended path
const PROD_DEPS_DIR = path.join(APP_DATA_DIR, 'bin');
const PROD_YTDLP_PATH = path.join(PROD_DEPS_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
const PROD_FFMPEG_DIR = path.join(PROD_DEPS_DIR, 'ffmpeg');
const PROD_FFMPEG_PATH = path.join(PROD_FFMPEG_DIR, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

// Development paths (PROJECT_ROOT/installs/TOOL/bin/)
const DEV_INSTALLS_DIR = path.join(PROJECT_ROOT, 'installs');

const DEV_YTDLP_INSTALL_DIR = path.join(DEV_INSTALLS_DIR, 'ytdlp', 'bin');
const DEV_YTDLP_PATH = path.join(DEV_YTDLP_INSTALL_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

const DEV_FFMPEG_INSTALL_DIR = path.join(DEV_INSTALLS_DIR, 'ffmpeg', 'bin');
const DEV_FFMPEG_PATH = path.join(DEV_FFMPEG_INSTALL_DIR, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

// Determine actual paths based on environment
const YTDLP_PATH = IS_DEV ? DEV_YTDLP_PATH : PROD_YTDLP_PATH;
const FFMPEG_PATH = IS_DEV ? DEV_FFMPEG_PATH : PROD_FFMPEG_PATH;

/**
 * Gets the resolved path to the yt-dlp binary managed by start.js.
 * Performs a basic existence check.
 * @returns The path to the binary, or null if not found.
 */
export async function getManagedYtDlpPath(): Promise<string | null> {
    const checkPath = YTDLP_PATH;
    if (await fs.pathExists(checkPath)) {
        console.log(`Using yt-dlp binary at: ${checkPath}`);
        return checkPath;
    }
    console.error(`yt-dlp binary not found at expected location: ${checkPath}`);
    return null;
}

/**
 * Gets the resolved path to the ffmpeg binary managed by start.js.
 * Performs a basic existence check, with fallback to system PATH.
 * @returns The path to the binary, or null if not found.
 */
export async function getManagedFfmpegPath(): Promise<string | null> {
    const checkPath = FFMPEG_PATH;
    if (await fs.pathExists(checkPath)) {
        console.log(`Using ffmpeg binary at: ${checkPath}`);
        return checkPath;
    }
    console.error(`Managed ffmpeg binary not found at expected location: ${checkPath}`);

    // Fallback: Check if 'ffmpeg' exists in system PATH
    try {
        await execPromise('ffmpeg -version');
        console.warn(`Managed ffmpeg not found at ${checkPath}, but found ffmpeg in system PATH. Using system ffmpeg.`);
        return 'ffmpeg'; // Return 'ffmpeg' assuming it's in PATH
    } catch (error) {
        console.error('System ffmpeg also not found in PATH.');
        return null;
    }
} 