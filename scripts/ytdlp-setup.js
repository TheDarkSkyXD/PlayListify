// Node.js script to check and install yt-dlp before the app starts
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const readline = require('readline');
const YtDlpWrap = require('yt-dlp-wrap').default;

const execAsync = promisify(exec);

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
    
    console.log('\n\n');
    console.log('📥 INSTALLING yt-dlp');
    console.log(`📁 Location: ${YTDLP_DIR}`);
    console.log('⏳ Please wait, downloading binary...');
    
    // Define the binary name based on platform
    const binName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const ytDlpPath = path.join(YTDLP_DIR, binName);
    
    // Download manually with fetch
    const ytDlpWrap = new YtDlpWrap();
    
    // Get the download URL based on platform
    let downloadUrl = '';
    if (process.platform === 'win32') {
      downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    } else if (process.platform === 'darwin') {
      downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
    } else {
      downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
    }
    
    console.log(`Downloading from: ${downloadUrl}`);
    
    // Use execAsync to download with curl or wget
    if (process.platform === 'win32') {
      await execAsync(`curl -L "${downloadUrl}" -o "${ytDlpPath}"`);
    } else {
      await execAsync(`curl -L "${downloadUrl}" -o "${ytDlpPath}"`);
      // Make executable on Unix
      await execAsync(`chmod +x "${ytDlpPath}"`);
    }
    
    console.log('\n');
    console.log('✅ yt-dlp INSTALLATION SUCCESSFUL');
    console.log(`📁 Location: ${getYtDlpPath()}`);
    
    return true;
  } catch (error) {
    console.log('\n');
    console.log('❌ yt-dlp INSTALLATION FAILED');
    console.log(`⚠️ Error: ${error}`);
    
    return false;
  }
}

/**
 * Show a terminal prompt to ask the user if they want to install yt-dlp
 */
async function promptForInstall() {
  return new Promise((resolve) => {
    console.log('\n');
    console.log('⚠️ yt-dlp IS NOT INSTALLED');
    console.log('🎬 This tool is needed for YouTube playlists in PlayListify');
    
    // Create readline interface
    const rl = createReadlineInterface();
    
    // Show the prompt and ask for input
    process.stdout.write('❓ Would you like to install yt-dlp now? (y/n): ');
    
    // Handle user input
    rl.on('line', (line) => {
      const input = line.trim().toLowerCase();
      
      if (input === 'y' || input === 'yes') {
        rl.close();
        console.log('\n🚀 Installing yt-dlp...');
        resolve(true);
      } else if (input === 'n' || input === 'no') {
        rl.close();
        console.log('\n⏭️ Installation skipped');
        console.log('⚠️ App will have limited functionality without yt-dlp');
        resolve(false);
      } else {
        process.stdout.write('❌ Invalid input. Please enter y or n: ');
      }
    });
  });
}

/**
 * Check for yt-dlp and install if needed
 */
async function setupYtDlp() {
  console.log('\n');
  console.log('🔍 CHECKING FOR yt-dlp BEFORE STARTING PLAYLISTIFY');
  console.log('🔍 Checking if yt-dlp is installed...');
  
  // Check if yt-dlp is already installed
  if (await isYtDlpInstalled()) {
    console.log('\n');
    console.log('✅ yt-dlp IS ALREADY INSTALLED');
    console.log(`📁 Location: ${getYtDlpPath()}`);
    return true;
  }

  console.log('\n');
  console.log('❌ yt-dlp IS NOT INSTALLED');
  console.log('⌨️ TERMINAL INPUT REQUIRED');
  
  // Ask user if they want to install via terminal
  const shouldInstall = await promptForInstall();
  
  if (shouldInstall) {
    const result = await installYtDlp();
    
    if (result) {
      console.log('\n');
      console.log('✅ yt-dlp INSTALLATION SUCCEEDED');
      console.log('🚀 Starting PlayListify...');
    } else {
      console.log('\n');
      console.log('❌ yt-dlp INSTALLATION FAILED');
      console.log('⚠️ App functionality will be limited');
      console.log('🚀 Starting PlayListify anyway...');
    }
    
    return result;
  } else {
    console.log('\n');
    console.log('⏭️ yt-dlp INSTALLATION SKIPPED');
    console.log('⚠️ YouTube features will be unavailable');
    console.log('🚀 Starting PlayListify anyway...');
  }
  
  return false;
}

// Run the setup process
(async function main() {
  try {
    // Clear terminal for better visibility
    console.clear();
    
    console.log('🎵 PLAYLISTIFY DEV STARTUP 🎵');
    console.log('--------------------------------');
    
    // Run the setup
    await setupYtDlp();
    
  } catch (error) {
    console.error('❌ Setup error:', error);
    console.log('🚀 Starting PlayListify anyway...');
  }
})(); 