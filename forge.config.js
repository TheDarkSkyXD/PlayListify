const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const path = require('path');
const fs = require('fs-extra');

module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: ['./ytdlp'],
    // MacOS specific configuration
    osxSign: {},
    osxNotarize: {
      tool: 'notarytool',
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // Setup event to install yt-dlp during app installation
        setupIcon: './assets/icon.ico',
        loadingGif: './assets/installer.gif',
        // Add custom script to run during installation
        setupExtraArgs: ['--setupEvents'],
        // Scripts to run during install/uninstall
        scripts: {
          // This script will run during installation
          install: path.resolve('./scripts/windows-installer/install-events.js'),
          // This script will run during uninstallation
          uninstall: path.resolve('./scripts/windows-installer/uninstall-events.js')
        }
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        // Scripts for macOS installation and uninstallation
        scripts: {
          postinstall: path.resolve('./scripts/macos-installer/postinstall.sh'),
          preuninstall: path.resolve('./scripts/macos-installer/preuninstall.sh')
        }
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        // Scripts for macOS DMG installation and uninstallation
        scripts: {
          postinstall: path.resolve('./scripts/macos-installer/postinstall.sh'),
          preuninstall: path.resolve('./scripts/macos-installer/preuninstall.sh')
        },
        background: './assets/dmg-background.png',
        format: 'ULFO'
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        // Add hooks for Debian-based installers
        scripts: {
          postinst: path.resolve('./scripts/linux-installer/postinst.sh'),
          prerm: path.resolve('./scripts/linux-installer/prerm.sh')
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        // Add hooks for RPM-based installers
        scripts: {
          posttrans: path.resolve('./scripts/linux-installer/posttrans.sh'),
          preun: path.resolve('./scripts/linux-installer/preun.sh')
        }
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.tsx',
              name: 'main_window',
              preload: {
                js: './src/preload.ts'
              },
            },
          ],
        },
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
