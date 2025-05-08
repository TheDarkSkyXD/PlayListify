// PlayListify - yt-dlp setup script
// Downloads and installs yt-dlp into a project-local directory

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync, spawnSync } = require('child_process');
const { createWriteStream, existsSync, mkdirSync, chmodSync } = require('fs');
const { platform, arch } = process;

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

// Create a directory for yt-dlp in the project
const YTDLP_DIR = path.resolve(__dirname, 'ytdlp');
const BIN_DIR = path.join(YTDLP_DIR, 'bin');

// Get latest yt-dlp version URL based on platform
function getYtDlpBinaryUrl() {
  let binaryName;
  
  if (platform === 'win32') {
    binaryName = 'yt-dlp.exe';
  } else if (platform === 'darwin') {
    if (arch === 'arm64') {
      binaryName = 'yt-dlp_macos_arm64';
    } else {
      binaryName = 'yt-dlp_macos';
    }
  } else {
    // Linux and other platforms
    binaryName = 'yt-dlp';
  }
  
  return `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binaryName}`;
}

// Get the correct binary path based on platform
function getYtDlpBinaryPath() {
  if (platform === 'win32') {
    return path.join(BIN_DIR, 'yt-dlp.exe');
  } else {
    return path.join(BIN_DIR, 'yt-dlp');
  }
}

// Download a file from a URL to a destination path
function downloadFile(url, destinationPath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destinationPath);
    
    c.info(`Downloading from: ${url}`);
    c.info(`Saving to: ${destinationPath}`);
    
    https.get(url, response => {
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

// Check if yt-dlp is already installed in our project directory
function checkYtDlpInstalled() {
  const binaryPath = getYtDlpBinaryPath();
  return existsSync(binaryPath);
}

// Set executable permissions on Unix-based systems
function setExecutablePermissions(filePath) {
  if (platform !== 'win32') {
    try {
      c.step('Setting executable permissions...');
      chmodSync(filePath, '755');
      c.success('Permissions set successfully');
    } catch (error) {
      c.error(`Failed to set executable permissions: ${error.message}`);
      throw error;
    }
  }
}

// Verify the yt-dlp binary works correctly
async function verifyYtDlpInstallation() {
  const binaryPath = getYtDlpBinaryPath();
  
  c.step('Verifying yt-dlp installation...');
  
  try {
    // Run yt-dlp --version
    const result = spawnSync(binaryPath, ['--version'], {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (result.status === 0) {
      const version = result.stdout.trim();
      c.success(`yt-dlp installation verified (version: ${version})`);
      return true;
    } else {
      c.error('yt-dlp verification failed');
      c.error(`Error: ${result.stderr}`);
      return false;
    }
  } catch (error) {
    c.error(`yt-dlp verification failed: ${error.message}`);
    return false;
  }
}

// Prompt the user to install yt-dlp
function promptToInstall() {
  return new Promise(resolve => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n');
    console.log(`${colors.bright}${colors.yellow}╔══════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.yellow}║               YT-DLP INSTALLATION                ║${colors.reset}`);
    console.log(`${colors.bright}${colors.yellow}╚══════════════════════════════════════════════════╝${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}yt-dlp is required for PlayListify to download videos.${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}It will be installed in a local folder in this project.${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}Installation directory: ${YTDLP_DIR}${colors.reset}`);
    console.log('\n');
    
    c.ask('Do you want to install yt-dlp now? (y/n) ');
    
    readline.question('', answer => {
      readline.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

// Main installation function
async function installYtDlp() {
  try {
    // Create directories if they don't exist
    if (!existsSync(YTDLP_DIR)) {
      c.step('Creating yt-dlp directory...');
      mkdirSync(YTDLP_DIR, { recursive: true });
    }
    
    if (!existsSync(BIN_DIR)) {
      c.step('Creating bin directory...');
      mkdirSync(BIN_DIR, { recursive: true });
    }
    
    // Download yt-dlp
    const binaryUrl = getYtDlpBinaryUrl();
    const binaryPath = getYtDlpBinaryPath();
    
    c.step('Downloading yt-dlp...');
    await downloadFile(binaryUrl, binaryPath);
    
    // Set executable permissions
    setExecutablePermissions(binaryPath);
    
    // Verify installation
    const verified = await verifyYtDlpInstallation();
    
    if (verified) {
      c.success('yt-dlp has been successfully installed!');
      return true;
    } else {
      c.error('yt-dlp installation verification failed');
      return false;
    }
  } catch (error) {
    c.error(`Failed to install yt-dlp: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('\n');
  c.info('Checking if yt-dlp is already installed...');
  
  const isInstalled = checkYtDlpInstalled();
  
  if (isInstalled) {
    c.success('yt-dlp is already installed!');
    
    // Verify the existing installation
    const verified = await verifyYtDlpInstallation();
    
    if (verified) {
      return true;
    } else {
      c.warning('Existing yt-dlp installation seems to be corrupted.');
      const shouldInstall = await promptToInstall();
      
      if (shouldInstall) {
        return await installYtDlp();
      } else {
        c.error('yt-dlp is required for PlayListify. Canceling startup.');
        process.exit(10); // Special exit code for user rejection
      }
    }
  } else {
    c.info('yt-dlp is not installed.');
    const shouldInstall = await promptToInstall();
    
    if (shouldInstall) {
      return await installYtDlp();
    } else {
      c.error('yt-dlp is required for PlayListify. Canceling startup.');
      process.exit(10); // Special exit code for user rejection
    }
  }
}

// Run the main function
main().catch(error => {
  c.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 