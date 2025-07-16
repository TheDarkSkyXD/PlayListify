const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

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
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  
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
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/frontend': path.resolve(__dirname, 'src/frontend'),
      '@/backend': path.resolve(__dirname, 'src/backend'),
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
        mode: 'write-references',
      },
      logger: {
        infrastructure: 'silent',
        issues: 'console',
        devServer: false,
      },
      async: !isProduction, // Async in development for faster builds
    }),
  ],
  
  optimization: {
    nodeEnv: false, // Prevent webpack from setting NODE_ENV
    minimize: isProduction,
    ...(isProduction && {
      minimizer: [
        // Use default minimizers but with better configuration
        '...',
      ],
    }),
  },
  
  externals: {
    // Mark native modules as external to prevent bundling
    'better-sqlite3': 'commonjs better-sqlite3',
    'electron': 'commonjs electron',
    'fs-extra': 'commonjs fs-extra',
    'sqlite3': 'commonjs sqlite3',
    'yt-dlp-wrap': 'commonjs yt-dlp-wrap',
    'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
    'winston': 'commonjs winston',
  },
  
  performance: {
    hints: isProduction ? 'warning' : false,
    maxEntrypointSize: 1024000, // 1MB
    maxAssetSize: 1024000,
  },
  
  stats: {
    colors: true,
    modules: false,
    chunks: false,
    chunkModules: false,
    timings: true,
    builtAt: true,
  },
  
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
};