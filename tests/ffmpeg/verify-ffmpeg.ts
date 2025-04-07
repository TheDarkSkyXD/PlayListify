/**
 * FFmpeg Verification Script
 * 
 * This script verifies that FFmpeg is properly installed and working with yt-dlp.
 * It's a simpler alternative to complex unit tests and can be run manually.
 */
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

// Helper functions for colored console output
const c = {
  success: (text: string) => `${colors.green}${text}${colors.reset}`,
  error: (text: string) => `${colors.red}${text}${colors.reset}`,
  warn: (text: string) => `${colors.yellow}${text}${colors.reset}`,
  info: (text: string) => `${colors.cyan}${text}${colors.reset}`,
  header: (text: string) => `${colors.bright}${colors.cyan}${text}${colors.reset}`,
};

interface InstallationResult {
  installed: boolean;
  location?: 'system' | 'bundled';
  path?: string;
  error?: Error;
}

/**
 * Check if FFmpeg is installed
 */
async function checkFFmpeg(): Promise<InstallationResult> {
  console.log(c.header('\n=== Checking FFmpeg Installation ==='));
  
  try {
    // Check if FFmpeg is in the system PATH
    try {
      const { stdout } = await execAsync('ffmpeg -version', { timeout: 5000 });
      console.log(c.success('✓ FFmpeg is installed in the system PATH'));
      console.log(c.info(`  Version: ${stdout.split('\n')[0]}`));
      return { installed: true, location: 'system' };
    } catch (error) {
      console.log(c.warn('✗ FFmpeg is not installed in the system PATH'));
      
      // Check if FFmpeg is in the bundled location
      const ffmpegDir = path.join(process.cwd(), 'ffmpeg');
      const ffmpegExe = path.join(ffmpegDir, 'ffmpeg.exe');
      
      if (await fs.pathExists(ffmpegExe)) {
        try {
          const { stdout } = await execAsync(`"${ffmpegExe}" -version`, { timeout: 5000 });
          console.log(c.success(`✓ FFmpeg is installed in the bundled location: ${ffmpegExe}`));
          console.log(c.info(`  Version: ${stdout.split('\n')[0]}`));
          
          // Check file size
          const stats = await fs.stat(ffmpegExe);
          console.log(c.info(`  File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`));
          
          return { installed: true, location: 'bundled', path: ffmpegExe };
        } catch (error) {
          console.log(c.error(`✗ FFmpeg executable exists but failed to run: ${error instanceof Error ? error.message : String(error)}`));
        }
      } else {
        console.log(c.error(`✗ FFmpeg is not installed in the bundled location: ${ffmpegExe}`));
      }
    }
    
    return { installed: false };
  } catch (error) {
    console.log(c.error(`Error checking FFmpeg: ${error instanceof Error ? error.message : String(error)}`));
    return { installed: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Check if yt-dlp is installed
 */
async function checkYtDlp(): Promise<InstallationResult> {
  console.log(c.header('\n=== Checking yt-dlp Installation ==='));
  
  try {
    // Check if yt-dlp is in the bundled location
    const ytdlpDir = path.join(process.cwd(), 'ytdlp');
    const ytdlpExe = path.join(ytdlpDir, 'yt-dlp.exe');
    
    if (await fs.pathExists(ytdlpExe)) {
      try {
        const { stdout } = await execAsync(`"${ytdlpExe}" --version`, { timeout: 5000 });
        console.log(c.success(`✓ yt-dlp is installed in the bundled location: ${ytdlpExe}`));
        console.log(c.info(`  Version: ${stdout.trim()}`));
        return { installed: true, location: 'bundled', path: ytdlpExe };
      } catch (error) {
        console.log(c.error(`✗ yt-dlp executable exists but failed to run: ${error instanceof Error ? error.message : String(error)}`));
      }
    } else {
      console.log(c.error(`✗ yt-dlp is not installed in the bundled location: ${ytdlpExe}`));
      
      // Check if yt-dlp is in the system PATH
      try {
        const { stdout } = await execAsync('yt-dlp --version', { timeout: 5000 });
        console.log(c.success('✓ yt-dlp is installed in the system PATH'));
        console.log(c.info(`  Version: ${stdout.trim()}`));
        return { installed: true, location: 'system' };
      } catch (error) {
        console.log(c.warn('✗ yt-dlp is not installed in the system PATH'));
      }
    }
    
    return { installed: false };
  } catch (error) {
    console.log(c.error(`Error checking yt-dlp: ${error instanceof Error ? error.message : String(error)}`));
    return { installed: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Test FFmpeg and yt-dlp integration
 */
async function testIntegration(ffmpeg: InstallationResult, ytdlp: InstallationResult): Promise<boolean> {
  console.log(c.header('\n=== Testing FFmpeg and yt-dlp Integration ==='));
  
  if (!ffmpeg.installed || !ytdlp.installed) {
    console.log(c.error('✗ Cannot test integration because FFmpeg or yt-dlp is not installed'));
    return false;
  }
  
  try {
    // Construct the command based on the installation locations
    const ffmpegPath = ffmpeg.location === 'system' ? 'ffmpeg' : ffmpeg.path;
    const ytdlpPath = ytdlp.location === 'system' ? 'yt-dlp' : ytdlp.path;
    
    if (!ffmpegPath || !ytdlpPath) {
      console.log(c.error('✗ Cannot test integration because FFmpeg or yt-dlp path is missing'));
      return false;
    }
    
    // Test the integration by listing formats for a video
    const command = `"${ytdlpPath}" --ffmpeg-location "${ffmpegPath}" --list-formats "https://www.youtube.com/watch?v=jNQXAC9IVRw"`;
    console.log(c.info(`Running command: ${command}`));
    
    const { stdout } = await execAsync(command, { timeout: 15000 });
    
    // Check if the output contains format information
    if (stdout.includes('format code') && stdout.includes('resolution')) {
      console.log(c.success('✓ yt-dlp successfully used FFmpeg to get format information'));
      
      // Show a sample of the output
      const outputLines = stdout.split('\n');
      const formatLines = outputLines.filter(line => line.includes('format code') || line.match(/^\d+/));
      console.log(c.info('  Sample of available formats:'));
      formatLines.slice(0, 5).forEach(line => console.log(`  ${line}`));
      
      return true;
    } else {
      console.log(c.error('✗ yt-dlp integration test failed - no format information found'));
      console.log(c.info('  Output:'));
      console.log(stdout.split('\n').slice(0, 10).join('\n'));
      return false;
    }
  } catch (error) {
    console.log(c.error(`✗ Error testing integration: ${error instanceof Error ? error.message : String(error)}`));
    if (error instanceof Error && 'stderr' in error) {
      console.log(c.error(`  Error output: ${(error as any).stderr}`));
    }
    return false;
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log(c.header('\n=== FFmpeg Verification Script ==='));
  console.log('This script verifies that FFmpeg is properly installed and working with yt-dlp.\n');
  
  try {
    // Check FFmpeg
    const ffmpeg = await checkFFmpeg();
    
    // Check yt-dlp
    const ytdlp = await checkYtDlp();
    
    // Test integration
    const integrationSuccess = await testIntegration(ffmpeg, ytdlp);
    
    // Summary
    console.log(c.header('\n=== Verification Summary ==='));
    console.log(`FFmpeg: ${ffmpeg.installed ? c.success('INSTALLED') : c.error('NOT INSTALLED')}`);
    console.log(`yt-dlp: ${ytdlp.installed ? c.success('INSTALLED') : c.error('NOT INSTALLED')}`);
    console.log(`Integration: ${integrationSuccess ? c.success('WORKING') : c.error('NOT WORKING')}`);
    
    if (ffmpeg.installed && ytdlp.installed && integrationSuccess) {
      console.log(c.success('\n✓ All components are installed and working correctly!'));
      console.log(c.info('  You should be able to download videos with the correct quality.'));
    } else {
      console.log(c.error('\n✗ There are issues with the installation or integration.'));
      console.log(c.info('  Please check the logs above for details.'));
      
      if (!ffmpeg.installed) {
        console.log(c.info('  - FFmpeg is not installed. The application will try to download it automatically when needed.'));
      }
      
      if (!ytdlp.installed) {
        console.log(c.info('  - yt-dlp is not installed. Run "npm run install:ytdlp" to install it.'));
      }
      
      if (ffmpeg.installed && ytdlp.installed && !integrationSuccess) {
        console.log(c.info('  - FFmpeg and yt-dlp are installed but not working together. This might be a path issue.'));
      }
    }
    
    process.exit(ffmpeg.installed && ytdlp.installed && integrationSuccess ? 0 : 1);
  } catch (error) {
    console.log(c.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}

// Run the main function
main();
