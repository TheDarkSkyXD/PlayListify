const rules = require('./webpack.rules');
const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

rules.push({
  test: /\.css$/,
  use: [
    { loader: 'style-loader' }, 
    { loader: 'css-loader' }, 
    { loader: 'postcss-loader' } // Added postcss-loader for Tailwind
  ],
});

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/frontend/components': path.resolve(__dirname, 'src/frontend/components'),
      '@/frontend/lib': path.resolve(__dirname, 'src/frontend/lib')
    },
    fullySpecified: false,
    mainFields: ['main', 'module', 'browser']
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: 'tsconfig.json',
      },
    }),
  ],
};
