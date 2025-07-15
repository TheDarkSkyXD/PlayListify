const path = require('path');

module.exports = {
  entry: './src/main-simple.ts',
  target: 'electron-main',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
  
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              noEmit: false,
              sourceMap: true,
            },
          },
        },
      },
    ],
  },
  
  resolve: {
    extensions: ['.js', '.ts'],
  },
  
  node: {
    __dirname: false,
    __filename: false,
  },
  
  stats: {
    colors: true,
    modules: false,
    chunks: false,
    chunkModules: false,
  },
};