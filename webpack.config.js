const path = require('path');

module.exports = {
  entry: './main.ts',
  mode: 'production',
  target: 'node',
  output: {
    path: path.resolve(__dirname),
    filename: 'main.js',
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
};