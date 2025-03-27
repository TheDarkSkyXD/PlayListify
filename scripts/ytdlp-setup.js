// Node.js script to check and install yt-dlp before the app starts
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const readline = require('readline');
const YtDlpWrap = require('yt-dlp-wrap').default;

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
  section: (emoji, text) => {
    console.log(`${colors.bright}${colors.cyan}${emoji} ${text}${colors.reset}`);
    console.log(`${colors.dim}-----------------------------------------------${colors.reset}`);
  }
};

// Path to the yt-dlp installation directory
const YTDLP_DIR = path.join(process.cwd(), 'ytdlp');

/**
 * Create a readline interface for terminal input
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Check if yt-dlp is installed in the specified directory
 */
async function isYtDlpInstalled() {
  try {
    // Check if the ytdlp directory exists
    if (!await fs.pathExists(YTDLP_DIR)) {
      return false;
    }

    // Check if yt-dlp binary exists (platform specific)
    const binName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const ytDlpPath = path.join(YTDLP_DIR, binName);
    
    return await fs.pathExists(ytDlpPath);
  } catch (error) {
    console.error('Error checking for yt-dlp:', error);
    return false;
  }
}

/**
 * Get the path to the installed yt-dlp binary
 */
function getYtDlpPath() {
  const binName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  return path.join(YTDLP_DIR, binName);
}

/**
 * Install yt-dlp in the development environment
 */
