module.exports = [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules[/\\].+\.node$/,
    use: 'node-loader',
  },
  {
    test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
  {
    // Add the rule for .ts and .tsx files
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: [
      // 2. Babel handles further transformations (like module syntax)
      {
        loader: 'babel-loader',
        options: {
          // Assuming babel.config.js exists
          // You might specify presets/plugins here if not using a config file
        }
      },
      // 1. TS-Loader handles TypeScript transpilation first
      {
        loader: 'ts-loader',
        options: {
          // Explicitly point to the root tsconfig.json
          configFile: 'tsconfig.json',
          transpileOnly: true, // Restore transpileOnly for speed
        },
      },
    ],
  },
  // Put your webpack loader rules in this array.  This is where you would put
  // your ts-loader configuration for instance:
  /**
   * Typescript Example:
   *
   * {
   *   test: /\.tsx?$/,
   *   exclude: /(node_modules|.webpack)/,
   *   loaders: [{
   *     loader: 'ts-loader',
   *     options: {
   *       transpileOnly: true
   *     }
   *   }]
   * }
   */
];
