const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const userPagePath = path.resolve(__dirname, 'client/main/pages');
const adminPagePath = path.resolve(__dirname, 'client/admin/pages');

const userPages = fs.readdirSync(
  userPagePath
).filter(
  page => page.substring(page.length - 3) === '.js'
).reduce(function(obj, page) {
  const pageName = page.substring(0, page.length - 3);

  obj[pageName] = [path.join(userPagePath, page)];
  return obj;
}, {});

const adminPages = fs.readdirSync(
  adminPagePath
).filter(
  page => page.substring(page.length - 3) === '.js'
).reduce(function(obj, page) {
  const pageName = page.substring(0, page.length - 3);

  obj[pageName] = [path.join(adminPagePath, page)];
  return obj;
}, {});

const defaultLoaders = [
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
];

module.exports = [{
  entry: userPages,
  output: {
    publicPath: '/js/browser/',
    path: path.join(__dirname, 'public', 'js', 'browser'),
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
    loaders: defaultLoaders
  },
  plugins: [
    new webpack.ProvidePlugin({
      dust: 'dustjs-linkedin',
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      "Hammer": "hammerjs/hammer"
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "commons",
      filename: "commons.js",
    })
  ]
}, {
  entry: adminPages,
  output: {
    publicPath: '/js/admin/',
    path: path.join(__dirname, 'public', 'js', 'admin'),
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
    loaders: defaultLoaders
  },
  plugins: [
    new webpack.ProvidePlugin({
      dust: 'dustjs-linkedin',
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      "Hammer": "hammerjs/hammer"
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: "commons",
      filename: "commons.js",
    })
  ]
}];
