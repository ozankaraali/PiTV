const webpack = require('webpack');
module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.js',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  experiments: {
    topLevelAwait: true
  },
  plugins: [
    new webpack.DefinePlugin({ 'global.GENTLY': false }), 
    new webpack.DefinePlugin({ 'process.env.FLUENTFFMPEG_COV': false}),
    new webpack.NormalModuleReplacementPlugin(/^hexoid$/, require.resolve('hexoid/dist/index.js')),
  ],
};
