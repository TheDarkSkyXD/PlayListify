// PlayListify - FFmpeg setup script
// Downloads and installs FFmpeg into a project-local directory

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync, spawnSync } = require('child_process');
const { createWriteStream, existsSync, mkdirSync, chmodSync, unlinkSync } = require('fs');
const { platform, arch } = process;
const extract = require('extract-zip');  // You may need to install this: npm install extract-zip

// Terminal color codes for colorful output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper functions for colorful console output
const c = {
  success: text => console.log(`${colors.bright}${colors.green}✓ ${text}${colors.reset}`),
  error: text => console.log(`${colors.bright}${colors.red}✗ ${text}${colors.reset}`),
  info: text => console.log(`${colors.bright}${colors.cyan}ℹ ${text}${colors.reset}`),
  warning: text => console.log(`${colors.bright}${colors.yellow}⚠ ${text}${colors.reset}`),
  highlight: text => console.log(`${colors.bright}${colors.magenta}→ ${text}${colors.reset}`),
  step: text => console.log(`${colors.bright}${colors.blue}• ${text}${colors.reset}`),
  ask: text => console.log(`${colors.bright}${colors.yellow}? ${text}${colors.reset}`)
};

// Create a directory for FFmpeg in the project
const FFMPEG_DIR = path.resolve(__dirname, 'ffmpeg');
const BIN_DIR = path.join(FFMPEG_DIR, 'bin');
const TEMP_DIR = path.join(FFMPEG_DIR, 'temp');

// FFmpeg binary names based on platform
const getBinaryNames = () => {
  if (platform === 'win32') {
    return {
      ffmpeg: 'ffmpeg.exe',
      ffprobe: 'ffprobe.exe',
      ffplay: 'ffplay.exe'
    };
  } else {
    return {
      ffmpeg: 'ffmpeg',
      ffprobe: 'ffprobe',
      ffplay: 'ffplay'
    };
  }
};

// Get FFmpeg download URL based on platform and architecture
function getFFmpegUrl() {
  const version = '6.0'; // Update as needed for newer versions
  
  // Windows
  if (platform === 'win32') {
    return arch === 'x64' 
      ? `https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip`
      : `https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win32-gpl.zip`;
  }
  
  // macOS
  if (platform === 'darwin') {
    return arch === 'arm64'
      ? `https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip/arm64`
      : `https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip`;
  }
  
  // Linux
  return arch === 'x64'
    ? `https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz`
    : `https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-i686-static.tar.xz`;
}

