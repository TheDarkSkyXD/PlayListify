const path = require('path');

module.exports = {
  target: 'electron-renderer',
  node: {
    __dirname: false,
    __filename: false,
  },
  module: {
    rules: [
      ...require('./webpack.rules'),
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
};