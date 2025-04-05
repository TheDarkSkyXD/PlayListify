import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BrowserWindow } from 'electron';
import YtDlpWrap from 'yt-dlp-wrap';
import readline from 'readline';

const execAsync = promisify(exec);

// Path to the yt-dlp installation directory
const YTDLP_DIR = path.join(process.cwd(), 'ytdlp');

/**
 * Check if yt-dlp is installed in the specified directory
 */
export async function isYtDlpInstalled(): Promise<boolean> {
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
export function getYtDlpPath(): string {
  const binName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  return path.join(YTDLP_DIR, binName);
}

/**
 * Create a readline interface for terminal input
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Install yt-dlp in the development environment
 */
export async function installYtDlp(): Promise<boolean> {
  try {
    // Create the ytdlp directory if it doesn't exist
    await fs.ensureDir(YTDLP_DIR);
    
    console.log('\n\n');
    console.log('📥 INSTALLING yt-dlp');
    console.log(`📁 Location: ${YTDLP_DIR}`);
    console.log('⏳ Please wait, downloading binary...');
    
    // Use yt-dlp-wrap to download the binary for the current platform
    await YtDlpWrap.downloadFromGithub(YTDLP_DIR);
    
    // Make the file executable on Unix platforms
    if (process.platform !== 'win32') {
      const ytDlpPath = path.join(YTDLP_DIR, 'yt-dlp');
      await execAsync(`chmod +x "${ytDlpPath}"`);
    }
    
    console.log('\n\n');
    console.log('✅ yt-dlp INSTALLATION SUCCESSFUL');
    console.log(`📁 Location: ${getYtDlpPath()}`);
    
    return true;
  } catch (error) {
    console.log('\n\n');
    console.log('❌ yt-dlp INSTALLATION FAILED');
    console.log(`⚠️ Error: ${error}`);
    
    return false;
  }
}

/**
 * Show a terminal prompt to ask the user if they want to install yt-dlp
 */
export async function promptForInstall(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    // Force console output to flush
    console.log('\n\n');
    console.log('⚠️ yt-dlp IS NOT INSTALLED');
    console.log('🎬 This tool is needed for YouTube playlists');
    
    // Create readline interface
    const rl = createReadlineInterface();
    
    // Show the prompt and ask for input
    // Using process.stdout.write here for the prompt line only
    process.stdout.write('❓ Would you like to install yt-dlp now? (y/n): ');
    
    // Handle user input
    rl.on('line', (line) => {
      const input = line.trim().toLowerCase();
      
      if (input === 'y' || input === 'yes') {
        rl.close();
        console.log('\n🚀 Installing yt-dlp...\n');
        resolve(true);
      } else if (input === 'n' || input === 'no') {
        rl.close();
        console.log('\n⏭️ Installation skipped');
        console.log('⚠️ App will have limited functionality without yt-dlp');
        resolve(false);
      } else {
        // For repeated prompts, use stdout.write to keep on same line
        process.stdout.write('❌ Invalid input. Please enter y or n: ');
      }
    });
  });
}

/**
 * Check for yt-dlp and install if needed
 */
export async function setupYtDlp(): Promise<boolean> {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') {
    return true;
  }
  
  console.log('\n\n');
  console.log('🔍 DEVELOPMENT MODE - CHECKING FOR yt-dlp');
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
    } else {
      console.log('\n');
      console.log('❌ yt-dlp INSTALLATION FAILED');
      console.log('⚠️ App functionality will be limited');
    }
    
    return result;
  } else {
    console.log('\n');
    console.log('⏭️ yt-dlp INSTALLATION SKIPPED');
    console.log('⚠️ YouTube features will be unavailable');
  }
  
  return false;
} 