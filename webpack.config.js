const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');


module.exports = {
  entry: './main.ts',
  mode: 'development',
  target: 'node',
  output: {
    path: path.resolve(__dirname),
    filename: 'build/main.js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    obsidian: 'commonjs2 obsidian',
    fs: 'commonjs2 fs',
    path: 'commonjs2 path'
  },
  plugins: [
    new CopyWebpackPlugin({
      // Copy the manifest.json and styles.css files to the build directory
      patterns: [
        { from: 'manifest.json', to: 'build/manifest.json', force: true },
        { from: 'styles.css', to: 'build/styles.css', force: true },
      ],
    }),
  ],
};