var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: {
    main: ['./client/main'],
    admin: ['./client/admin']
  },
  output: {
    publicPath: '/js/',
    path: path.join(__dirname, 'public', 'js'),
    filename: '[name].js'
  },
  resolve: {
    aliasFields: ['browser'],
    alias: {
      'dust.core': 'dustjs-linkedin/lib/dust'
    }
  },
  externals: {
    'mongoose': 'mongoose'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        include: [
          path.join(__dirname, 'client'),
          path.join(__dirname, 'libs')
        ],
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
      dust: 'dustjs-linkedin',
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      "Hammer": "hammerjs/hammer"
    })
  ]
};
