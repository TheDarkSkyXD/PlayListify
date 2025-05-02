#!/usr/bin/env node

/**
 * PlayListify Dependency Checker and Launcher
 * This script checks if ffmpeg and yt-dlp are installed, installs them if needed,
 * and then launches the application.
 */

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

const execAsync = promisify(exec);

// Constants
const APP_DATA_DIR = process.env.PLAYLISTIFY_DEV_APP_DATA || path.join(process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library/Application Support') : path.join(process.env.HOME, '.config')), 'playlistify');
const DEPS_DIR = path.join(APP_DATA_DIR, 'bin');
const YTDLP_PATH = path.join(DEPS_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
const FFMPEG_DIR = path.join(DEPS_DIR, 'ffmpeg');

// Ensure directories exist
fs.ensureDirSync(APP_DATA_DIR);
fs.ensureDirSync(DEPS_DIR);
fs.ensureDirSync(FFMPEG_DIR);

// Set environment variable for the dev app data
process.env.PLAYLISTIFY_DEV_APP_DATA = APP_DATA_DIR;

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
 * Check if yt-dlp is installed and working
 */
async function checkYtdlp() {
  const spinner = ora('Checking for yt-dlp...').start();
  
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
 * Install yt-dlp
 */
async function installYtdlp() {
  log('Installing yt-dlp...', 'info');
  
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
 * Check if ffmpeg is installed and working
 */
async function checkFfmpeg() {
  const spinner = ora('Checking for ffmpeg...').start();
  
  try {
    const ffmpegExe = path.join(FFMPEG_DIR, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    
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
 * Install ffmpeg
 */
async function installFfmpeg() {
  log('Installing ffmpeg...', 'info');
  
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
    const zipPath = path.join(DEPS_DIR, 'ffmpeg-temp.zip');
    
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
    
    // Extract the archive
    const extractSpinner = ora('Extracting ffmpeg...').start();
    try {
      if (isWin) {
        // Windows - extract the zip
        await extractZip(zipPath, { dir: FFMPEG_DIR });
        
        // Find the ffmpeg.exe file in the extracted directory
        const ffmpegFiles = await fs.promises.readdir(FFMPEG_DIR, { recursive: true });
        const ffmpegExe = ffmpegFiles.find(file => file.endsWith('ffmpeg.exe'));
        
        if (!ffmpegExe) {
          throw new Error('ffmpeg.exe not found in the extracted archive');
        }
        
        const sourcePath = path.join(FFMPEG_DIR, ffmpegExe);
        const destPath = path.join(FFMPEG_DIR, 'ffmpeg.exe');
        
        // Move ffmpeg.exe to the expected location
        await fs.move(sourcePath, destPath, { overwrite: true });
        
        extractSpinner.succeed('Extracted ffmpeg');
      } else {
        // Unix-like systems - extract tar.xz or zip
        if (downloadUrl.endsWith('.zip')) {
          await extractZip(zipPath, { dir: FFMPEG_DIR });
        } else {
          await execAsync(`tar -xf "${zipPath}" -C "${FFMPEG_DIR}"`);
        }
        
        // Find the ffmpeg binary in the extracted directory
        const ffmpegFiles = await fs.promises.readdir(FFMPEG_DIR, { recursive: true });
        const ffmpegBin = ffmpegFiles.find(file => file === 'ffmpeg' || file.endsWith('/ffmpeg'));
        
        if (!ffmpegBin) {
          throw new Error('ffmpeg binary not found in the extracted archive');
        }
        
        const sourcePath = path.join(FFMPEG_DIR, ffmpegBin);
        const destPath = path.join(FFMPEG_DIR, 'ffmpeg');
        
        // Move ffmpeg to the expected location
        await fs.move(sourcePath, destPath, { overwrite: true });
        await fs.chmod(destPath, 0o755);
        
        extractSpinner.succeed('Extracted ffmpeg');
      }
      
      // Clean up the temporary archive
      await fs.remove(zipPath);
      
      log('ffmpeg installed successfully', 'success');
      return true;
    } catch (error) {
      extractSpinner.fail(`Failed to extract ffmpeg: ${error.message}`);
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
  
  const child = spawn('npm', ['run', 'electron-start'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PLAYLISTIFY_DEV_APP_DATA: APP_DATA_DIR
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
  
  // Check dependencies
  const hasYtdlp = await checkYtdlp();
  const hasFfmpeg = await checkFfmpeg();
  
  // Install dependencies if needed
  if (!hasYtdlp) {
    const ytdlpInstalled = await installYtdlp();
    if (!ytdlpInstalled) {
      log('Failed to install yt-dlp, but will continue', 'warning');
    }
  }
  
  if (!hasFfmpeg) {
    const ffmpegInstalled = await installFfmpeg();
    if (!ffmpegInstalled) {
      log('Failed to install ffmpeg, but will continue', 'warning');
    }
  }
  
  // Start the application
  await startApp();
}

// Run the main function
main().catch(error => {
  log(`Unhandled error: ${error.message}`, 'error');
  process.exit(1);
}); 