const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const StatsWriterPlugin = require("webpack-stats-plugin").StatsWriterPlugin;

const extractMainCss = new ExtractTextPlugin('styles/styles.css');
const extractAdminCss = new ExtractTextPlugin('styles/styles.css');

const userPagePath = path.resolve(__dirname, 'client/main/pages');
const adminPagePath = path.resolve(__dirname, 'client/admin/pages');

const userPages = findAllPages(
  userPagePath,
  {
    'maincss': [
      path.join(__dirname, 'client/main/styles/styles.scss')
    ]
  }
);

const adminPages = findAllPages(
  adminPagePath,
  {
    'admincss': [
      path.join(__dirname, 'client/admin/styles/styles.scss')
    ]
  }
);

module.exports = [{
  entry: userPages,
  context: path.resolve(__dirname, 'client/main'),
  output: {
    publicPath: '/main/',
    path: path.join(__dirname, 'public', 'main'),
    filename: 'js/[name].js'
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
  devtool: 'source-map',
  module: {
    loaders: makeLoaders(extractMainCss)
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
      filename: "js/commons.js",
    }),
    extractMainCss,
    makeStatWriter('main-stats.json')
  ]
}, {
  entry: adminPages,
  context: path.resolve(__dirname, 'client/admin'),
  output: {
    publicPath: '/admin/',
    path: path.join(__dirname, 'public', 'admin'),
    filename: 'js/[name].js'
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
  devtool: 'source-map',
  module: {
    loaders: makeLoaders(extractAdminCss)
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
      filename: "js/commons.js",
    }),
    extractAdminCss,
    makeStatWriter('admin-stats.json')
  ]
}];

function findAllPages(startingPath, startingEntries) {
  return recursiveFindFiles(
    startingPath,
    '',
    ['.js', '.jsx', '.ts', '.tsx']
  ).reduce(function(obj, page) {
    const pageName = page.substring(0, page.length - 3);

    obj[pageName] = [path.join(startingPath, page)];
    return obj;
  }, startingEntries);
}

function recursiveFindFiles(dirPath, relativePath, desiredExt) {
  const desiredExts = Array.isArray(desiredExt) ? desiredExt : [desiredExt];

  let foundFiles = [];

  const filesInDir = fs.readdirSync(dirPath);
  filesInDir.forEach(function(file) {
    const absfilePath = path.join(dirPath, file);
    const relfilePath = relativePath.length ? path.join(relativePath, file) : file;

    const stats = fs.statSync(absfilePath);
    if (stats.isDirectory()) {
      foundFiles = foundFiles.concat(recursiveFindFiles(absfilePath, relfilePath, desiredExt));
    } else if (stats.isFile() && desiredExt.indexOf(path.parse(file).ext) !== -1) {
      foundFiles.push(relfilePath);
    }
  });

  return foundFiles;
}

function makeLoaders(extractCss) {
  return [
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
    },
    {
      test: /\.css$/,
      use: extractCss.extract({
        fallback: 'style-loader',
        use: 'css-loader'
      })
    },
    {
      test: /\.scss$/,
      use: extractCss.extract({
        fallback: 'style-loader',
        use: ['css-loader', 'sass-loader']
      })
    }
  ];
}

function makeStatWriter(name) {
  return new StatsWriterPlugin({
    filename: name,
    fields: ['chunks'],
    transform: function(data) {
      const fileHashes = data.chunks.reduce(function(hashes, chunk) {
        chunk.files.forEach(function(file) {
          hashes[file] = chunk.hash.substr(0, 8);
        });

        return hashes;
      }, {});

      return JSON.stringify({
        fileHashes: fileHashes
      }, null, 2);
    }
  });
}
