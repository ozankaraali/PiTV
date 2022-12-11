const rules = require('./webpack.rules');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});
rules.push({
  test: /\.s[ac]ss$/i,
  use: [ {loader: "style-loader"}, {loader: "css-loader"}, {loader: "sass-loader"}],
});

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
};
