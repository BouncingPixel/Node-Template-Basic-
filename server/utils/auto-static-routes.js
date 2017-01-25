const path = require('path');
const fs = require('fs');

// this one is used in production
function createAllStaticRoutes() {
  // create an express router
  // go through list of files
  // add routes for each of them

  // we return the router, even though this is async and the router is filled later
  // express is fine with this
}

// this one is used in dev
function createStaticHandler() {
  return function(req, res, next) {
    // also, make sure if it ends in a slash, then use index.dust
    const urlpath = 'static/' + req.path.substr(1) + (req.path[req.path.length-1] === '/' ? 'index' : '');
    const pagePath = path.resolve(__dirname, '..', '..', 'views', urlpath + '.dust');

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

//module.exports = process.env.NODE_ENV === 'production' ? createAllStaticRoutes : createStaticHandler;
module.exports = createStaticHandler;
