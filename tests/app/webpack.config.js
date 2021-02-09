const webpack = require("webpack");
const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "production",
  entry: path.resolve(__dirname, "index.tsx"),
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "..", "dist"),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    modules: ["node_modules", "./src"],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.TESTING": JSON.stringify(true),
    }),
    new HTMLWebpackPlugin({
      template: path.resolve(__dirname, "index.html"),
    }),
  ],
};
