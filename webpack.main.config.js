const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const path = require('path');
// const nodeExternals = require('webpack-node-externals'); // Removed for now

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/backend/backend.ts',
  target: 'electron-main',
  module: {
    rules: require('./webpack.rules.js'), // Ensured .js extension
  },
  output: {
    path: path.resolve(__dirname, '.webpack/main'),
    filename: 'index.js',
    // library: { type: 'module' }, // Removed
  },
  // experiments: { outputModule: true }, // Removed
  // externals: [nodeExternals({ importType: 'commonjs' })], // Removed webpack-node-externals
  // externals: { // Removed explicit externals
  //   'fs-extra': 'commonjs fs-extra',
  //   'electron-store': 'commonjs electron-store',
  //   'better-sqlite3': 'commonjs better-sqlite3',
  //   'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
  //   'yt-dlp-wrap': 'commonjs yt-dlp-wrap',
  //   'fs': 'commonjs fs',
  //   'path': 'commonjs path',
  // },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  node: {
    __dirname: false, // Reverted to false for CommonJS behavior
    __filename: false, // Reverted to false for CommonJS behavior
  },
};
