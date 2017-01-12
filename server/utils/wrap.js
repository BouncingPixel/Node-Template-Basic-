const bluebird = require('bluebird');

module.exports = function wrapAsync(genFn, isErrorHandler) {
  const cr = bluebird.coroutine(genFn);

  if (isErrorHandler) {
    return function(err, req, res, next) {
      cr(err, req, res, next).catch(next);
    };
  }

  return function(req, res, next) {
    cr(req, res, next).catch(next);
  };
};
