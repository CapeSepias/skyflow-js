const path = require("path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");

const minify = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true,
  minifyJS: true,
};
module.exports = {
  target: "web",
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },

  module: {
    rules: [
      { test: /\.(ts|js)x?$/, loader: "babel-loader", exclude: /node_modules/ },
    ],
  },

  // todo: add minifier for css in html file
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new HtmlWebPackPlugin({
      filename: "iframe.html",
      template: "assets/iframe.html",
      chunks: ["iframe"],
      inject: "head",
      minify,
    }),
  ],
};
