// PlayListify - Development Environment Setup
// Configures a development environment for PlayListify

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const { existsSync, mkdirSync, writeFileSync } = require('fs');

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
  section: (emoji, text) => console.log(`${colors.bright}${colors.blue}${emoji} ${text}${colors.reset}\n${colors.dim}-----------------------------------------------${colors.reset}`)
};

// Project paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEP_INSTALL_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'install-dependencies.js');
const DEV_DATA_DIR = path.join(PROJECT_ROOT, 'dev-app-data');
const DEV_SETTINGS_FILE = path.join(DEV_DATA_DIR, 'dev-settings.json');
const YTDLP_DIR = path.join(PROJECT_ROOT, 'ytdlp');
const FFMPEG_DIR = path.join(PROJECT_ROOT, 'ffmpeg');

// Default development settings
const defaultDevSettings = {
  devMode: true,
  debugEnabled: true,
  ytdlpPath: path.join(YTDLP_DIR, 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'),
  ffmpegPath: path.join(FFMPEG_DIR, 'bin', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'),
  downloadLocation: path.join(DEV_DATA_DIR, 'downloads'),
  cacheLocation: path.join(DEV_DATA_DIR, 'cache'),
  logLevel: 'debug',
  concurrentDownloads: 3,
  useSystemDependencies: false
};

// Function to ensure dev directories exist
function createDevDirectories() {
  c.section('📂', 'CREATING DEVELOPMENT DIRECTORIES');
  
  const dirs = [
    DEV_DATA_DIR,
    path.join(DEV_DATA_DIR, 'downloads'),
    path.join(DEV_DATA_DIR, 'cache'),
    path.join(DEV_DATA_DIR, 'logs'),
    path.join(DEV_DATA_DIR, 'db')
  ];
  
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      c.step(`Creating directory: ${dir}`);
      mkdirSync(dir, { recursive: true });
      c.success(`Created directory: ${dir}`);
    } else {
      c.info(`Directory already exists: ${dir}`);
    }
  }
}

// Function to create development settings file
function createDevSettings() {
  c.section('⚙️', 'CONFIGURING DEVELOPMENT SETTINGS');
  
  if (!existsSync(DEV_SETTINGS_FILE)) {
    c.step('Creating development settings file...');
    
    try {
      writeFileSync(
        DEV_SETTINGS_FILE,
        JSON.stringify(defaultDevSettings, null, 2),
        'utf8'
      );
      c.success(`Development settings created at: ${DEV_SETTINGS_FILE}`);
    } catch (error) {
      c.error(`Failed to create development settings: ${error.message}`);
    }
  } else {
    c.info('Development settings file already exists');
    c.step('Updating development settings...');
    
    try {
      // Read existing settings
      const existingSettings = JSON.parse(fs.readFileSync(DEV_SETTINGS_FILE, 'utf8'));
      
      // Merge with default settings (keeping existing values)
      const updatedSettings = { ...defaultDevSettings, ...existingSettings };
      
      // Write back
      writeFileSync(
        DEV_SETTINGS_FILE,
        JSON.stringify(updatedSettings, null, 2),
        'utf8'
      );
      c.success('Development settings updated');
    } catch (error) {
      c.error(`Failed to update development settings: ${error.message}`);
    }
  }
}

// Function to verify Node.js version
function checkNodeVersion() {
  c.section('🔍', 'CHECKING NODE.JS VERSION');
  
  const nodeVersion = process.version;
  c.info(`Current Node.js version: ${nodeVersion}`);
  
  // Extract major version number
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  
  if (majorVersion < 14) {
    c.error('Node.js version 14 or higher is required for development');
    c.info('Please upgrade your Node.js installation');
    return false;
  }
  
  c.success('Node.js version check passed');
  return true;
}

// Function to install dependencies
function installDependencies() {
  c.section('📦', 'INSTALLING DEPENDENCIES');
  
  // First run npm install to ensure all node modules are installed
  c.step('Running npm install...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    c.success('npm dependencies installed');
  } catch (error) {
    c.error(`Failed to install npm dependencies: ${error.message}`);
    return false;
  }
  
  // Then run the dependency installation script
  c.step('Installing yt-dlp and FFmpeg...');
  try {
    const result = spawnSync('node', [DEP_INSTALL_SCRIPT], {
      stdio: 'inherit',
      shell: true
    });
    
    if (result.status !== 0) {
      c.error('Failed to install yt-dlp and FFmpeg');
      return false;
    }
    
    c.success('yt-dlp and FFmpeg installed successfully');
    return true;
  } catch (error) {
    c.error(`Error installing dependencies: ${error.message}`);
    return false;
  }
}

