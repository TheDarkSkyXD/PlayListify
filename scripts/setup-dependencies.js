// Node.js script to check and install yt-dlp and FFmpeg before the app starts
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const readline = require('readline');
const https = require('https');
const { Extract } = require('unzipper');

const execAsync = promisify(exec);

// Terminal color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  
  // Foreground (text) colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Styled console output helpers
const c = {
  header: (text) => console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`),
  subheader: (text) => console.log(`${colors.bright}${colors.blue}${text}${colors.reset}`),
  success: (text) => console.log(`${colors.bright}${colors.green}${text}${colors.reset}`),
  warning: (text) => console.log(`${colors.bright}${colors.yellow}${text}${colors.reset}`),
  error: (text) => console.log(`${colors.bright}${colors.red}${text}${colors.reset}`),
  info: (text) => console.log(`${colors.white}${text}${colors.reset}`),
  highlight: (text) => console.log(`${colors.bright}${colors.yellow}${text}${colors.reset}`),
  prompt: (text) => process.stdout.write(`${colors.bright}${colors.cyan}${text}${colors.reset}`),
  divider: () => console.log(`${colors.dim}-----------------------------------------------${colors.reset}`),
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Define paths
const ytdlpDir = path.join(process.cwd(), 'ytdlp');
const ytdlpExe = path.join(ytdlpDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
const ffmpegDir = path.join(process.cwd(), 'ffmpeg');
const ffmpegExe = path.join(ffmpegDir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

/**
 * Check if yt-dlp is installed
 */
async function checkYtDlp() {
  c.header('\n=== Checking yt-dlp Installation ===');
  
  try {
    // Check if yt-dlp is in the system PATH
    try {
      const { stdout } = await execAsync('yt-dlp --version', { timeout: 5000 });
      c.success('✓ yt-dlp is installed in the system PATH');
      c.info(`  Version: ${stdout.trim()}`);
      return { installed: true, location: 'system' };
    } catch (error) {
      c.warning('✗ yt-dlp is not installed in the system PATH');
      
      // Check if yt-dlp is in the bundled location
      if (await fs.pathExists(ytdlpExe)) {
        try {
          const { stdout } = await execAsync(`"${ytdlpExe}" --version`, { timeout: 5000 });
          c.success(`✓ yt-dlp is installed in the bundled location: ${ytdlpExe}`);
          c.info(`  Version: ${stdout.trim()}`);
          return { installed: true, location: 'bundled', path: ytdlpExe };
        } catch (error) {
          c.error(`✗ yt-dlp executable exists but failed to run: ${error.message}`);
        }
      } else {
        c.error(`✗ yt-dlp is not installed in the bundled location: ${ytdlpExe}`);
      }
    }
    
    return { installed: false };
  } catch (error) {
    c.error(`Error checking yt-dlp: ${error.message}`);
    return { installed: false, error };
  }
}

/**
 * Check if FFmpeg is installed
 */
async function checkFFmpeg() {
  c.header('\n=== Checking FFmpeg Installation ===');
  
  try {
    // Check if FFmpeg is in the system PATH
    try {
      const { stdout } = await execAsync('ffmpeg -version', { timeout: 5000 });
      c.success('✓ FFmpeg is installed in the system PATH');
      c.info(`  Version: ${stdout.split('\n')[0]}`);
      return { installed: true, location: 'system' };
    } catch (error) {
      c.warning('✗ FFmpeg is not installed in the system PATH');
      
      // Check if FFmpeg is in the bundled location
      if (await fs.pathExists(ffmpegExe)) {
        try {
          const { stdout } = await execAsync(`"${ffmpegExe}" -version`, { timeout: 5000 });
          c.success(`✓ FFmpeg is installed in the bundled location: ${ffmpegExe}`);
          c.info(`  Version: ${stdout.split('\n')[0]}`);
          return { installed: true, location: 'bundled', path: ffmpegExe };
        } catch (error) {
          c.error(`✗ FFmpeg executable exists but failed to run: ${error.message}`);
        }
      } else {
        c.error(`✗ FFmpeg is not installed in the bundled location: ${ffmpegExe}`);
      }
    }
    
    return { installed: false };
  } catch (error) {
    c.error(`Error checking FFmpeg: ${error.message}`);
    return { installed: false, error };
  }
}

/**
 * Download yt-dlp
 */
async function downloadYtDlp() {
  c.header('\n=== Downloading yt-dlp ===');
  
  try {
    // Create the directory if it doesn't exist
    await fs.ensureDir(ytdlpDir);
    
    // Define download URL based on platform
    const url = process.platform === 'win32'
      ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
      : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
    
    c.info(`Downloading yt-dlp from ${url}...`);
    
    // Download the file
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(ytdlpExe);
      
      https.get(url, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          c.info(`Following redirect to ${response.headers.location}`);
          https.get(response.headers.location, (redirectResponse) => {
            redirectResponse.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          }).on('error', (err) => {
            fs.unlink(ytdlpExe, () => {});
            reject(err);
          });
          return;
        }
        
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(ytdlpExe, () => {});
        reject(err);
      });
    });
    
    // Make the file executable on non-Windows platforms
    if (process.platform !== 'win32') {
      await fs.chmod(ytdlpExe, 0o755);
    }
    
    c.success('✓ yt-dlp downloaded successfully');
    
    // Verify the installation
    try {
      const { stdout } = await execAsync(`"${ytdlpExe}" --version`, { timeout: 5000 });
      c.success(`✓ yt-dlp verified: version ${stdout.trim()}`);
      return true;
    } catch (error) {
      c.error(`✗ yt-dlp verification failed: ${error.message}`);
      return false;
    }
  } catch (error) {
    c.error(`Error downloading yt-dlp: ${error.message}`);
    return false;
  }
}

/**
 * Download FFmpeg
 */
async function downloadFFmpeg() {
  c.header('\n=== Downloading FFmpeg ===');
  
  try {
    // Create the directory if it doesn't exist
    await fs.ensureDir(ffmpegDir);
    
    // Define download URL based on platform
    let url, tempFile, extractionMethod;
    
    if (process.platform === 'win32') {
      url = 'https://github.com/GyanD/codexffmpeg/releases/download/6.0/ffmpeg-6.0-essentials_build.zip';
      tempFile = path.join(ffmpegDir, 'ffmpeg-temp.zip');
      extractionMethod = 'zip';
    } else if (process.platform === 'darwin') {
      url = 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip';
      tempFile = path.join(ffmpegDir, 'ffmpeg-temp.zip');
      extractionMethod = 'zip';
    } else {
      url = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';
      tempFile = path.join(ffmpegDir, 'ffmpeg-temp.tar.xz');
      extractionMethod = 'tar.xz';
    }
    
    c.info(`Downloading FFmpeg from ${url}...`);
    
    // Download the file
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempFile);
      
      https.get(url, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          c.info(`Following redirect to ${response.headers.location}`);
          https.get(response.headers.location, (redirectResponse) => {
            redirectResponse.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          }).on('error', (err) => {
            fs.unlink(tempFile, () => {});
            reject(err);
          });
          return;
        }
        
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(tempFile, () => {});
        reject(err);
      });
    });
    
    c.success('✓ FFmpeg download completed');
    c.info('Extracting FFmpeg...');
    
    // Extract the file based on platform
    if (extractionMethod === 'zip') {
      // For Windows and macOS, extract the zip file
      const extractDir = path.join(ffmpegDir, 'temp-extract');
      await fs.ensureDir(extractDir);
      
      // Extract the zip file
      await new Promise((resolve, reject) => {
        fs.createReadStream(tempFile)
          .pipe(Extract({ path: extractDir }))
          .on('close', resolve)
          .on('error', reject);
      });
      
      // Find the ffmpeg executable in the extracted directory
      const findFfmpeg = async (dir) => {
        const files = await fs.readdir(dir, { withFileTypes: true });
        
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          
          if (file.isDirectory()) {
            const found = await findFfmpeg(fullPath);
            if (found) return found;
          } else if (file.name.toLowerCase() === (process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')) {
            c.info(`Found FFmpeg at ${fullPath}`);
            return fullPath;
          }
        }
        
        return null;
      };
      
      // Try to find ffmpeg in the extracted directory
      const extractedFfmpeg = await findFfmpeg(extractDir);
      
      if (extractedFfmpeg) {
        // Copy the ffmpeg executable to the final location
        await fs.copy(extractedFfmpeg, ffmpegExe);
        c.info(`Copied ${extractedFfmpeg} to ${ffmpegExe}`);
      } else {
        c.error('Could not find FFmpeg executable in the extracted files');
        throw new Error('FFmpeg executable not found in the extracted files');
      }
      
      // Make the file executable on non-Windows platforms
      if (process.platform !== 'win32') {
        await fs.chmod(ffmpegExe, 0o755);
      }
      
      // Clean up
      await fs.remove(extractDir);
    } else {
      // For Linux, extract the tar.xz file
      const extractDir = path.join(ffmpegDir, 'temp-extract');
      await fs.ensureDir(extractDir);
      
      // Extract the tar.xz file using tar command
      await execAsync(`tar -xf "${tempFile}" -C "${extractDir}"`);
      
      // Find the ffmpeg executable in the extracted directory
      const findFfmpeg = async (dir) => {
        const files = await fs.readdir(dir, { withFileTypes: true });
        
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          
          if (file.isDirectory()) {
            const found = await findFfmpeg(fullPath);
            if (found) return found;
          } else if (file.name === 'ffmpeg') {
            c.info(`Found FFmpeg at ${fullPath}`);
            return fullPath;
          }
        }
        
        return null;
      };
      
      // Try to find ffmpeg in the extracted directory
      const extractedFfmpeg = await findFfmpeg(extractDir);
      
      if (extractedFfmpeg) {
        // Copy the ffmpeg executable to the final location
        await fs.copy(extractedFfmpeg, ffmpegExe);
        c.info(`Copied ${extractedFfmpeg} to ${ffmpegExe}`);
      } else {
        c.error('Could not find FFmpeg executable in the extracted files');
        throw new Error('FFmpeg executable not found in the extracted files');
      }
      
      // Make the file executable
      await fs.chmod(ffmpegExe, 0o755);
      
      // Clean up
      await fs.remove(extractDir);
    }
    
    // Clean up the temporary file
    await fs.remove(tempFile);
    
    c.success('✓ FFmpeg extraction completed');
    
    // Verify the installation
    try {
      const { stdout } = await execAsync(`"${ffmpegExe}" -version`, { timeout: 5000 });
      c.success(`✓ FFmpeg verified: ${stdout.split('\n')[0]}`);
      return true;
    } catch (error) {
      c.error(`✗ FFmpeg verification failed: ${error.message}`);
      return false;
    }
  } catch (error) {
    c.error(`Error downloading FFmpeg: ${error.message}`);
    
    // Clean up any temporary files
    try {
      const tempFile = path.join(ffmpegDir, process.platform === 'win32' || process.platform === 'darwin' ? 'ffmpeg-temp.zip' : 'ffmpeg-temp.tar.xz');
      if (await fs.pathExists(tempFile)) {
        await fs.remove(tempFile);
      }
      
      const extractDir = path.join(ffmpegDir, 'temp-extract');
      if (await fs.pathExists(extractDir)) {
        await fs.remove(extractDir);
      }
    } catch (cleanupError) {
      c.error(`Error cleaning up temporary files: ${cleanupError.message}`);
    }
    
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  c.header('\n=== Playlistify Development Setup ===');
  c.info('This script checks and installs required dependencies for development.');
  c.divider();
  
  try {
    // Check yt-dlp
    const ytdlpResult = await checkYtDlp();
    
    // Check FFmpeg
    const ffmpegResult = await checkFFmpeg();
    
    // Summary of current state
    c.header('\n=== Current Status ===');
    c.info(`yt-dlp: ${ytdlpResult.installed ? 'Installed' : 'Not installed'}`);
    c.info(`FFmpeg: ${ffmpegResult.installed ? 'Installed' : 'Not installed'}`);
    c.divider();
    
    // Ask to install yt-dlp if not installed
    if (!ytdlpResult.installed) {
      c.prompt('yt-dlp is not installed. Would you like to install it now? (y/n) ');
      const installYtDlp = await question('');
      
      if (installYtDlp.toLowerCase() === 'y') {
        const ytdlpSuccess = await downloadYtDlp();
        if (ytdlpSuccess) {
          c.success('✓ yt-dlp installed successfully');
        } else {
          c.error('✗ yt-dlp installation failed');
        }
      } else {
        c.warning('⚠️ Skipping yt-dlp installation. Some features may not work properly.');
      }
    }
    
    // Ask to install FFmpeg if not installed
    if (!ffmpegResult.installed) {
      c.prompt('FFmpeg is not installed. Would you like to install it now? (y/n) ');
      const installFFmpeg = await question('');
      
      if (installFFmpeg.toLowerCase() === 'y') {
        const ffmpegSuccess = await downloadFFmpeg();
        if (ffmpegSuccess) {
          c.success('✓ FFmpeg installed successfully');
        } else {
          c.error('✗ FFmpeg installation failed');
        }
      } else {
        c.warning('⚠️ Skipping FFmpeg installation. Some features may not work properly.');
      }
    }
    
    // Final summary
    c.header('\n=== Setup Complete ===');
    c.info('You can now run the application with:');
    c.highlight('  npm start');
    c.divider();
    
    rl.close();
  } catch (error) {
    c.error(`Unhandled error: ${error.message}`);
    rl.close();
    process.exit(1);
  }
}

// Run the main function
main();
