const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('winston');

const renderPage = require('./render-page');

const baseViewsDir = path.resolve(__dirname, '..', '..', 'views');

// this one is used in production
function createAllStaticRoutes() {
  // create an express router
  const router = express.Router();

  // go through list of files and add routes for each of them
  const staticDir = path.join(baseViewsDir, 'static');
  addRoutesInDir(staticDir, '/', router);

  // we return the router, even though this is async and the router is filled later
  // express is fine with this
  return router;
}

// no callback as it doesn't really matter. we don't notify anything that we are done
function addRoutesInDir(baseDir, dir, router) {
  const fullDir = path.join(baseDir, dir);

  fs.stat(fullDir, function(err, stats) {
    if (err) {
      logger.warn(err);
      return;
    }

    if (stats.isDirectory()) {
      fs.readdir(fullDir, function(err, files) {
        if (err) {
          logger.warn(err);
          return;
        }

        files.forEach(function(file) {
          addRoutesInDir(baseDir, path.join(dir, file), router);
        });
      });
    } else {
      // make sure it ends in .dust
      if (dir.lastIndexOf('.dust') !== (dir.length - 5)) {
        return;
      }

      // if it is index, then convert that to /
      if (dir.lastIndexOf('/index.dust') === (dir.length - 11)) {
        dir = dir.substr(0, dir.length - 10);
      }

      router.get(dir, renderPage(path.join('static', dir)));
    }
  });
}

// this one is used in dev
function createStaticHandler() {
  return function(req, res, next) {
    // also, make sure if it ends in a slash, then use index.dust
    const urlpath = 'static/' + req.path.substr(1) + (req.path[req.path.length - 1] === '/' ? 'index' : '');
    const pagePath = path.resolve(baseViewsDir, urlpath + '.dust');

    // security: make sure someone doesnt navigate out of the top folder with urlpath
    if (urlpath.indexOf('/./') !== -1 || urlpath.indexOf('/../') !== -1) {
      next();
      return;
    }

    // check if dust file exists
    fs.access(pagePath, fs.constants.R_OK, (err) => {
      // if not, then next();
      if (err) {
        // don't actually show the error, just let the 404 take over
        next();
        return;
      }

      // if it does, render it
      res.render(urlpath);
    });
  };
}

module.exports = process.env.NODE_ENV === 'production' ? createAllStaticRoutes : createStaticHandler;
