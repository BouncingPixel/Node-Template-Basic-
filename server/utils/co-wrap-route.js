const bluebird = require('bluebird');

module.exports = function coWrapRoute(genFn, isMiddleware) {
  const cr = bluebird.coroutine(genFn);

  if (genFn.length >= 3) {
    return function(err, req, res, next) {
      cr(err, req, res).then(function() {
        if (isMiddleware) {
          next();
        }
      }).catch(next);
    };
  }

  return function(req, res, next) {
    cr(req, res).then(function() {
      if (isMiddleware) {
        next();
      }
    }).catch(next);
  };
};
