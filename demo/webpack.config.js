const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const __DEV__ = process.env.NODE_ENV !== "production";

module.exports = {
  mode: __DEV__ ? "development" : "production",
  entry: path.resolve(__dirname, "index.tsx"),
  output: {
    filename: "bundle.[contenthash].js",
    path: path.resolve(__dirname, "..", "docs"),
  },
  devtool: __DEV__ ? "inline-source-map" : undefined,
  devServer: {
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "sass-loader",
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
    modules: ["node_modules", "./src"],
  },
  plugins: [
    new HTMLWebpackPlugin({
      template: path.resolve(__dirname, "index.html"),
    }),
    !__DEV__ && new CleanWebpackPlugin(),
  ].filter(Boolean),
};
