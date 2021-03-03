const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
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
  plugins: [
    new webpack.DefinePlugin({ 'global.GENTLY': false }), 
    new webpack.DefinePlugin({ 'process.env.FLUENTFFMPEG_COV': false})
  ],
  target: 'electron-main', // in order to ignore built-in modules like path, fs, etc.
  // externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
};
