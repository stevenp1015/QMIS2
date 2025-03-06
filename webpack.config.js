const path = require('path');

module.exports = {
  entry: './renderer.tsx', // Entry point for the renderer process
  output: {
    filename: 'bundle.js', // Output bundle file name
    path: path.resolve(__dirname, 'dist'), // Output directory (same as tsc output)
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
    extensions: ['.tsx', '.ts', '.js'],
  },
  devtool: 'source-map', // Enable source maps for debugging
  mode: 'development', // Set mode to development for easier debugging
};