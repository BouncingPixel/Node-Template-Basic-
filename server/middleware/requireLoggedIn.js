'use strict';

module.exports = function(req, res, next) {
  if (!req.user) {
    var error = new Error('You must be logged in to access this page');
    error.status = 401;
    next(error);
    return;
  }

  next();
}