async function installYtDlp() {
  try {
    // Create the ytdlp directory if it doesn't exist
    await fs.ensureDir(YTDLP_DIR);
    
    console.log('\n');
    c.section('📥', 'DOWNLOADING yt-dlp BINARY');
    c.info(`📁 Target location: ${YTDLP_DIR}`);
    
    // Define the binary name based on platform
    const binName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const ytDlpPath = path.join(YTDLP_DIR, binName);
    
    // Get the download URL based on platform
    let platformName = '';
    let downloadUrl = '';
    if (process.platform === 'win32') {
      platformName = 'Windows';
      downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    } else if (process.platform === 'darwin') {
      platformName = 'macOS';
      downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
    } else {
      platformName = 'Linux';
      downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
    }
    
    c.info(`🖥️  Detected platform: ${platformName}`);
    c.info(`🔗 Downloading from: ${downloadUrl}`);
    c.highlight(`⏳ Please wait, downloading in progress...`);
    
    // Start time for download
    const downloadStart = Date.now();
    
    // Use execAsync to download with curl
    if (process.platform === 'win32') {
      await execAsync(`curl -L "${downloadUrl}" -o "${ytDlpPath}"`);
    } else {
      await execAsync(`curl -L "${downloadUrl}" -o "${ytDlpPath}"`);
      // Make executable on Unix
      c.info('🔐 Setting executable permissions...');
      await execAsync(`chmod +x "${ytDlpPath}"`);
    }
    
    const downloadDuration = ((Date.now() - downloadStart) / 1000).toFixed(1);
    
    c.success(`✅ Download complete in ${downloadDuration} seconds`);
    console.log('\n');
    c.section('🔄', 'STEP 3/3: VERIFYING INSTALLATION');
    
    // Verify the file exists
    if (await fs.pathExists(ytDlpPath)) {
      const stats = await fs.stat(ytDlpPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      c.success('✅ Verification successful');
      c.info(`📊 File size: ${fileSizeMB} MB`);
      c.info(`📂 Installed to: ${ytDlpPath}`);
      return true;
    } else {
      c.error('❌ Verification failed - file not found after download');
      return false;
    }
  } catch (error) {
    console.log('\n');
    c.section('❌', 'INSTALLATION ERROR');
    c.error(`⚠️ Error details: ${error}`);
    
    return false;
  }
}

/**
 * Show a terminal prompt to ask the user if they want to install yt-dlp
 */
async function promptForInstall() {
  return new Promise((resolve) => {
    console.log('\n');
    c.section('❓', 'REQUIRED DEPENDENCY: INSTALL yt-dlp?');
    c.info('ℹ️ yt-dlp is required for PlayListify to work properly.');
    c.warning('ℹ️ The application will NOT start if you decline installation.');
    console.log('\n');
    c.success('  • Type "y" for YES - Install yt-dlp and start the app (Recommended)');
    c.error('  • Type "n" for NO - Cancel installation and exit');
    
    // Create readline interface
    const rl = createReadlineInterface();
    
    // Show the prompt and ask for input
    c.prompt('\n👉 Your choice (y/n): ');
    
    // Handle user input
    rl.on('line', (line) => {
      const input = line.trim().toLowerCase();
      
      if (input === 'y' || input === 'yes') {
        rl.close();
        c.success('\n🚀 STARTING INSTALLATION...');
        resolve(true);
      } else if (input === 'n' || input === 'no') {
        rl.close();
        c.warning('\n⏭️ Installation declined');
        c.error('🛑 Application startup will be canceled');
        resolve(false);
      } else {
        c.prompt('❌ Invalid input. Please enter "y" or "n": ');
      }
    });
  });
}

/**
 * Check for yt-dlp and install if needed
 */
async function setupYtDlp() {
  c.section('🔄', 'STEP 1/3: CHECKING ENVIRONMENT');
  c.info('🔍 Checking if yt-dlp is already installed...');
  
  // Check if yt-dlp is already installed
  if (await isYtDlpInstalled()) {
    console.log('\n');
    c.success('✅ SUCCESS: yt-dlp IS ALREADY INSTALLED');
    c.info(`📁 Location: ${getYtDlpPath()}`);
    c.info('⏩ Skipping installation step');
    console.log('\n');
    return true;
  }

  console.log('\n');
  c.section('⚠️', 'NOTICE: yt-dlp IS NOT INSTALLED');
  c.info('🎬 YouTube playlist support requires yt-dlp');
  c.warning('⚠️ The application will NOT start without yt-dlp');
  c.highlight('⌨️ USER INPUT REQUIRED - Please respond below:');
  
  // Ask user if they want to install via terminal
  const shouldInstall = await promptForInstall();
  
  if (shouldInstall) {
    console.log('\n');
    c.section('🔄', 'STEP 2/3: INSTALLATION PROCESS');
    
    const startTime = Date.now();
    const result = await installYtDlp();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (result) {
      console.log('\n');
      c.success('✅ SUCCESS: yt-dlp INSTALLATION COMPLETE');
      c.info(`⏱️  Completed in: ${duration} seconds`);
      c.info(`📁 Location: ${getYtDlpPath()}`);
      console.log('\n');
    } else {
      console.log('\n');
      c.error('❌ ERROR: yt-dlp INSTALLATION FAILED');
      c.error('🛑 Cannot proceed without yt-dlp');
      console.log('\n');
    }
    
    return result;
  } else {
    console.log('\n');
    c.error('🛑 INSTALLATION DECLINED BY USER');
    c.error('❌ Application cannot start without yt-dlp');
    console.log('\n');
  }
  
  return false;
}

// Run the setup process
(async function main() {
  try {
    // Clear terminal for better visibility
    console.clear();
    
    console.log('\n\n');
    c.header('🎵 =============================================');
    c.header('🎵 PLAYLISTIFY DEVELOPMENT ENVIRONMENT STARTUP');
    c.header('🎵 =============================================');
    c.info('✨ Starting initialization process...');
    c.info(`⏱️  Time: ${new Date().toLocaleTimeString()}`);
    console.log('\n');
    
    // Run the setup - if the user says no, we'll exit with a special code
    const setupResult = await setupYtDlp();
    
    // If user declined installation, exit with code 10
    if (setupResult === false) {
      console.log('\n');
      c.section('🛑', 'STARTUP HALTED: yt-dlp INSTALLATION DECLINED');
      c.info('ℹ️ The application requires yt-dlp to function properly.');
      c.info('ℹ️ Run "npm start" again to restart the setup process.');
      
      // Exit with special code 10 to indicate user declined installation
      process.exit(10);
    }
    
    // Success - app can continue starting
    console.log('\n');
    c.section('✅', 'DEPENDENCY CHECK COMPLETE');
    c.success('🚀 Proceeding to application startup...');
    
  } catch (error) {
    c.error('❌ Setup error:', error);
    // Exit with generic error
    process.exit(1);
  }
})(); 