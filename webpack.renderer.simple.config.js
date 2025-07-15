const path = require('path');

module.exports = {
  target: 'electron-renderer',
  mode: 'development',
  devtool: 'eval-source-map',
  
  entry: './src/renderer.tsx',
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'renderer.js',
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
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
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true,
            },
          },
          'postcss-loader',
        ],
      },
    ],
  },
  
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/styles': path.resolve(__dirname, 'src/styles'),
    },
  },
  
  stats: {
    colors: true,
    modules: false,
    chunks: false,
    chunkModules: false,
  },
};