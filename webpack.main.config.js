const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const PermissionsOutputPlugin = require('webpack-permissions-plugin');
const path = require('path');
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
    new webpack.DefinePlugin({ 'process.env.FLUENTFFMPEG_COV': false }),
    new CopyPlugin({
      patterns: [
        {from: 'node_modules/ffmpeg-static/ffmpeg*', to: '[name][ext]'},
      ],
    }),
    new PermissionsOutputPlugin({
      buildFiles: [
        {
          path: path.resolve(__dirname, '.webpack', 'main', 'ffmpeg'),
          fileMode: '755'
        },
        {
          path: path.resolve(__dirname, '.webpack', 'main', 'native_modules', 'ffprobe'),
          fileMode: '755'
        },
      ]
    })
  ],
};
