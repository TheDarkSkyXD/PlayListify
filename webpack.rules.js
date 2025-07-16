module.exports = [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules\/.+\.node$/,
    use: 'node-loader',
  },
  {
    test: /\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
  // TypeScript and TSX files (primary loader with enhanced options)
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
        compilerOptions: {
          noEmit: false,
          sourceMap: process.env.NODE_ENV !== 'production',
          declaration: false, // Disable for webpack builds
          declarationMap: false,
        },
        configFile: 'tsconfig.json',
        // Enable faster builds with thread-loader in development
        happyPackMode: process.env.NODE_ENV !== 'production',
      },
    },
  },
  // JavaScript and JSX files (fallback for any JS files)
  {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: [
          ['@babel/preset-env', {
            targets: {
              electron: '37.2.0',
            },
            useBuiltIns: 'usage',
            corejs: 3,
            modules: false, // Let webpack handle modules
          }],
          ['@babel/preset-react', {
            runtime: 'automatic',
            development: process.env.NODE_ENV !== 'production',
          }],
          '@babel/preset-typescript',
        ],
        plugins: [
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-object-rest-spread',
          '@babel/plugin-syntax-dynamic-import',
        ],
        cacheDirectory: true,
        cacheCompression: false,
      },
    },
  },
  // Images and assets with optimized handling
  {
    test: /\.(png|jpe?g|gif|svg|ico)$/i,
    type: 'asset',
    generator: {
      filename: 'assets/images/[name].[contenthash:8][ext]',
    },
    parser: {
      dataUrlCondition: {
        maxSize: 8 * 1024, // 8kb - inline smaller images
      },
    },
  },
  // Fonts with optimized handling
  {
    test: /\.(woff|woff2|eot|ttf|otf)$/i,
    type: 'asset/resource',
    generator: {
      filename: 'assets/fonts/[name].[contenthash:8][ext]',
    },
  },
  // Audio and video files
  {
    test: /\.(mp3|mp4|wav|ogg|webm)$/i,
    type: 'asset/resource',
    generator: {
      filename: 'assets/media/[name].[contenthash:8][ext]',
    },
  },
  // JSON files
  {
    test: /\.json$/,
    type: 'json',
  },
  // Raw text files and documentation
  {
    test: /\.(txt|md)$/i,
    type: 'asset/source',
  },
];