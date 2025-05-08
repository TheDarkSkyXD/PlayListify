// PlayListify startup script
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const net = require('net'); // For port checking

// Track start time for performance measurement
const startTime = new Date();
let appLoadStartTime;
let rendererDevServerProcess; // Keep track of the dev server process

// Print the title banner
console.log('\n');
console.log(chalk.cyan('═════════════════════════════════════════════════'));
console.log(chalk.yellow('🚀 PLAYLISTIFY DEVELOPMENT STARTUP SEQUENCE'));
console.log(chalk.cyan('═════════════════════════════════════════════════'));
console.log(`${chalk.yellow('⏱️')} ${chalk.white('Start time:')} ${chalk.cyan(startTime.toLocaleTimeString())}`);
console.log('');

// Utility to print formatted messages
const print = {
  title: (text) => console.log(`\n\n═════════════════════════════════════════════════\n${chalk.cyan('🚀')} ${chalk.cyan.bold(text)}\n═════════════════════════════════════════════════`),
  subtitle: (text) => console.log(`\n${chalk.cyan.bold(text)}`),
  info: (text) => console.log(`${chalk.blue('ℹ️')} ${text}`),
  success: (text) => console.log(`${chalk.green('✅')} ${text}`),
  warning: (text) => console.log(`${chalk.yellow('⚠️')} ${text}`),
  error: (text) => console.log(`${chalk.red('❌')} ${text}`),
  devServer: (text) => console.log(`${chalk.magentaBright('[RendererDevServer]')} ${text}`)
};

function killProcess(proc) {
  if (proc) {
    print.info(`Attempting to kill process PID: ${proc.pid}`);
    if (process.platform === "win32") {
      try {
        execSync(`taskkill /PID ${proc.pid} /F /T`, { stdio: 'ignore' });
        print.success(`Process PID ${proc.pid} terminated.`);
      } catch (e) {
        print.warning(`Failed to kill process PID ${proc.pid} using taskkill: ${e.message}`);
      }
    } else {
      proc.kill('SIGKILL'); // Force kill
      print.success(`Sent SIGKILL to process PID ${proc.pid}.`);
    }
  }
}

// Simple cleanup function - just kill any running Electron processes
function killRunningElectron() {
  print.info('Checking for running Electron processes...');
  try {
    if (process.platform === 'win32') {
      try {
        execSync('taskkill /F /IM electron.exe /T', { stdio: 'ignore' });
        print.success('Killed running Electron processes via taskkill.');
      } catch (err) {
        // print.info('No Electron processes found running (or taskkill failed).');
      }
    } else { // darwin or linux
      try {
        execSync('pkill -f electron', { stdio: 'ignore' });
        print.success('Killed running Electron processes via pkill.');
      } catch (err) {
        // print.info('No Electron processes found running (or pkill failed).');
      }
    }
  } catch (err) {
    print.warning(`Could not check for running Electron processes: ${err.message}`);
  }
}

// Function to wait for the renderer dev server
function waitForRendererDevServer(port = 3000, timeout = 60000) {
  print.subtitle('Waiting for Renderer Dev Server to start...');
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkPort = () => {
      const client = net.createConnection({ port }, () => {
        client.end();
        print.success(`Renderer Dev Server is up on port ${port}!`);
        resolve();
      });
      client.on('error', (err) => {
        if (Date.now() - startTime > timeout) {
          print.error(`Timeout waiting for Renderer Dev Server on port ${port}.`);
          reject(new Error(`Timeout waiting for Renderer Dev Server on port ${port}: ${err.message}`));
        } else {
          // print.devServer(`Port ${port} not open yet, retrying...`);
          setTimeout(checkPort, 1000);
        }
      });
    };
    checkPort();
  });
}

