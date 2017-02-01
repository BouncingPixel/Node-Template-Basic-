var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: {
    main: ['./client/main'],
    admin: ['./client/admin']
  },
  output: {
    path: path.join(__dirname, 'public', 'js'),
    filename: '[name].js'
  },
  externals: {
    "jquery": "jQuery",
    "swal": "swal",
    "moment": "moment",
    "pluralize": "pluralize",
    "page": "page",
    "axios": "axios"
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        include: path.join(__dirname, 'client'),
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
};
