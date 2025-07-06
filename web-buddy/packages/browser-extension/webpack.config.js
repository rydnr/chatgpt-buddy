/*
                        Web-Buddy Browser Extension

    Copyright (C) 2025-today  rydnr@acm-sl.org

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/background-script.ts',
    content: './src/content/content-script.ts',
    popup: './src/ui/popup.ts'
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'manifest.json',
          to: 'manifest.json'
        },
        {
          from: 'src/ui/popup.html',
          to: 'popup.html'
        },
        {
          from: 'src/ui/popup.css',
          to: 'popup.css'
        },
        {
          from: 'icons/',
          to: 'icons/',
          noErrorOnMissing: true
        }
      ]
    })
  ],
  
  optimization: {
    splitChunks: false
  },
  
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map'
};