// Download a file from a URL to a destination path
function downloadFile(url, destinationPath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destinationPath);
    
    c.info(`Downloading from: ${url}`);
    c.info(`Saving to: ${destinationPath}`);
    
    https.get(url, response => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        c.info(`Following redirect to: ${response.headers.location}`);
        downloadFile(response.headers.location, destinationPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download, status code: ${response.statusCode}`));
        return;
      }
      
      const contentLength = response.headers['content-length'];
      let downloadedBytes = 0;
      let lastLoggedPercent = -1;
      
      response.on('data', chunk => {
        downloadedBytes += chunk.length;
        
        if (contentLength) {
          const percent = Math.floor((downloadedBytes / contentLength) * 100);
          
          // Only log on percent change to reduce console spam
          if (percent % 10 === 0 && percent !== lastLoggedPercent) {
            process.stdout.write(`${colors.bright}${colors.cyan}   ↳ Download progress: ${percent}%${colors.reset}\r`);
            lastLoggedPercent = percent;
          }
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`${colors.bright}${colors.green}   ↳ Download completed: 100%${colors.reset}       `);
        resolve();
      });
      
      file.on('error', err => {
        fs.unlink(destinationPath, () => {}); // Delete the file on error
        reject(err);
      });
      
    }).on('error', err => {
      fs.unlink(destinationPath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Extracts the downloaded archive based on file type
async function extractArchive(archivePath, extractDir) {
  c.step(`Extracting archive: ${archivePath}`);
  
  // Create the extraction directory if it doesn't exist
  if (!existsSync(extractDir)) {
    mkdirSync(extractDir, { recursive: true });
  }
  
  try {
    if (archivePath.endsWith('.zip')) {
      // Handle ZIP files using extract-zip
      await extract(archivePath, { dir: extractDir });
    } else if (archivePath.endsWith('.tar.xz')) {
      // Handle tar.xz files (Linux)
      execSync(`tar -xf "${archivePath}" -C "${extractDir}"`, { stdio: 'inherit' });
    } else {
      throw new Error(`Unsupported archive format: ${archivePath}`);
    }
    
    c.success('Archive extracted successfully');
    return true;
  } catch (error) {
    c.error(`Failed to extract archive: ${error.message}`);
    return false;
  }
}

// Copy FFmpeg binaries to the bin directory
async function copyFFmpegBinaries(extractDir) {
  c.step('Copying FFmpeg binaries to bin directory...');
  
  try {
    const binNames = getBinaryNames();
    
    // Search for FFmpeg binaries in the extracted directory
    let ffmpegPath = '';
    let ffprobePath = '';
    let ffplayPath = '';
    
    // Different distributions have different directory structures
    // We need to find the binaries in the extracted files
    if (platform === 'win32') {
      // Windows usually has ffmpeg.exe in a bin folder
      const files = getAllFiles(extractDir);
      
      ffmpegPath = files.find(file => file.endsWith(binNames.ffmpeg));
      ffprobePath = files.find(file => file.endsWith(binNames.ffprobe));
      ffplayPath = files.find(file => file.endsWith(binNames.ffplay));
    } else if (platform === 'darwin') {
      // macOS typically just has the binary directly
      ffmpegPath = path.join(extractDir, binNames.ffmpeg);
      
      // For macOS, we might need to download ffprobe and ffplay separately
      // For now, we'll just check if ffmpeg exists
    } else {
      // Linux often has a structure with a directory named ffmpeg-*
      const dirs = fs.readdirSync(extractDir);
      const ffmpegDir = dirs.find(dir => dir.startsWith('ffmpeg'));
      
      if (ffmpegDir) {
        ffmpegPath = path.join(extractDir, ffmpegDir, binNames.ffmpeg);
        ffprobePath = path.join(extractDir, ffmpegDir, binNames.ffprobe);
        ffplayPath = path.join(extractDir, ffmpegDir, binNames.ffplay);
      }
    }
    
    // Create the bin directory if it doesn't exist
    if (!existsSync(BIN_DIR)) {
      mkdirSync(BIN_DIR, { recursive: true });
    }
    
    // Copy and set permissions for the binaries that we found
    if (ffmpegPath && existsSync(ffmpegPath)) {
      fs.copyFileSync(ffmpegPath, path.join(BIN_DIR, binNames.ffmpeg));
      c.success(`Copied ${binNames.ffmpeg} to bin directory`);
      
      if (platform !== 'win32') {
        chmodSync(path.join(BIN_DIR, binNames.ffmpeg), '755');
      }
    } else {
      c.warning(`Could not find ${binNames.ffmpeg} in the extracted files`);
    }
    
    if (ffprobePath && existsSync(ffprobePath)) {
      fs.copyFileSync(ffprobePath, path.join(BIN_DIR, binNames.ffprobe));
      c.success(`Copied ${binNames.ffprobe} to bin directory`);
      
      if (platform !== 'win32') {
        chmodSync(path.join(BIN_DIR, binNames.ffprobe), '755');
      }
    } else {
      c.warning(`Could not find ${binNames.ffprobe} in the extracted files`);
    }
    
    if (ffplayPath && existsSync(ffplayPath)) {
      fs.copyFileSync(ffplayPath, path.join(BIN_DIR, binNames.ffplay));
      c.success(`Copied ${binNames.ffplay} to bin directory`);
      
      if (platform !== 'win32') {
        chmodSync(path.join(BIN_DIR, binNames.ffplay), '755');
      }
    } else {
      c.warning(`Could not find ${binNames.ffplay} in the extracted files`);
    }
    
    return true;
  } catch (error) {
    c.error(`Failed to copy FFmpeg binaries: ${error.message}`);
    return false;
  }
}

// Recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}

// Clean up temporary files
function cleanupTempFiles(tempDir, archivePath) {
  c.step('Cleaning up temporary files...');
  
  try {
    if (existsSync(archivePath)) {
      unlinkSync(archivePath);
      c.success(`Removed temporary archive: ${archivePath}`);
    }
    
    if (existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      c.success(`Removed temporary directory: ${tempDir}`);
    }
    
    return true;
  } catch (error) {
    c.warning(`Failed to clean up temporary files: ${error.message}`);
    return false;
  }
}

// Check if FFmpeg is already installed in our project directory
function checkFFmpegInstalled() {
  const binNames = getBinaryNames();
  const ffmpegBinPath = path.join(BIN_DIR, binNames.ffmpeg);
  
  return existsSync(ffmpegBinPath);
}

// Verify the FFmpeg binary works correctly
async function verifyFFmpegInstallation() {
  const binNames = getBinaryNames();
  const ffmpegBinPath = path.join(BIN_DIR, binNames.ffmpeg);
  
  c.step('Verifying FFmpeg installation...');
  
  try {
    const result = spawnSync(ffmpegBinPath, ['-version'], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (result.status === 0) {
      const versionLine = result.stdout.split('\n')[0];
      c.success(`FFmpeg installation verified: ${versionLine}`);
      return true;
    } else {
      c.error('FFmpeg verification failed');
      c.error(`Error: ${result.stderr}`);
      return false;
    }
  } catch (error) {
    c.error(`FFmpeg verification failed: ${error.message}`);
    return false;
  }
}

// Prompt the user to install FFmpeg
function promptToInstall() {
  return new Promise(resolve => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n');
    console.log(`${colors.bright}${colors.yellow}╔══════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.yellow}║               FFMPEG INSTALLATION                ║${colors.reset}`);
    console.log(`${colors.bright}${colors.yellow}╚══════════════════════════════════════════════════╝${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}FFmpeg is required for PlayListify to process videos.${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}It will be installed in a local folder in this project.${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}Installation directory: ${FFMPEG_DIR}${colors.reset}`);
    console.log('\n');
    
    c.ask('Do you want to install FFmpeg now? (y/n) ');
    
    readline.question('', answer => {
      readline.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

// Main installation function
async function installFFmpeg() {
  try {
    // Create directories if they don't exist
    if (!existsSync(FFMPEG_DIR)) {
      c.step('Creating FFmpeg directory...');
      mkdirSync(FFMPEG_DIR, { recursive: true });
    }
    
    if (!existsSync(BIN_DIR)) {
      c.step('Creating bin directory...');
      mkdirSync(BIN_DIR, { recursive: true });
    }
    
    if (!existsSync(TEMP_DIR)) {
      c.step('Creating temp directory...');
      mkdirSync(TEMP_DIR, { recursive: true });
    }
    
    // Download FFmpeg
    const ffmpegUrl = getFFmpegUrl();
    const archiveExt = platform === 'win32' || platform === 'darwin' ? '.zip' : '.tar.xz';
    const archivePath = path.join(TEMP_DIR, `ffmpeg${archiveExt}`);
    
    c.step('Downloading FFmpeg...');
    await downloadFile(ffmpegUrl, archivePath);
    
    // Extract the archive
    const extractSuccess = await extractArchive(archivePath, TEMP_DIR);
    if (!extractSuccess) {
      throw new Error('Failed to extract FFmpeg archive');
    }
    
    // Copy the binaries to our bin directory
    const copySuccess = await copyFFmpegBinaries(TEMP_DIR);
    if (!copySuccess) {
      throw new Error('Failed to copy FFmpeg binaries');
    }
    
    // Clean up temporary files
    cleanupTempFiles(TEMP_DIR, archivePath);
    
    // Verify installation
    const verified = await verifyFFmpegInstallation();
    
    if (verified) {
      c.success('FFmpeg has been successfully installed!');
      return true;
    } else {
      c.error('FFmpeg installation verification failed');
      return false;
    }
  } catch (error) {
    c.error(`Failed to install FFmpeg: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('\n');
  c.info('Checking if FFmpeg is already installed...');
  
  const isInstalled = checkFFmpegInstalled();
  
  if (isInstalled) {
    c.success('FFmpeg is already installed!');
    
    // Verify the existing installation
    const verified = await verifyFFmpegInstallation();
    
    if (verified) {
      return true;
    } else {
      c.warning('Existing FFmpeg installation seems to be corrupted.');
      const shouldInstall = await promptToInstall();
      
      if (shouldInstall) {
        return await installFFmpeg();
      } else {
        c.warning('Some features may not work without FFmpeg.');
        return false;
      }
    }
  } else {
    c.info('FFmpeg is not installed.');
    const shouldInstall = await promptToInstall();
    
    if (shouldInstall) {
      return await installFFmpeg();
    } else {
      c.warning('Some features may not work without FFmpeg.');
      return false;
    }
  }
}

// Run the main function if this script is run directly
if (require.main === module) {
  main().catch(error => {
    c.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

// Export the functions for use in other scripts
module.exports = {
  checkFFmpegInstalled,
  verifyFFmpegInstallation,
  installFFmpeg
}; 