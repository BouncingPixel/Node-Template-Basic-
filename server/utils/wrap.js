const bluebird = require('bluebird');

module.exports = function wrapAsync(genFn) {
  const cr = bluebird.coroutine(genFn);

  return function(req, res, next) {
    cr(req, res, next).catch(next);
  };
};
