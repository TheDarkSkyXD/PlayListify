#!/usr/bin/env node

/**
 * PlayListify Dependency Checker and Launcher
 * This script checks if ffmpeg and yt-dlp are installed, installs them if needed,
 * and then launches the application.
 */

// ========== IMPORTANT ==========
// Set critical environment variables BEFORE any requires to prevent native module rebuilding
process.env.ELECTRON_SKIP_BINARY_DOWNLOAD = '1';
process.env.npm_config_build_from_source = 'false';
process.env.npm_config_node_gyp = 'echo "Skipping node-gyp"';
process.env.ELECTRON_REBUILD_NATIVE_MODULES = 'false';
process.env.npm_config_sqlite_skip_gyp = 'true';
process.env.npm_config_sqlite_prebuild = 'true';
process.env.npm_config_ignore_scripts = 'true'; // Skip all install scripts
process.env.npm_config_sqlite = 'false'; // Disable native sqlite
process.env.npm_config_node_gyp_force_unix = 'true'; // For Windows issues
process.env.npm_config_loglevel = 'error'; // Suppress npm warnings
// ========== END IMPORTANT ==========

const fs = require('fs-extra');
const path = require('path');
const { exec, spawn } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const https = require('https');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const { promisify } = require('util');
const extractZip = require('extract-zip');
const readline = require('readline'); // Import readline

const execAsync = promisify(exec);

// --- Path Definitions --- 
const IS_DEV = process.env.NODE_ENV === 'development';
const PROJECT_ROOT = path.resolve('.');

// Production/Default Paths (User AppData)
const APP_DATA_DIR = process.env.PLAYLISTIFY_DEV_APP_DATA || path.join(process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library/Application Support') : path.join(process.env.HOME, '.config')), 'playlistify');
const PROD_DEPS_DIR = path.join(APP_DATA_DIR, 'bin');
const PROD_YTDLP_PATH = path.join(PROD_DEPS_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
const PROD_FFMPEG_DIR = path.join(PROD_DEPS_DIR, 'ffmpeg');

// Development Paths (Project Root)
const DEV_YTDLP_DIR = path.join(PROJECT_ROOT, 'ytdlp');
const DEV_YTDLP_PATH = path.join(DEV_YTDLP_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
const DEV_FFMPEG_DIR = path.join(PROJECT_ROOT, 'ffmpeg');

// Determine actual paths based on environment
const YTDLP_PATH = IS_DEV ? DEV_YTDLP_PATH : PROD_YTDLP_PATH; // Final path for yt-dlp executable
const FFMPEG_EXTRACTION_TARGET_DIR = IS_DEV ? DEV_FFMPEG_DIR : PROD_FFMPEG_DIR; // Subdirectory where ffmpeg archive is extracted

// FFMPEG_EXE_PATH: Final path for ffmpeg executable, should be in the same directory as yt-dlp
const COMMON_BINARIES_DIR_FOR_EXECUTABLES = IS_DEV ? DEV_YTDLP_DIR : PROD_DEPS_DIR;
const FFMPEG_EXE_PATH = path.join(COMMON_BINARIES_DIR_FOR_EXECUTABLES, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');


// Ensure target directories exist
if (IS_DEV) {
  // Line 60 (approx, adjust based on actual file)
    fs.ensureDirSync(DEV_FFMPEG_DIR); // This is FFMPEG_EXTRACTION_TARGET_DIR for dev
  } else {
    fs.ensureDirSync(APP_DATA_DIR); // Ensure base app data dir exists
    fs.ensureDirSync(PROD_DEPS_DIR); // This is COMMON_BINARIES_DIR_FOR_EXECUTABLES for prod
    fs.ensureDirSync(PROD_FFMPEG_DIR); // This is FFMPEG_EXTRACTION_TARGET_DIR for prod
  }

/**
 * Log a formatted message to the console
 */
function log(message, type = 'info') {
  const styles = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    warning: chalk.yellow('⚠'),
    error: chalk.red('✖')
  };
  
  console.log(`${styles[type]} ${message}`);
}

/**
 * Download a file from a URL with progress
 */
async function downloadFile(url, destPath) {
  const tempPath = `${destPath}.download`;
  const file = createWriteStream(tempPath);
  
  // Create a progress spinner
  const spinner = ora(`Downloading ${path.basename(destPath)}...`).start();
  
  return new Promise((resolve, reject) => {
    let redirectCount = 0;
    
    const makeRequest = (currentUrl) => {
      if (redirectCount > 5) {
        spinner.fail('Too many redirects');
        return reject(new Error('Too many redirects'));
      }
      
      https.get(currentUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          redirectCount++;
          spinner.text = `Following redirect (${redirectCount})...`;
          makeRequest(response.headers.location);
          return;
        }
        
        // Check if the request was successful
        if (response.statusCode !== 200) {
          spinner.fail(`Failed to download: HTTP ${response.statusCode}`);
          return reject(new Error(`Failed with status code ${response.statusCode}`));
        }
        
        // Pipe the response to the file
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          fs.renameSync(tempPath, destPath);
          
          // Make executable on Unix-like systems
          if (process.platform !== 'win32') {
            fs.chmodSync(destPath, 0o755);
          }
          
          spinner.succeed(`Downloaded ${path.basename(destPath)}`);
          resolve(destPath);
        });
      }).on('error', (err) => {
        fs.unlinkSync(tempPath);
        spinner.fail(`Download failed: ${err.message}`);
        reject(err);
      });
    };
    
    makeRequest(url);
  });
}

