// PlayListify startup script
const { execSync, spawnSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const stripAnsi = str => str.replace(/\u001b\[\d+m/g, '');

// Track start time for performance measurement
const startTime = new Date();
let appLoadStartTime;

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

// Helper functions for color formatting
function colorize(color, text) {
  return `${color}${text}${colors.reset}`;
}

// Colorize function wrappers
const colorFuncs = {
  red: (text) => colorize(colors.red, text),
  green: (text) => colorize(colors.green, text),
  yellow: (text) => colorize(colors.yellow, text),
  blue: (text) => colorize(colors.blue, text),
  magenta: (text) => colorize(colors.magenta, text),
  cyan: (text) => colorize(colors.cyan, text),
  white: (text) => colorize(colors.white, text),
  dim: (text) => colorize(colors.dim, text),
  bright: {
    red: (text) => colorize(colors.bright + colors.red, text),
    green: (text) => colorize(colors.bright + colors.green, text),
    yellow: (text) => colorize(colors.bright + colors.yellow, text),
    blue: (text) => colorize(colors.bright + colors.blue, text),
    magenta: (text) => colorize(colors.bright + colors.magenta, text),
    cyan: (text) => colorize(colors.bright + colors.cyan, text),
    white: (text) => colorize(colors.bright + colors.white, text)
  }
};

// Styled console output helpers
const c = {
  header: (text) => console.log(colorFuncs.bright.magenta(text)),
  subheader: (text) => console.log(colorFuncs.bright.blue(text)),
  success: (text) => console.log(colorFuncs.bright.green(text)),
  warning: (text) => console.log(colorFuncs.bright.yellow(text)),
  error: (text) => console.log(colorFuncs.bright.red(text)),
  info: (text) => {
    if (text.includes('This process compiles')) {
      // Make this message more prominent
      console.log(`${colorFuncs.bright.cyan('🔧')} ${colorFuncs.bright.white(text)}`);
    } else if (text.includes('Checking if yt-dlp')) {
      // Make yt-dlp check message more visible
      console.log(`${colorFuncs.bright.yellow('🔍')} ${colorFuncs.bright.cyan(text.replace('🔍 ', ''))}`);
    } else {
      // Default info styling
      console.log(colorFuncs.white(text));
    }
  },
  highlight: (text) => console.log(colorFuncs.bright.yellow(text)),
  divider: () => console.log(colorFuncs.dim('-----------------------------------------------')),
  section: (emoji, text) => {
    console.log(colorFuncs.bright.blue(`${emoji} ${text}`));
    console.log(colorFuncs.dim('-----------------------------------------------'));
  }
};

// Get the absolute path to the setup scripts
const ytdlpSetupScriptPath = path.resolve(__dirname, 'ytdlp-setup.js');
const depsSetupScriptPath = path.resolve(__dirname, 'setup-dependencies.js');

console.log('\n');
console.log(colorFuncs.bright.cyan('═════════════════════════════════════════════════'));
console.log(colorFuncs.bright.yellow('🚀 PLAYLISTIFY DEVELOPMENT STARTUP SEQUENCE'));
console.log(colorFuncs.bright.cyan('═════════════════════════════════════════════════'));
console.log(`${colorFuncs.bright.yellow('⏱️')} ${colorFuncs.bright.white('Start time:')} ${colorFuncs.bright.cyan(startTime.toLocaleTimeString())}`);
console.log('');

// Create a function to make the yt-dlp check more visible when directly displayed
function enhanceYtDlpCheck() {
  // Find and enhance all instances of "Checking if yt-dlp is already installed..."
  const originalConsoleLog = console.log;
  console.log = function() {
    const args = Array.from(arguments);
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Checking if yt-dlp')) {
      // Replace with colorful version
      const message = args[0].replace('🔍 ', '');
      originalConsoleLog(`${colors.bright}${colors.bgYellow}${colors.black} YT-DLP CHECK ${colors.reset}`);
      originalConsoleLog(`${colors.bright}${colors.yellow}🔍 ${colors.bright}${colors.cyan}${message}${colors.reset}`);
    } else {
      originalConsoleLog.apply(console, args);
    }
  };

  // Restore after 5 seconds (by then the message would have been displayed)
  setTimeout(() => {
    console.log = originalConsoleLog;
  }, 5000);
}

// Get task-specific styles based on task type
function getTaskStyles(taskType) {
  let taskIcon = '📋';
  let taskColor = colorFuncs.bright.white;

  // Assign icons and colors based on task types
  switch(taskType.toLowerCase()) {
    case 'checking':
      taskIcon = '🔍';
      taskColor = colorFuncs.bright.cyan;
      break;
    case 'compiling':
      taskIcon = '🔨';
      taskColor = colorFuncs.bright.red;
      break;
    case 'launching':
      taskIcon = '🚀';
      taskColor = colorFuncs.bright.green;
      break;
    case 'locating':
      taskIcon = '🔎';
      taskColor = colorFuncs.bright.magenta;
      break;
    case 'loading':
      taskIcon = '📦';
      taskColor = colorFuncs.bright.magenta;
      break;
    case 'preparing':
      taskIcon = '🛠️';
      taskColor = colorFuncs.bright.cyan;
      break;
    case 'running':
      taskIcon = '⚡';
      taskColor = colorFuncs.bright.yellow;
      break;
    case 'complete':
    case 'finished':
    case 'done':
      taskIcon = '✓';
      taskColor = colorFuncs.bright.green;
      break;
    default:
      // Check for common substrings in the task name
      if (taskType.includes('webpack')) {
        taskIcon = '📦';
        taskColor = colorFuncs.bright.yellow;
      } else if (taskType.includes('launch')) {
        taskIcon = '🚀';
        taskColor = colorFuncs.bright.green;
      } else if (taskType.includes('compile')) {
        taskIcon = '🔨';
        taskColor = colorFuncs.bright.red;
      } else if (taskType.includes('check')) {
        taskIcon = '🔍';
        taskColor = colorFuncs.bright.cyan;
      } else if (taskType.includes('success') || taskType.includes('complete') || taskType.includes('finish')) {
        taskIcon = '✓';
        taskColor = colorFuncs.bright.green;
      }
  }

  return { taskIcon, taskColor };
}

// Call this function early
enhanceYtDlpCheck();

// Main function - now async
async function main() {
  try {
    console.log('\n');

    // Create colorful header with gradient effect
    const colors1 = [colors.red, colors.yellow, colors.green, colors.cyan, colors.blue, colors.magenta];
    const colors2 = [colors.yellow, colors.green, colors.cyan, colors.blue, colors.magenta, colors.red];

    // Print top border with gradient
    process.stdout.write('  ');
    for (let i = 0; i < 45; i++) {
      const colorIndex = Math.floor(i / 8) % colors1.length;
      process.stdout.write(`${colors.bright}${colors1[colorIndex]}═${colors.reset}`);
    }
    process.stdout.write('\n');

    // Print title with bright colors
    console.log(`  ${colors.bright}${colors.yellow}🚀 ${colors.bright}${colors.white}P${colors.cyan}L${colors.green}A${colors.yellow}Y${colors.magenta}L${colors.blue}I${colors.red}S${colors.cyan}T${colors.green}I${colors.yellow}F${colors.magenta}Y${colors.reset} ${colors.bright}${colors.white}DEVELOPMENT STARTUP${colors.reset}`);

    // Print bottom border with reverse gradient
    process.stdout.write('  ');
    for (let i = 0; i < 45; i++) {
      const colorIndex = Math.floor(i / 8) % colors2.length;
      process.stdout.write(`${colors.bright}${colors2[colorIndex]}═${colors.reset}`);
    }

    // Time information
    console.log('\n');
    process.stdout.write(`  ${colors.bright}${colors.yellow}⏱️  ${colors.bright}${colors.white}Start time: ${colors.reset}`);
    process.stdout.write(`${colors.bright}${colors.cyan}${startTime.toLocaleTimeString()}${colors.reset}\n\n`);

    // Check if the setup scripts exist
    if (!fs.existsSync(ytdlpSetupScriptPath) && !fs.existsSync(depsSetupScriptPath)) {
      c.error('\n❌ ERROR: No setup scripts found');
      c.error(`📂 Expected paths: ${ytdlpSetupScriptPath} or ${depsSetupScriptPath}`);
      throw new Error('Setup scripts not found');
    }

    c.section('📋', 'STEP 1/4: SQLITE CHECK');
    c.info(`🔍 Checking SQLite module...`);

    // Run the fix-sqlite-path script
    try {
      const fixSqliteScriptPath = path.resolve(__dirname, 'fix-sqlite-path.js');
      if (fs.existsSync(fixSqliteScriptPath)) {
        c.info(`🔧 Running SQLite fix script: ${fixSqliteScriptPath}`);
        const fixSqliteProcess = spawnSync('node', [fixSqliteScriptPath], {
          stdio: 'inherit',
          encoding: 'utf-8'
        });

        if (fixSqliteProcess.status !== 0) {
          c.warning(`⚠️ SQLite fix script exited with code ${fixSqliteProcess.status}`);
          c.info(`ℹ️ Continuing with startup...`);
        } else {
          c.success(`✅ SQLite module path fixed successfully`);
        }
      } else {
        c.warning(`⚠️ SQLite fix script not found at ${fixSqliteScriptPath}`);
        c.info(`ℹ️ Continuing with startup...`);
      }
    } catch (error) {
      c.warning(`⚠️ Error running SQLite fix script: ${error.message}`);
      c.info(`ℹ️ Continuing with startup...`);
    }

    console.log('\n');
    c.section('📋', 'STEP 2/4: YT-DLP CHECK');
    c.info(`🔍 Running yt-dlp setup script: ${ytdlpSetupScriptPath}`);

    // Use spawnSync instead of execSync to get exit code
    const ytdlpSetupProcess = spawnSync('node', [ytdlpSetupScriptPath], {
      stdio: 'inherit',
      encoding: 'utf-8'
    });

    // Check the exit code
    if (ytdlpSetupProcess.status === 10) {
      // User declined installation, do not start the app
      console.log('\n');
      c.section('🚫', 'APPLICATION STARTUP CANCELED');
      c.info('ℹ️ The application requires yt-dlp to function properly.');
      c.info('ℹ️ Run "npm start" again when you are ready to install yt-dlp.');
      process.exit(0);
    } else if (ytdlpSetupProcess.status !== 0) {
      // Other error occurred
      throw new Error(`yt-dlp setup script failed with code ${ytdlpSetupProcess.status}`);
    }

    console.log('\n');
    c.section('📋', 'STEP 3/4: FFMPEG CHECK');
    c.info(`🔍 Running dependencies setup script: ${depsSetupScriptPath}`);

    // Only run the dependencies setup script if it exists
    if (fs.existsSync(depsSetupScriptPath)) {
      // Use spawnSync to run the dependencies setup script
      const depsSetupProcess = spawnSync('node', [depsSetupScriptPath], {
        stdio: 'inherit',
        encoding: 'utf-8'
      });

      // Check the exit code
      if (depsSetupProcess.status !== 0) {
        // Error occurred but we can continue
        c.warning(`\n⚠️ Dependencies setup script exited with code ${depsSetupProcess.status}`);
        c.info('ℹ️ Continuing with startup, but some features may not work properly.');
      }
    } else {
      c.warning(`\n⚠️ Dependencies setup script not found at ${depsSetupScriptPath}`);
      c.info('ℹ️ Continuing with startup, but some features may not work properly.');
    }

    // If we get here, the setup was successful
    console.log('\n');
    c.section('📋', 'STEP 4/4: ELECTRON APPLICATION STARTUP');

    // These messages are now more colorful with icons and spacing
    console.log('');
    process.stdout.write(`${colors.bright}${colors.green}⚡ ${colors.bright}${colors.white}Launching Electron Application${colors.reset}\n\n`);
    appLoadStartTime = new Date(); // Track when app loading starts

    const steps = [
      {
        icon: '🖥️',
        text: 'Main Process',
        desc: 'Starting core application components',
        labelColor: colors.cyan,
        descColor: colors.green
      },
      {
        icon: '🌐',
        text: 'Renderer Process',
        desc: 'Loading UI components and views',
        labelColor: colors.magenta,
        descColor: colors.yellow
      },
      {
        icon: '🔌',
        text: 'IPC Bridge',
        desc: 'Initializing communication channels',
        labelColor: colors.blue,
        descColor: colors.cyan
      },
      {
        icon: '🎨',
        text: 'Asset Pipeline',
        desc: 'Processing styles and resources',
        labelColor: colors.yellow,
        descColor: colors.magenta
      }
    ];

    // Display steps with colorful formatting - each step has its own unique colors
    steps.forEach(step => {
      // Icon with bright yellow
      process.stdout.write(`  ${colors.bright}${colors.yellow}${step.icon} `);

      // Label with custom color
      process.stdout.write(`${colors.bright}${step.labelColor}${step.text}:${colors.reset} `);

      // Description with custom color
      process.stdout.write(`${colors.bright}${step.descColor}${step.desc}${colors.reset}\n`);
    });

    c.highlight('\n⏳ Please wait while the application loads...\n');

    // Add a divider before Electron Forge starts
    c.divider();

    // Create a colorful Electron Forge banner
    const forgeBannerText = "ELECTRON FORGE";
    const forgeBannerColors = [colors.cyan, colors.green, colors.yellow, colors.magenta, colors.blue, colors.red];

    // Print top border
    process.stdout.write('  ');
    for (let i = 0; i < 45; i++) {
      const colorIndex = Math.floor(i / 8) % forgeBannerColors.length;
      process.stdout.write(`${colors.bright}${forgeBannerColors[colorIndex]}▬${colors.reset}`);
    }
    process.stdout.write('\n  ');

    // Display the banner with color per letter
    for (let i = 0; i < forgeBannerText.length; i++) {
      const colorIndex = i % forgeBannerColors.length;
      process.stdout.write(`${colors.bright}${forgeBannerColors[colorIndex]}${forgeBannerText[i]}${colors.reset}`);
    }
    process.stdout.write('\n');

    // Print bottom border
    process.stdout.write('  ');
    for (let i = 0; i < 45; i++) {
      const colorIndex = Math.floor(i / 8) % forgeBannerColors.length;
      process.stdout.write(`${colors.bright}${forgeBannerColors[colorIndex]}▬${colors.reset}`);
    }
    process.stdout.write('\n\n');

    c.info('This process compiles and launches the Electron application:');
    process.stdout.write('\n');

    // Definition of stages and their associated colors
    const stages = [
      {
        name: 'Checking',
        color: colorFuncs.cyan,
        startTime: null,
        endTime: null,
        tasks: [
          { name: 'Checking your system', description: 'Verifying your environment is ready' },
          { name: 'Checking package manager', description: 'Making sure npm is available' }
        ]
      },
      {
        name: 'Locating',
        color: colorFuncs.magenta,
        startTime: null,
        endTime: null,
        tasks: [
          { name: 'Locating application', description: 'Finding app files and configuration' }
        ]
      },
      {
        name: 'Preparing',
        color: colorFuncs.blue,
        startTime: null,
        endTime: null,
        tasks: [
          { name: 'Preparing native dependencies', description: 'Setting up native modules' }
        ]
      },
      {
        name: 'Compiling',
        color: colorFuncs.red,
        startTime: null,
        endTime: null,
        tasks: [
          { name: 'Compiling Application', description: 'Building the React app with webpack' },
          { name: 'webpack', description: 'Bundling JavaScript modules' }
        ]
      },
      {
        name: 'Launching',
        color: colorFuncs.green,
        startTime: null,
        endTime: null,
        tasks: [
          { name: 'Launching Application', description: 'Starting the Electron app window' }
        ]
      }
    ];

    // Track which stage we're in
    let currentStage = '';

    // Track which descriptions we've already shown
    const shownDescriptions = new Set();

    // Run Electron Forge with enhanced output
    console.log("\n" + colorFuncs.cyan("▶ Running Electron Forge..."));

    // Prepare for stage tracking
    let stageLine = false;

    // Run Electron Forge with output captured and enhanced
    try {
      // Now try to use electron-forge
      const electronForge = spawn('electron-forge', ['start'], {
        shell: true,
        stdio: ['inherit', 'pipe', 'pipe']
      });

      // Process stdout for prettier output
      electronForge.stdout.on('data', (data) => {
        const output = data.toString();
        const lines = output.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;

          // Regular output with no special formatting
          else if (line.includes('[39m')) {
            // Clean up ANSI codes and extract the content
            const cleanLine = stripAnsi(line).trim();

            // Special handling for checkmark lines
            if (cleanLine.startsWith('✓')) {
              const message = cleanLine.substring(1).trim();

              if (message) {
                // Map common completion messages to task types for better icons
                let taskType = '';
                if (message.includes('Checking')) taskType = 'Checking';
                else if (message.includes('Compiling')) taskType = 'Compiling';
                else if (message.includes('Launching')) taskType = 'Launching';
                else if (message.includes('Locating')) taskType = 'Locating';
                else if (message.includes('Loading')) taskType = 'Loading';
                else if (message.includes('Preparing')) taskType = 'Preparing';
                else if (message.includes('Running')) taskType = 'Running';

                // Get appropriate icon and colors
                const { taskIcon, taskColor } = getTaskStyles(taskType || message);

                // Create a rainbow effect for the message text
                const rainbowColors = [
                  colorFuncs.bright.cyan,
                  colorFuncs.bright.green,
                  colorFuncs.bright.yellow,
                  colorFuncs.bright.magenta
                ];

                // Create pretty output with multiple colors
                let prettyText = '';
                const words = message.split(' ');

                words.forEach((word, idx) => {
                  const colorIdx = idx % rainbowColors.length;
                  prettyText += rainbowColors[colorIdx](word) + ' ';
                });

                // Print the enhanced line with icons and colors
                console.log(`${colorFuncs.bright.green('✓')} ${taskIcon} ${prettyText.trim()}`);
              } else {
                // Empty checkmark - probably a completed task with no text
                console.log(`${colorFuncs.bright.green('✓')} ${colorFuncs.bright.white('Complete')}`);
              }
            } else if (cleanLine.startsWith('❯')) {
              // Handle progress indicator lines with different colors based on content
              const message = cleanLine.substring(1).trim();

              // Different colors for different types of progress
              let progressColor;
              if (message.includes('Checking')) {
                progressColor = colorFuncs.bright.cyan;
              } else if (message.includes('Compiling')) {
                progressColor = colorFuncs.bright.red;
              } else if (message.includes('Launching')) {
                progressColor = colorFuncs.bright.green;
              } else if (message.includes('Loading')) {
                progressColor = colorFuncs.bright.magenta;
              } else if (message.includes('Locating')) {
                progressColor = colorFuncs.bright.yellow;
              } else if (message.includes('Preparing')) {
                progressColor = colorFuncs.bright.cyan;
              } else if (message.includes('Running')) {
                // Create an orange-like color by combining red and yellow
                const orangeText = (text) => `${colors.bright}${colors.yellow}${colors.red}${text}${colors.reset}`;
                progressColor = orangeText;
              } else if (message.includes('webpack')) {
                progressColor = colorFuncs.bright.green;
              } else {
                // Use rotating colors for other items
                const rotateColors = [
                  colorFuncs.bright.cyan,
                  colorFuncs.bright.magenta,
                  colorFuncs.bright.yellow,
                  colorFuncs.bright.red,
                  colorFuncs.bright.green
                ];
                const colorIndex = Math.abs(message.length) % rotateColors.length;
                progressColor = rotateColors[colorIndex];
              }

              // Print with bright arrow icon and colored message
              console.log(`${colorFuncs.bright.yellow('❯')} ${progressColor(message)}`);
            } else if (cleanLine.startsWith('›')) {
              // Output available or similar subsidiary lines - use bright magenta
              console.log(`${colorFuncs.bright.magenta('›')} ${colorFuncs.bright.green(cleanLine.substring(1).trim())}`);
            } else {
              // Match other patterns for specific coloring
              if (cleanLine.includes('localhost')) {
                // URLs get a special color and formatting
                console.log(`${colorFuncs.bright.yellow('ℹ')} ${colorFuncs.bright.cyan('Available at:')} ${colorFuncs.bright.green(cleanLine.trim())}`);
              } else {
                // All other lines - maintain some variability
                const generalColors = [
                  colorFuncs.bright.white,
                  colorFuncs.bright.cyan,
                  colorFuncs.bright.red,
                  colorFuncs.bright.green,
                  colorFuncs.bright.yellow,
                  colorFuncs.bright.magenta
                ];
                const colorIndex = cleanLine.length % generalColors.length;
                console.log(generalColors[colorIndex](cleanLine));
              }
            }
          }
          // Regular output with no special formatting
          else {
            process.stdout.write(line + '\n');
          }
        }
      });

      // Process stderr for error output
      electronForge.stderr.on('data', (data) => {
        const output = data.toString();
        const lines = output.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;

          // Error messages in red
          console.log(colorFuncs.bright.red(line.trim()));
        }
      });

      // Wait for Electron Forge to finish
      await new Promise((resolve, reject) => {
        electronForge.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Electron Forge exited with code ${code}`));
          }
        });
      });

      const appLoadEndTime = new Date();
      const appLoadTimeMs = appLoadEndTime - appLoadStartTime;
      const appLoadTimeSec = (appLoadTimeMs / 1000).toFixed(2);

      console.log('\n');
      console.log(colorFuncs.bright.cyan('═════════════════════════════════════════════════'));
      console.log(colorFuncs.bright.green('✅ APPLICATION LOADED SUCCESSFULLY'));
      console.log(colorFuncs.bright.cyan('═════════════════════════════════════════════════'));
      console.log(`${colorFuncs.bright.yellow('⚡')} ${colorFuncs.bright.white('App load time:')} ${colorFuncs.bright.green(appLoadTimeSec + 's')} ${colorFuncs.dim('(' + appLoadTimeMs + 'ms)')}`);
      console.log('');

    } catch (error) {
      console.error('\n');
      console.log(colorFuncs.bright.red('═════════════════════════════════════════════════'));
      console.log(colorFuncs.bright.red('❌ APPLICATION FAILED'));
      console.log(colorFuncs.bright.red('═════════════════════════════════════════════════'));
      console.error(colorFuncs.bright.red(error.message));
      console.log('');

      process.exit(1);
    }
  } catch (error) {
    console.error('\n');
    console.log(colorFuncs.bright.red('═════════════════════════════════════════════════'));
    console.log(colorFuncs.bright.red('❌ STARTUP FAILED'));
    console.log(colorFuncs.bright.red('═════════════════════════════════════════════════'));
    console.error(colorFuncs.bright.red(error.message));
    console.log('');

    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});
