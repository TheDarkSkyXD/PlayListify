const path = require('path');

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: {
    index: './src/main.ts',
    preload: './src/preload.ts'
  },
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/renderer/components'),
      '@/utils': path.resolve(__dirname, 'src/renderer/utils'),
      '@/styles': path.resolve(__dirname, 'src/renderer/styles'),
      '@/features': path.resolve(__dirname, 'src/renderer/features'),
      '@/services': path.resolve(__dirname, 'src/renderer/services'),
      '@/stores': path.resolve(__dirname, 'src/renderer/stores'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  externals: {
    'electron-squirrel-startup': 'commonjs electron-squirrel-startup',
  },
  output: {
    filename: '[name].js',
  },
};
