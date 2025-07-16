const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const rendererConfig = require('./webpack.renderer.config.js');

module.exports = {
  ...rendererConfig,
  plugins: [
    ...rendererConfig.plugins,
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: true,
      reportFilename: 'bundle-report.html',
    }),
  ],
};