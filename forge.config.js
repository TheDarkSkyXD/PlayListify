module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: [
      // Empty directories to be filled during build process
      './resources/bin'
    ]
  },
  rebuildConfig: {
    // Skip rebuilding native modules
    onlyModules: []
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: './resources/icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/renderer/index.html',
              js: './src/renderer/index.tsx',
              name: 'main_window',
              preload: {
                js: './src/main/preload.ts',
              },
            },
          ],
        },
      },
    },
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
  // Hook to download binaries before packaging
  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      const fs = require('fs-extra');
      const path = require('path');
      
      console.log('Preparing binary dependencies for packaging...');
      
      // Ensure resources directory exists
      const binDir = path.join(buildPath, '..', 'resources', 'bin');
      await fs.ensureDir(binDir);
      
      try {
        // Dynamically load our dependency services
        const ytdlpService = require('./src/main/services/ytdlpService');
        const ffmpegService = require('./src/main/services/ffmpegService');
        
        // Temporary override app.getPath to point to build resources
        const electron = require('electron');
        const originalGetPath = electron.app.getPath;
        electron.app.getPath = (name) => {
          if (name === 'userData') {
            return path.join(buildPath, '..', 'resources');
          }
          return originalGetPath(name);
        };
        
        // Download dependencies if needed
        await ytdlpService.ensureYtdlp();
        await ffmpegService.ensureFfmpeg();
        
        // Restore original function
        electron.app.getPath = originalGetPath;
        
        console.log('Binary dependencies prepared successfully');
      } catch (error) {
        console.error('Failed to prepare binary dependencies:', error);
        throw error;
      }
    }
  }
}; 