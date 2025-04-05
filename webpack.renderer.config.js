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
      '@/components': path.resolve(__dirname, 'src/frontend/components'),
      '@/components/ui': path.resolve(__dirname, 'src/frontend/components/ui'),
      '@/components/layout': path.resolve(__dirname, 'src/frontend/components/layout'),
      '@/components/common': path.resolve(__dirname, 'src/frontend/components/common'),
      '@/utils': path.resolve(__dirname, 'src/frontend/utils'),
      '@/styles': path.resolve(__dirname, 'src/frontend/styles'),
      '@/features': path.resolve(__dirname, 'src/frontend/features'),
      '@/features/dashboard': path.resolve(__dirname, 'src/frontend/features/dashboard'),
      '@/features/playlists': path.resolve(__dirname, 'src/frontend/features/playlists'),
      '@/features/downloads': path.resolve(__dirname, 'src/frontend/features/downloads'),
      '@/features/history': path.resolve(__dirname, 'src/frontend/features/history'),
      '@/features/settings': path.resolve(__dirname, 'src/frontend/features/settings'),
      '@/services': path.resolve(__dirname, 'src/frontend/services'),
      '@/stores': path.resolve(__dirname, 'src/frontend/stores'),
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
