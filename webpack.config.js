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
  resolve: {
    aliasFields: ['browser']
  },
  externals: {
    'jquery': 'jQuery',
    'swal': 'swal',
    'moment': 'moment',
    'mongoose': 'mongoose',
    'pluralize': 'pluralize',
    'axios': 'axios',
    'slidebars': 'slidebars',
    'mongoose/lib/browserDocument': 'mongoose.Document'
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
      },
      {
        test: /\.dust$/,
        loader: 'dust-loader'
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      dust: 'dustjs-linkedin'
    })
  ]
};