/**
 * Use curl to download a file (better handling of redirects)
 */
async function downloadWithCurl(url, destPath) {
  const spinner = ora(`Downloading ${path.basename(destPath)}...`).start();
  
  try {
    // Using curl with --location to follow redirects, --fail to return non-zero on HTTP errors
    await execAsync(`curl --location --fail --silent --show-error --output "${destPath}" "${url}"`);
    
    // Make executable on Unix-like systems
    if (process.platform !== 'win32') {
      fs.chmodSync(destPath, 0o755);
    }
    
    spinner.succeed(`Downloaded ${path.basename(destPath)}`);
    return destPath;
  } catch (error) {
    spinner.fail(`Download failed: ${error.message}`);
    throw error;
  }
}

/**
 * Create readline interface and ask a question
 */
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(chalk.yellow(`? ${query} (Y/n): `), ans => {
    rl.close();
    resolve(ans.trim().toLowerCase());
  }));
}

/**
 * Check if yt-dlp is installed and working (uses resolved YTDLP_PATH)
 */
async function checkYtdlp() {
  const spinner = ora(`Checking for yt-dlp at ${YTDLP_PATH}...`).start();
  
  try {
    if (fs.existsSync(YTDLP_PATH)) {
      try {
        const { stdout } = await execAsync(`"${YTDLP_PATH}" --version`);
        spinner.succeed(`yt-dlp found (version ${stdout.trim()})`);
        return true;
      } catch (error) {
        spinner.warn('yt-dlp exists but is not working correctly, will reinstall');
        return false;
      }
    } else {
      spinner.info('yt-dlp not found');
      return false;
    }
  } catch (error) {
    spinner.fail(`Error checking yt-dlp: ${error.message}`);
    return false;
  }
}

/**
 * Install yt-dlp (installs to resolved YTDLP_PATH)
 */
async function installYtdlp() {
  log(`Installing yt-dlp to ${YTDLP_PATH}...`, 'info');
  
  const isWin = process.platform === 'win32';
  const downloadUrl = isWin
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
  
  try {
    // Try using curl first (better handling of redirects)
    await downloadWithCurl(downloadUrl, YTDLP_PATH);
    log('yt-dlp installed successfully', 'success');
    
    return true;
  } catch (error) {
    log(`Failed to install yt-dlp: ${error.message}`, 'error');
    
    try {
      // Fall back to alternative download method
      log('Trying alternative download method...', 'info');
      await downloadFile(downloadUrl, YTDLP_PATH);
      log('yt-dlp installed successfully', 'success');
      return true;
    } catch (fallbackError) {
      log(`Failed to install yt-dlp with fallback method: ${fallbackError.message}`, 'error');
      return false;
    }
  }
}

/**
 * Check if ffmpeg is installed and working (uses resolved FFMPEG_EXE_PATH)
 */
async function checkFfmpeg() {
  const spinner = ora(`Checking for ffmpeg at ${FFMPEG_EXE_PATH}...`).start();
  
  try {
    const ffmpegExe = FFMPEG_EXE_PATH;
    
    if (fs.existsSync(ffmpegExe)) {
      try {
        const { stdout } = await execAsync(`"${ffmpegExe}" -version`);
        const versionMatch = stdout.match(/version\s+(\S+)/);
        const version = versionMatch ? versionMatch[1] : 'unknown';
        spinner.succeed(`ffmpeg found (version ${version})`);
        return true;
      } catch (error) {
        spinner.warn('ffmpeg exists but is not working correctly, will reinstall');
        return false;
      }
    } else {
      spinner.info('ffmpeg not found');
      return false;
    }
  } catch (error) {
    spinner.fail(`Error checking ffmpeg: ${error.message}`);
    return false;
  }
}

/**
 * Install ffmpeg (installs to resolved FFMPEG_DIR)
 */