// Function to create a .env file for development
function createEnvFile() {
  c.section('🔑', 'CREATING .ENV FILE');
  
  const envPath = path.join(PROJECT_ROOT, '.env');
  
  if (!existsSync(envPath)) {
    c.step('Creating .env file for development...');
    
    const envContent = `# PlayListify Development Environment Variables
NODE_ENV=development
ELECTRON_DEV=true
ELECTRON_DEBUG=true
DEV_DATA_DIR=${DEV_DATA_DIR.replace(/\\/g, '\\\\')}
`;
    
    try {
      writeFileSync(envPath, envContent, 'utf8');
      c.success('Created .env file');
    } catch (error) {
      c.error(`Failed to create .env file: ${error.message}`);
    }
  } else {
    c.info('.env file already exists');
  }
}

// Function to display development environment info
function showDevEnvironmentInfo() {
  c.section('📊', 'DEVELOPMENT ENVIRONMENT INFO');
  
  c.info(`Node.js: ${process.version}`);
  c.info(`Platform: ${process.platform}`);
  c.info(`Architecture: ${process.arch}`);
  c.info(`Project Root: ${PROJECT_ROOT}`);
  c.info(`Dev Data Directory: ${DEV_DATA_DIR}`);
  
  if (existsSync(path.join(YTDLP_DIR, 'bin'))) {
    const isWindows = process.platform === 'win32';
    const ytdlpBinary = path.join(YTDLP_DIR, 'bin', isWindows ? 'yt-dlp.exe' : 'yt-dlp');
    
    if (existsSync(ytdlpBinary)) {
      try {
        const ytdlpVersion = execSync(`"${ytdlpBinary}" --version`, { encoding: 'utf8' }).trim();
        c.info(`yt-dlp: ${ytdlpVersion} (${ytdlpBinary})`);
      } catch (error) {
        c.info(`yt-dlp: Installed but version check failed (${ytdlpBinary})`);
      }
    } else {
      c.info(`yt-dlp: Not installed`);
    }
  }
  
  if (existsSync(path.join(FFMPEG_DIR, 'bin'))) {
    const isWindows = process.platform === 'win32';
    const ffmpegBinary = path.join(FFMPEG_DIR, 'bin', isWindows ? 'ffmpeg.exe' : 'ffmpeg');
    
    if (existsSync(ffmpegBinary)) {
      try {
        const ffmpegVersion = execSync(`"${ffmpegBinary}" -version`, { encoding: 'utf8' }).split('\n')[0];
        c.info(`FFmpeg: ${ffmpegVersion}`);
      } catch (error) {
        c.info(`FFmpeg: Installed but version check failed (${ffmpegBinary})`);
      }
    } else {
      c.info(`FFmpeg: Not installed`);
    }
  }
}

// Main function
async function main() {
  console.log('\n');
  console.log(`${colors.bright}${colors.green}╔══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.green}║       PLAYLISTIFY DEV ENVIRONMENT SETUP         ║${colors.reset}`);
  console.log(`${colors.bright}${colors.green}╚══════════════════════════════════════════════════╝${colors.reset}`);
  console.log('\n');
  
  // Check Node.js version
  if (!checkNodeVersion()) {
    process.exit(1);
  }
  
  // Create development directories
  createDevDirectories();
  
  // Install dependencies
  if (!installDependencies()) {
    c.error('Failed to install dependencies. Fix the issues above and try again.');
    process.exit(1);
  }
  
  // Create development settings
  createDevSettings();
  
  // Create .env file
  createEnvFile();
  
  // Show development environment info
  showDevEnvironmentInfo();
  
  console.log('\n');
  c.success('✅ Development environment setup completed!');
  c.info('You can now run the app in development mode with:');
  c.highlight('  npm run dev:with-deps');
  console.log('\n');
}

// Run the main function
main().catch(error => {
  c.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 