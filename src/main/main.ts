import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import { initYtDlp } from './services/ytDlpManager';
import { registerIpcHandlers } from './ipc/handlers';
import { initializeSettings } from './services/settingsManager';
import fs from 'fs-extra';

// Terminal color codes for better indicators
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground (text) colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Styled console output helpers
const c = {
  header: (text: string) => console.log(`${colors.bright}${colors.blue}${text}${colors.reset}`),
  success: (text: string) => console.log(`${colors.bright}${colors.green}${text}${colors.reset}`),
  warning: (text: string) => console.log(`${colors.bright}${colors.yellow}${text}${colors.reset}`),
  error: (text: string) => console.log(`${colors.bright}${colors.red}${text}${colors.reset}`),
  info: (text: string) => console.log(`${colors.white}${text}${colors.reset}`),
  divider: () => console.log(`${colors.dim}-----------------------------------------------${colors.reset}`),
  section: (emoji: string, text: string) => {
    console.log(`${colors.bright}${colors.cyan}${emoji} ${text}${colors.reset}`);
    console.log(`${colors.dim}-----------------------------------------------${colors.reset}`);
  }
};

let mainWindow: BrowserWindow | null = null;

// Ensure static assets folder for development
async function ensureDevAssets() {
  if (process.env.NODE_ENV === 'development') {
    // Create assets directory for development server - try multiple possible locations
    const devAssetsDirs = [
      path.join(process.cwd(), 'dist', 'assets', 'images'), 
      path.join(process.cwd(), '.webpack', 'renderer', 'assets', 'images'),
      path.join(process.cwd(), '.webpack', 'main', 'assets', 'images')
    ];
    
    // Copy default playlist image to all potential asset directories
    const srcImage = path.join(process.cwd(), 'public', 'assets', 'images', 'playlist-default.jpg');
    
    for (const dir of devAssetsDirs) {
      await fs.ensureDir(dir);
      const destImage = path.join(dir, 'playlist-default.jpg');
      
      if (await fs.pathExists(srcImage)) {
        await fs.copy(srcImage, destImage, { overwrite: true });
        console.log('Default playlist image copied to:', dir);
      } else {
        console.warn('Could not find default playlist image at:', srcImage);
      }
    }
    
    // Also, create the assets directory directly in the current working directory
    // as the dev server might serve from the root
    const rootAssetsDir = path.join(process.cwd(), 'assets', 'images');
    await fs.ensureDir(rootAssetsDir);
    const rootDestImage = path.join(rootAssetsDir, 'playlist-default.jpg');
    
    if (await fs.pathExists(srcImage)) {
      await fs.copy(srcImage, rootDestImage, { overwrite: true });
      console.log('Default playlist image copied to root assets folder');
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Set Content Security Policy to allow YouTube image domains
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' data:; " +
          "img-src 'self' data: https://* http://* blob:; " +
          "media-src 'self' https://* http://* blob:; " +
          "connect-src 'self' https://* http://* blob:; " +
          "font-src 'self' data:;"
        ]
      }
    });
  });

  // In development, load from the dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize the application
app.whenReady().then(async () => {
  // Initialize settings before creating window
  console.log('\n');
  c.section('🛠️', 'INITIALIZING ELECTRON APPLICATION');
  c.info('⚙️  Loading application settings...');
  initializeSettings();
  c.success('✅ Settings initialized successfully');
  
  // Ensure development assets
  c.info('\n📂 Checking development assets...');
  await ensureDevAssets();
  c.success('✅ Development assets verified');
  
  // Initialize yt-dlp - our setup script has already installed it if needed
  console.log('\n');
  c.section('🔌', 'INITIALIZING EXTERNAL DEPENDENCIES');
  try {
    // Check if there's a custom yt-dlp path
    const customYtDlpPath = path.join(process.cwd(), 'ytdlp', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    if (fs.existsSync(customYtDlpPath)) {
      c.info('🎬 yt-dlp: Custom installation detected');
      c.info(`📂 Path: ${customYtDlpPath}`);
      await initYtDlp(customYtDlpPath);
      c.success('✅ yt-dlp initialized successfully with custom binary');
    } else {
      c.info('🎬 yt-dlp: Using system installation');
      await initYtDlp();
      c.success('✅ yt-dlp initialized with system binary');
    }
  } catch (error) {
    c.error(`❌ yt-dlp initialization failed: ${error}`);
    c.warning('⚠️ YouTube features will be limited');
  }
  
  // Create the main window
  console.log('\n');
  c.section('🖥️', 'CREATING APPLICATION WINDOW');
  c.info('🔄 Preparing main application window...');
  createWindow();
  c.success('✅ Application window created successfully');
  
  // Register IPC handlers
  c.info('\n🔌 Setting up IPC communication...');
  registerIpcHandlers();
  c.success('✅ IPC handlers registered');
  
  console.log('\n');
  c.section('🎉', 'APPLICATION READY');
  c.success('✨ PlayListify is now running');
  c.info(`⏱️  Started at: ${new Date().toLocaleTimeString()}`);
  console.log('\n');

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 