async function installFfmpeg() {
  log(`Installing ffmpeg to ${FFMPEG_EXE_PATH} (extracted to ${FFMPEG_EXTRACTION_TARGET_DIR})...`, 'info');
  
  try {
    const isWin = process.platform === 'win32';
    let downloadUrl;
    
    if (isWin) {
      downloadUrl = 'https://github.com/GyanD/codexffmpeg/releases/download/5.1.2/ffmpeg-5.1.2-essentials_build.zip';
    } else if (process.platform === 'darwin') {
      // macOS - normally would use brew, but for this demo script we'll download a binary
      downloadUrl = 'https://evermeet.cx/ffmpeg/getrelease/zip';
    } else {
      // Linux
      downloadUrl = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';
    }
    
    const spinner = ora(`Downloading ffmpeg...`).start();
    const zipPath = path.join(FFMPEG_EXTRACTION_TARGET_DIR, 'ffmpeg-temp.zip'); // Download zip to extraction dir
    
    // Download the ffmpeg archive
    try {
      await downloadWithCurl(downloadUrl, zipPath);
      spinner.succeed('Downloaded ffmpeg archive');
    } catch (error) {
      spinner.fail(`Failed to download ffmpeg: ${error.message}`);
      
      try {
        spinner.start('Trying alternate download method...');
        await downloadFile(downloadUrl, zipPath);
        spinner.succeed('Downloaded ffmpeg archive');
      } catch (fallbackError) {
        spinner.fail(`Failed to download ffmpeg with fallback method: ${fallbackError.message}`);
        return false;
      }
    }
    // Line 309 (inside installFfmpeg)
        // Extract the archive
        const extractSpinner = ora(`Extracting ffmpeg to ${FFMPEG_EXTRACTION_TARGET_DIR}...`).start();
        try {
          await fs.ensureDir(FFMPEG_EXTRACTION_TARGET_DIR); // Ensure extraction target directory exists
          if (isWin) {
            // Windows - extract the zip
            await extractZip(zipPath, { dir: FFMPEG_EXTRACTION_TARGET_DIR });
            
            // Find the ffmpeg.exe file in the extracted directory
            const ffmpegFiles = await fs.promises.readdir(FFMPEG_EXTRACTION_TARGET_DIR, { recursive: true });
        const ffmpegExeRelative = ffmpegFiles.find(file => file.endsWith('ffmpeg.exe'));
        // Line 319 (inside installFfmpeg)
                if (!ffmpegExeRelative) {
                  throw new Error('ffmpeg.exe not found in the extracted archive at ' + FFMPEG_EXTRACTION_TARGET_DIR);
                }
                
                const sourcePath = path.join(FFMPEG_EXTRACTION_TARGET_DIR, ffmpegExeRelative);
        const destPath = FFMPEG_EXE_PATH;
        
        // Move ffmpeg.exe to the expected location if it's not already there
        if (path.normalize(sourcePath) !== path.normalize(destPath)) {
          await fs.move(sourcePath, destPath, { overwrite: true });
        }
        
        extractSpinner.succeed('Extracted ffmpeg');
      } else {
        // Line 335 (inside installFfmpeg)
                if (downloadUrl.endsWith('.zip')) {
                  await extractZip(zipPath, { dir: FFMPEG_EXTRACTION_TARGET_DIR });
                } else {
                  // For tar, ensure the executable ends up in FFMPEG_EXE_PATH (COMMON_BINARIES_DIR_FOR_EXECUTABLES)
                  // This might require moving it if tar extracts into FFMPEG_EXTRACTION_TARGET_DIR with a subdir
                  // For simplicity, assuming tar also extracts ffmpeg that can be moved.
                  // A more robust tar extraction would be to extract to a temp dir, find 'ffmpeg', then move.
                  // Current logic moves from FFMPEG_EXTRACTION_TARGET_DIR/somepath/ffmpeg to FFMPEG_EXE_PATH
                   await execAsync(`tar -xf "${zipPath}" -C "${FFMPEG_EXTRACTION_TARGET_DIR}" --strip-components=1`);
                }
                
                // After extraction to FFMPEG_EXTRACTION_TARGET_DIR, ffmpeg.exe (or ffmpeg)
                // needs to be moved to FFMPEG_EXE_PATH if not already there.
                // The existing fs.move logic handles this if ffmpegExeRelative is found.
                // For non-Windows, if tar extracts directly, we might need to find it.
                // The current logic for Windows (lines 316-329) is more robust for finding the exe.
                // For now, we rely on the existing move logic after this block for Unix.
                // If ffmpeg is extracted directly into FFMPEG_EXTRACTION_TARGET_DIR as 'ffmpeg'
                const extractedUnixFfmpegPath = path.join(FFMPEG_EXTRACTION_TARGET_DIR, 'ffmpeg');
                if (process.platform !== 'win32' && fs.existsSync(extractedUnixFfmpegPath) && FFMPEG_EXE_PATH !== extractedUnixFfmpegPath) {
                    await fs.move(extractedUnixFfmpegPath, FFMPEG_EXE_PATH, { overwrite: true });
                }
        
        
                if (!fs.existsSync(FFMPEG_EXE_PATH)) { // Check final desired location
                  throw new Error('ffmpeg binary not found at ' + FFMPEG_EXE_PATH + ' after extraction and potential move. Check extraction logic within FFMPEG_EXTRACTION_TARGET_DIR: ' + FFMPEG_EXTRACTION_TARGET_DIR );
        }
        
        await fs.chmod(FFMPEG_EXE_PATH, 0o755);
        extractSpinner.succeed('Extracted ffmpeg');
      }
      
      // Clean up the temporary archive
      await fs.remove(zipPath);
      
      log('ffmpeg installed successfully', 'success');
      return true;
    } catch (extractionError) {
          extractSpinner.fail(`Failed to extract ffmpeg: ${extractionError.message}`);
          // Attempt to clean up failed extraction directory
          await fs.remove(FFMPEG_EXTRACTION_TARGET_DIR).catch(() => {});
          return false;
    }
  } catch (error) {
    log(`Failed to install ffmpeg: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Start the application
 */
async function startApp() {
  log('Starting PlayListify...', 'info');
  log('Using npm to start electron-forge', 'info');
  log('Environment variables to prevent rebuilding are set', 'info');
  
  const child = spawn('npm', ['run', 'electron-start'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development', // Keep NODE_ENV for the electron app itself
      // PLAYLISTIFY_DEV_APP_DATA is no longer needed here for path finding
    }
  });
  
  child.on('error', (error) => {
    log(`Failed to start application: ${error.message}`, 'error');
    process.exit(1);
  });
  
  child.on('close', (code) => {
    if (code !== 0) {
      log(`Application exited with code ${code}`, 'warning');
    }
    process.exit(code);
  });
}

/**
 * Main function
 */
async function main() {
  log('PlayListify Dependency Checker and Launcher', 'info');
  log(`Using app data directory: ${APP_DATA_DIR}`, 'info');

  let proceed = true;

  // --- Check yt-dlp --- 
  const hasYtdlp = await checkYtdlp();
  if (!hasYtdlp) {
    const installConfirm = await askQuestion('yt-dlp not found or not working correctly. Attempt to download/install it automatically?');
    if (installConfirm === 'y' || installConfirm === '') { // Default to yes
      const ytdlpInstalled = await installYtdlp();
      if (!ytdlpInstalled) {
        log('Automatic installation of yt-dlp failed. Please install it manually and ensure it is accessible.', 'error');
        log('See: https://github.com/yt-dlp/yt-dlp#installation', 'error');
        proceed = false; // Cannot proceed without yt-dlp
      }
    } else {
      log('Skipping yt-dlp installation. Core download features will be unavailable.', 'warning');
      proceed = false; // Cannot proceed without yt-dlp
    }
  }

  // --- Check ffmpeg --- (Only if we are still proceeding)
  if (proceed) {
    const hasFfmpeg = await checkFfmpeg();
    if (!hasFfmpeg) {
      const installConfirm = await askQuestion('ffmpeg not found or not working correctly. Attempt to download/install it automatically?');
      if (installConfirm === 'y' || installConfirm === '') { // Default to yes
        const ffmpegInstalled = await installFfmpeg();
        if (!ffmpegInstalled) {
          log('Automatic installation of ffmpeg failed. Please install it manually and ensure it is accessible.', 'error');
          log('See: https://ffmpeg.org/download.html', 'error');
          proceed = false; // Cannot proceed without ffmpeg
        }
      } else {
        log('Skipping ffmpeg installation. Format conversion and merging features will be unavailable.', 'warning');
        proceed = false; // Cannot proceed without ffmpeg
      }
    }
  }

  // --- Start App ---
  if (proceed) {
    // Set the environment variable for the pathUtils.ts to use
    const binariesEnvPath = COMMON_BINARIES_DIR_FOR_EXECUTABLES;
    process.env.PLAYLISTIFY_BINARIES_PATH = binariesEnvPath;
    log(`PLAYLISTIFY_BINARIES_PATH set to: ${binariesEnvPath}`, 'info');

    await startApp();
  } else {
    log('Exiting due to missing critical dependencies.', 'error');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`, 'error');
  process.exit(1);
}); 