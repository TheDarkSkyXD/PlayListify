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
  // TypeScript and TSX files (primary loader)
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
        compilerOptions: {
          noEmit: false,
          sourceMap: true,
        },
        configFile: 'tsconfig.json',
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
          }],
          ['@babel/preset-react', {
            runtime: 'automatic',
          }],
          '@babel/preset-typescript',
        ],
        plugins: [
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-object-rest-spread',
          '@babel/plugin-syntax-dynamic-import',
        ],
        cacheDirectory: true,
      },
    },
  },
  // Images and assets
  {
    test: /\.(png|jpe?g|gif|svg|ico)$/i,
    type: 'asset/resource',
    generator: {
      filename: 'assets/images/[name].[hash:8][ext]',
    },
    parser: {
      dataUrlCondition: {
        maxSize: 8 * 1024, // 8kb
      },
    },
  },
  // Fonts
  {
    test: /\.(woff|woff2|eot|ttf|otf)$/i,
    type: 'asset/resource',
    generator: {
      filename: 'assets/fonts/[name].[hash:8][ext]',
    },
  },
  // JSON files
  {
    test: /\.json$/,
    type: 'json',
  },
  // Raw text files
  {
    test: /\.(txt|md)$/i,
    type: 'asset/source',
  },
];