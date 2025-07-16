const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  target: 'electron-renderer',
  entry: './src/renderer-router.tsx',
  node: {
    __dirname: false,
    __filename: false,
  },
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  
  module: {
    rules: [
      ...require('./webpack.rules'),
      // Enhanced CSS processing with PostCSS and TailwindCSS
      {
        test: /\.css$/,
        use: [
          { 
            loader: 'style-loader',
            options: {
              // Insert styles at the top of <head> for better performance
              insert: 'head',
              injectType: 'singletonStyleTag',
            },
          },
          { 
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: !isProduction,
              modules: {
                auto: true, // Enable CSS modules for files with .module.css
                localIdentName: isProduction 
                  ? '[hash:base64:8]' 
                  : '[name]__[local]--[hash:base64:5]',
              },
            },
          },
          { 
            loader: 'postcss-loader',
            options: {
              sourceMap: !isProduction,
              postcssOptions: {
                config: path.resolve(__dirname, 'postcss.config.js'),
              },
            },
          },
        ],
      },
      // SCSS/SASS support (if needed in the future)
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: !isProduction,
            },
          },
          'postcss-loader',
          'sass-loader',
        ],
      },
    ],
  },
  
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss', '.sass', '.json'],
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
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 250000,
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          chunks: 'all',
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          priority: 10,
          chunks: 'all',
        },
        tanstack: {
          test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
          name: 'tanstack',
          priority: 5,
          chunks: 'all',
        },
        ui: {
          test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
          name: 'ui',
          priority: 5,
          chunks: 'all',
        },
      },
    },
    minimize: isProduction,
    ...(isProduction && {
      minimizer: [
        // Use default minimizers with better configuration
        '...',
      ],
    }),
  },
  
  performance: {
    hints: isProduction ? 'warning' : false,
    maxEntrypointSize: 1024000, // 1MB
    maxAssetSize: 512000, // 512KB
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