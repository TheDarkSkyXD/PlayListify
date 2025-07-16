/**
 * Webpack Optimization Configuration
 * Advanced optimization settings for production builds
 */

const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isProduction = process.env.NODE_ENV === 'production';
const isAnalyze = process.env.ANALYZE === 'true';

// Common optimization settings
const commonOptimization = {
  // Enable module concatenation (scope hoisting)
  concatenateModules: true,
  
  // Remove empty chunks
  removeEmptyChunks: true,
  
  // Merge duplicate chunks
  mergeDuplicateChunks: true,
  
  // Remove modules from chunks when they are already included in parent chunks
  removeAvailableModules: true,
  
  // Flag chunks as child chunks when they are already included in parent chunks
  flagIncludedChunks: true,
  
  // Determine exports for each module when possible
  providedExports: true,
  
  // Determine used exports for each module
  usedExports: true,
  
  // Identify side effect free modules and mark them
  sideEffects: false,
};

// Production-specific optimization
const productionOptimization = {
  ...commonOptimization,
  
  // Enable tree shaking
  usedExports: true,
  sideEffects: false,
  
  // Minimize code
  minimize: true,
  
  // Split chunks optimization
  splitChunks: {
    chunks: 'all',
    minSize: 20000,
    maxSize: 250000,
    minChunks: 1,
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    enforceSizeThreshold: 50000,
    
    cacheGroups: {
      // Default group
      default: {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true,
      },
      
      // Vendor libraries
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: -10,
        chunks: 'all',
        enforce: true,
      },
      
      // React and React DOM
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        name: 'react',
        priority: 20,
        chunks: 'all',
        enforce: true,
      },
      
      // TanStack libraries (React Query, Router)
      tanstack: {
        test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
        name: 'tanstack',
        priority: 15,
        chunks: 'all',
        enforce: true,
      },
      
      // UI libraries (Radix UI, Lucide React)
      ui: {
        test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
        name: 'ui',
        priority: 10,
        chunks: 'all',
        enforce: true,
      },
      
      // Utility libraries
      utils: {
        test: /[\\/]node_modules[\\/](lodash|date-fns|clsx|class-variance-authority)[\\/]/,
        name: 'utils',
        priority: 5,
        chunks: 'all',
        enforce: true,
      },
      
      // Styling libraries
      styles: {
        test: /[\\/]node_modules[\\/](tailwindcss|autoprefixer|postcss)[\\/]/,
        name: 'styles',
        priority: 5,
        chunks: 'all',
        enforce: true,
      },
    },
  },
  
  // Runtime chunk optimization
  runtimeChunk: {
    name: 'runtime',
  },
};

// Development optimization (faster builds)
const developmentOptimization = {
  // Disable most optimizations for faster builds
  removeAvailableModules: false,
  removeEmptyChunks: false,
  splitChunks: false,
  minimize: false,
  
  // Basic chunk splitting for development
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
    },
  },
};

// Performance optimization plugins
const getOptimizationPlugins = () => {
  const plugins = [];
  
  // Bundle analyzer for production analysis
  if (isAnalyze) {
    plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: true,
        reportFilename: 'bundle-report.html',
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
      })
    );
  }
  
  return plugins;
};

// Main process optimization (Electron main)
const getMainProcessOptimization = () => ({
  ...commonOptimization,
  
  // Main process specific optimizations
  splitChunks: false, // Main process doesn't need chunk splitting
  minimize: isProduction,
  
  // External dependencies (don't bundle native modules)
  externals: {
    'better-sqlite3': 'commonjs better-sqlite3',
    'electron': 'commonjs electron',
    'fs-extra': 'commonjs fs-extra',
    'sqlite3': 'commonjs sqlite3',
    'yt-dlp-wrap': 'commonjs yt-dlp-wrap',
    'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
    'winston': 'commonjs winston',
    'adm-zip': 'commonjs adm-zip',
    'tar': 'commonjs tar',
  },
});

// Renderer process optimization (React app)
const getRendererProcessOptimization = () => ({
  ...(isProduction ? productionOptimization : developmentOptimization),
  
  // Renderer specific optimizations
  mangleExports: isProduction,
  
  // Module IDs optimization
  moduleIds: isProduction ? 'deterministic' : 'named',
  chunkIds: isProduction ? 'deterministic' : 'named',
});

// Performance hints configuration
const getPerformanceConfig = () => ({
  hints: isProduction ? 'warning' : false,
  maxEntrypointSize: isProduction ? 512000 : 1024000, // 512KB for production, 1MB for dev
  maxAssetSize: isProduction ? 256000 : 512000, // 256KB for production, 512KB for dev
  
  // Custom filter for performance hints
  assetFilter: (assetFilename) => {
    // Ignore source maps and certain file types from performance hints
    return !assetFilename.endsWith('.map') && 
           !assetFilename.endsWith('.woff2') && 
           !assetFilename.endsWith('.woff') &&
           !assetFilename.endsWith('.ttf');
  },
});

// Cache configuration for faster builds
const getCacheConfig = () => ({
  type: 'filesystem',
  version: require('./package.json').version,
  
  buildDependencies: {
    config: [
      __filename,
      path.resolve(__dirname, 'webpack.main.config.js'),
      path.resolve(__dirname, 'webpack.renderer.config.js'),
      path.resolve(__dirname, 'webpack.rules.js'),
      path.resolve(__dirname, 'package.json'),
      path.resolve(__dirname, 'tsconfig.json'),
    ],
  },
  
  // Cache in node_modules/.cache/webpack
  cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
  
  // Compression for cache files
  compression: 'gzip',
  
  // Cache invalidation
  hashAlgorithm: 'xxhash64',
});

module.exports = {
  commonOptimization,
  productionOptimization,
  developmentOptimization,
  getOptimizationPlugins,
  getMainProcessOptimization,
  getRendererProcessOptimization,
  getPerformanceConfig,
  getCacheConfig,
  isProduction,
  isAnalyze,
};