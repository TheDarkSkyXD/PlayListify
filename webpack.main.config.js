module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main/index.ts',
  // Put your normal webpack config below here
  module: {
    rules: [
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
        test: /\.tsx?$/,
        exclude: /(node_modules|\.webpack)/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  externals: [
    // List all native modules that should be excluded from bundling
    'better-sqlite3',
    'sqlite3',
    'node-gyp',
    'keytar',
    // Add dynamic externals handler to catch any native module imports
    function({ request }, callback) {
      // If the module is a native module or contains bindings.node, make it external
      if (/better-sqlite3|sqlite3|keytar|bindings\.node|\.node$/.test(request)) {
        return callback(null, 'commonjs ' + request);
      }
      callback();
    }
  ],
  node: {
    __dirname: false,
    __filename: false
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
}; 