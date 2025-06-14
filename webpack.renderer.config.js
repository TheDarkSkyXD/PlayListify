const rules = require('./webpack.rules');
const path = require('path');
rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'postcss-loader' }],
});

module.exports = {
  // Put your normal webpack config below here
    module: {
      rules,
    },
    resolve: {
      extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@backend': path.resolve(__dirname, 'src/backend'),
        '@frontend': path.resolve(__dirname, 'src/frontend'),
        '@shared': path.resolve(__dirname, 'src/shared'),
      },
    },

};
