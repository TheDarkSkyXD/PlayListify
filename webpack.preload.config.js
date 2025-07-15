const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  target: 'electron-preload',
  entry: './src/preload.ts',
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/handlers': path.resolve(__dirname, 'src/handlers'),
      '@/repositories': path.resolve(__dirname, 'src/repositories'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
      '@/styles': path.resolve(__dirname, 'src/styles'),
    },
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: path.resolve(__dirname, 'tsconfig.json'),
      },
    }),
  ],
  optimization: {
    nodeEnv: false, // Prevent webpack from setting NODE_ENV
  },
};
