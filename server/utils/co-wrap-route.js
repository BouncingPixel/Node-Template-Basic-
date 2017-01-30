const bluebird = require('bluebird');

module.exports = function coWrapRoute(genFn) {
  const cr = bluebird.coroutine(genFn);

  if (genFn.length >= 3) {
    return function(err, req, res, next) {
      cr(err, req, res).then(function() {
        next();
      }).catch(next);
    };
  }

  return function(req, res, next) {
    cr(req, res).then(function() {
      next();
    }).catch(next);
  };
};
