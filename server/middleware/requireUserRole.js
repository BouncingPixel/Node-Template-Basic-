'use strict';

module.exports = function(roleName) {
  return function(req, res, next) {
    if (!req.user) {
      var error = new Error('You must be logged in to access this page');
      error.status = 401;
      next(error);
      return;
    }

    if (req.user.role !== roleName) {
      var error = new Error('You do not have permission to access this page');
      error.status = 403;
      next(error);
      return;
    }

    next();
  };
};
