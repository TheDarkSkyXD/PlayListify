const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  target: 'electron-preload',
  entry: './src/preload.ts',
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
        // Use default minimizers
        '...',
      ],
    }),
  },
  
  externals: {
    // Mark electron as external to prevent bundling
    'electron': 'commonjs electron',
  },
  
  performance: {
    hints: isProduction ? 'warning' : false,
    maxEntrypointSize: 256000, // 256KB
    maxAssetSize: 256000,
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
