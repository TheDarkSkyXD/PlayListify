const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: {
    index: './src/backend/main.ts',
    preload: './src/backend/preload.ts'
  },
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/frontend/components'),
      '@/utils': path.resolve(__dirname, 'src/frontend/utils'),
      '@/styles': path.resolve(__dirname, 'src/frontend/styles'),
      '@/features': path.resolve(__dirname, 'src/frontend/features'),
      '@/services': path.resolve(__dirname, 'src/frontend/services'),
      '@/stores': path.resolve(__dirname, 'src/frontend/stores'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  externals: {
    'electron-squirrel-startup': 'commonjs electron-squirrel-startup',
  },
  output: {
    filename: '[name].js',
  },
  // Add Node.js environment settings to ensure __dirname works in preload
  node: {
    __dirname: false,
    __filename: false
  },
  // Tell webpack that we're building for Electron
  target: 'electron-main',
  // Add plugins to copy the preload-commonjs.js file to the output directory
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/backend/preload-commonjs.js', to: 'preload-commonjs.js' },
        { from: 'src/frontend/preload/direct-logger.js', to: 'direct-logger.js' },
        { from: 'src/frontend/preload/renderer-logger.js', to: 'renderer-logger.js' }
      ],
    }),
  ],
};
