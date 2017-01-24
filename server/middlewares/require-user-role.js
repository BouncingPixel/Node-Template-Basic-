'use strict';

module.exports = function(roleName) {
  return function(req, res, next) {
    if (!req.user) {
      next(ServerErrors.NotAuthorized('You must be logged in to access this page'));
      return;
    }

    if (req.user.isRoleAtLeast(roleName)) {
      next(ServerErrors.Forbidden('You do not have permission to access this page'));
      return;
    }

    next();
  };
};
