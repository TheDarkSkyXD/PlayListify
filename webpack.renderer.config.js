const rules = require('./webpack.rules');
const path = require('path');

module.exports = {
  // Add mode configuration
  mode: 'development',
  // Put your normal webpack config below here
  module: {
    rules: [
      ...rules,
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'postcss-loader' }],
      },
      // Assets
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias: {
      // Use absolute paths instead of relative paths
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './src/backend'),
      '@renderer': path.resolve(__dirname, './src/frontend'),
      '@shared': path.resolve(__dirname, './src/shared')
    },
    fallback: {
      // Use false for Node.js modules that aren't needed
      "path": false,
      "fs": false
    }
  }
}; 