// Main function
async function main() {
  try {
    // 1. Kill any running Electron processes and previous dev server
    killRunningElectron();
    if (rendererDevServerProcess) {
        print.info('Terminating previous renderer dev server instance...');
        killProcess(rendererDevServerProcess);
        rendererDevServerProcess = null;
    }

    // 2. Wait a moment to ensure processes are fully terminated
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Retrieve environment variables set by the npm script
    const electronEnv = {
      ...process.env,
      NODE_ENV: 'development',
      FORCE_NO_ASAR: 'true',
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
      ELECTRON_FORCE_IS_PACKAGED: 'false'
    };

    // 3. Run cleanup script before starting
    print.subtitle('Running cleanup script (cleanup.js)');
    try {
      execSync('node cleanup.js', { stdio: 'inherit', cwd: __dirname });
      print.success('Cleanup script completed');
    } catch (err) {
      print.warning(`Cleanup script encountered issues: ${err.message}`);
      print.info('Continuing startup anyway...');
    }

    // 4. Fix SQLite path if needed
    print.subtitle('Checking SQLite module (fix-sqlite-path.js)');
    const fixSqliteScriptPath = path.resolve(__dirname, 'fix-sqlite-path.js');
    if (fs.existsSync(fixSqliteScriptPath)) {
      try {
        execSync(`node "${fixSqliteScriptPath}"`, { stdio: 'inherit', cwd: __dirname });
        print.success('SQLite path fix script completed successfully');
      } catch (err) {
        print.warning(`SQLite fix script encountered issues: ${err.message}`);
        print.info('Continuing startup anyway...');
      }
    } else {
      print.warning('fix-sqlite-path.js not found, skipping SQLite fix.');
    }

    // 5. Start Renderer Webpack Dev Server
    print.title('STARTING RENDERER WEBPACK DEV SERVER');
    rendererDevServerProcess = spawn('npx', ['webpack', 'serve', '--config', 'webpack.renderer.config.js', '--mode', 'development'], {
      stdio: 'pipe', // 'inherit' can make it hard to see when it's ready
      shell: true,
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'development' }
    });

    rendererDevServerProcess.stdout.on('data', (data) => {
      print.devServer(data.toString().trim());
    });
    rendererDevServerProcess.stderr.on('data', (data) => {
      print.error(`[RendererDevServer ERR] ${data.toString().trim()}`);
    });
    rendererDevServerProcess.on('error', (err) => {
        print.error(`Failed to start Renderer Dev Server: ${err.message}`);
        if (rendererDevServerProcess) killProcess(rendererDevServerProcess);
        process.exit(1);
    });
     rendererDevServerProcess.on('close', (code) => {
        if (code !== 0 && code !== null) { // null if killed by us
            print.error(`Renderer Dev Server exited with code ${code}`);
            // We might not want to exit the whole script here if Electron hasn't started
        }
    });

    await waitForRendererDevServer(3000, 90000); // Wait up to 90 seconds

    // 6. Build the main process with Webpack
    print.title('BUILDING MAIN PROCESS WITH WEBPACK');
    try {
      print.info('Building main process (main.js and preload.js)...');
      execSync('npx webpack --config webpack.main.config.js --mode development', { stdio: 'inherit', cwd: __dirname });
      print.success('Main process built.');
    } catch (buildError) {
      print.error(`Webpack build for main process failed: ${buildError.message}`);
      if (rendererDevServerProcess) killProcess(rendererDevServerProcess);
      process.exit(1);
    }
    
    // (Renderer build is handled by dev server now, so removed the explicit build step for renderer)

    // 7. Verify build output exists (main and preload)
    print.subtitle('Verifying main process build output...');
    const mainPath = path.join(__dirname, '.webpack', 'main', 'main.js');
    const preloadPath = path.join(__dirname, '.webpack', 'main', 'preload.js');

    if (!fs.existsSync(mainPath)) {
      print.error(`Build output missing: ${mainPath}`);
      if (rendererDevServerProcess) killProcess(rendererDevServerProcess);
      process.exit(1);
    }
    if (!fs.existsSync(preloadPath)) {
      print.error(`Build output missing: ${preloadPath}`);
      if (rendererDevServerProcess) killProcess(rendererDevServerProcess);
      process.exit(1);
    }
    print.success('Main process build output verified (main.js, preload.js exist).');

    // 8. Launch Electron application directly
    print.title('STARTING ELECTRON APPLICATION');
    console.log(chalk.cyan('  (Loading renderer from Webpack Dev Server)'));
    console.log('\n' + chalk.yellow('⏳ Launching Electron process with verbose logging...\n'));
    
    appLoadStartTime = new Date();

    const electronArgs = [
      '.', 
      '--enable-logging',
      '--trace-warnings',
      // '--inspect=5858' // Can be re-enabled if needed
    ];

    const electronProcess = spawn('npx', ['electron', ...electronArgs], {
      env: electronEnv,
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });

    electronProcess.on('close', (code) => {
      const appLoadEndTime = new Date();
      const loadTimeMs = appLoadStartTime ? appLoadEndTime - appLoadStartTime : 0;
      const loadTimeSec = (loadTimeMs / 1000).toFixed(2);
      if (code === 0) {
        print.title('APPLICATION CLOSED');
        if (appLoadStartTime) {
          console.log(`${chalk.yellow('⚡')} ${chalk.white('App was running for:')} ${chalk.green(loadTimeSec + 's')}`);
        }
      } else {
        print.title('APPLICATION EXITED WITH ERROR');
        print.error(`Electron process exited with code: ${code}`);
        print.info('Check the console output above for more details.');
      }
      if (rendererDevServerProcess) {
        print.info('Shutting down Renderer Dev Server...');
        killProcess(rendererDevServerProcess);
      }
      process.exit(code);
    });

    electronProcess.on('error', (err) => {
        print.error(`Failed to start Electron process: ${err.message}`);
        if (rendererDevServerProcess) killProcess(rendererDevServerProcess);
        process.exit(1);
    });

  } catch (error) {
    print.title('STARTUP SCRIPT FAILED');
    print.error(error.message);
    if (rendererDevServerProcess) {
        killProcess(rendererDevServerProcess);
    }
    process.exit(1);
  }
}

// Graceful shutdown
function cleanupAndExit() {
  print.info('\nShutting down gracefully...');
  if (rendererDevServerProcess) {
    print.info('Terminating Renderer Dev Server...');
    killProcess(rendererDevServerProcess);
    rendererDevServerProcess = null;
  }
  // Kill main electron process too if it's running and we trapped the signal
  // This is harder to do reliably without tracking its PID globally
  killRunningElectron(); 
  print.success('Cleanup complete. Exiting.');
  process.exit(0);
}

process.on('SIGINT', cleanupAndExit); // Ctrl+C
process.on('SIGTERM', cleanupAndExit); // Kill command

// Run the main function
main().catch(error => {
  print.error('Unhandled error in main function:');
  console.error(error);
  if (rendererDevServerProcess) {
    killProcess(rendererDevServerProcess);
  }
  process.exit(1);
}); 