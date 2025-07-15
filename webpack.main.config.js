const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.ts',
  target: 'electron-main',
  node: {
    __dirname: true,
    __filename: true,
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
  
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
      '@/shared': path.resolve(__dirname, 'src/shared'),
      '@/handlers': path.resolve(__dirname, 'src/handlers'),
      '@/repositories': path.resolve(__dirname, 'src/repositories'),
      '@/adapters': path.resolve(__dirname, 'src/adapters'),
      '@/styles': path.resolve(__dirname, 'src/styles'),
    },
  },
  
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: path.resolve(__dirname, 'tsconfig.json'),
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
      },
      eslint: {
        files: './src/**/*.{ts,tsx}',
        enabled: process.env.NODE_ENV !== 'production',
      },
      logger: {
        infrastructure: 'silent',
        issues: 'console',
        devServer: false,
      },
    }),
  ],
  
  optimization: {
    nodeEnv: false, // Prevent webpack from setting NODE_ENV
    minimize: process.env.NODE_ENV === 'production',
  },
  
  externals: {
    // Mark native modules as external to prevent bundling
    'better-sqlite3': 'commonjs better-sqlite3',
    'electron': 'commonjs electron',
    'fs-extra': 'commonjs fs-extra',
  },
  
  stats: {
    colors: true,
    modules: false,
    chunks: false,
    chunkModules: false,
  },
};