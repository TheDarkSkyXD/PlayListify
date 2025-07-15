const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Playlistify',
    executableName: 'playlistify',
    appBundleId: 'com.playlistify.app',
    appVersion: require('./package.json').version,
    buildVersion: require('./package.json').version,
    icon: './assets/icon', // Platform-specific extensions will be added automatically
    ignore: [
      /^\/\.git/,
      /^\/node_modules\/(?!.*\.(node|dll|dylib|so)$)/,
      /^\/src/,
      /^\/tests/,
      /^\/docs/,
      /^\/\.webpack/,
      /^\/coverage/,
      /\.map$/,
      /\.ts$/,
      /\.tsx$/,
      /tsconfig\.json$/,
      /webpack\..*\.js$/,
      /babel\.config\.js$/,
      /jest\.config\.js$/,
      /\.eslintrc/,
      /\.prettierrc/,
    ],
  },
  rebuildConfig: {
    // Rebuild native modules for the target platform
    buildPath: './node_modules',
    onlyModules: ['better-sqlite3'],
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Playlistify',
        authors: 'Playlistify Team',
        description: 'A comprehensive YouTube playlist management application',
        setupIcon: './assets/icon.ico',
        loadingGif: './assets/loading.gif',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        name: 'Playlistify',
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        name: 'playlistify',
        productName: 'Playlistify',
        genericName: 'YouTube Playlist Manager',
        description: 'A comprehensive YouTube playlist management application',
        categories: ['AudioVideo', 'Audio', 'Video'],
        maintainer: 'Playlistify Team',
        homepage: 'https://github.com/playlistify/playlistify',
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        name: 'playlistify',
        productName: 'Playlistify',
        genericName: 'YouTube Playlist Manager',
        description: 'A comprehensive YouTube playlist management application',
        categories: ['AudioVideo'],
        maintainer: 'Playlistify Team',
        homepage: 'https://github.com/playlistify/playlistify',
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {
        // Automatically unpack native modules
      },
    },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        devContentSecurityPolicy: "default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:",
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.tsx',
              name: 'main_window',
              preload: {
                js: './src/preload.ts',
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
      [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
    }),
  ],
};
