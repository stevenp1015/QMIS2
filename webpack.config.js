const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  target: 'electron-renderer',
  entry: './renderer.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
    // Removed fallback configuration to allow native Node.js modules
  },
  externals: {
    electron: 'require("electron")'
  },
  devtool: 'source-map',
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist'),
      },
      {
        directory: path.join(__dirname), // Serve root directory as well
      },
    ],
    hot: true,
    port: 9000,
    historyApiFallback: true, // Re-enable historyApiFallback (might be needed for routing)
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'), // Define NODE_ENV
    }),
  ],
};