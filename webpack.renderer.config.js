const rules = require('./webpack.rules');
const path = require('path');

rules.push({
  test: /\.css$/,
  use: [
    { loader: 'style-loader' },
    { loader: 'css-loader' },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          config: true,
        },
      },
    },
  ],
});

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
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
  devtool: 'source-map',
  // Set proper node environment to handle globals like __dirname
  node: {
    __dirname: false,
    __filename: false
  },
};
