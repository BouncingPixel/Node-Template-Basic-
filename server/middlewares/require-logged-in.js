'use strict';

module.exports = function(req, res, next) {
  if (!req.user) {
    next(ServerErrors.NotAuthorized('You must be logged in to access this page'));
    return;
  }

  next();
};
