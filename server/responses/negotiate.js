'use strict';

module.exports = function(err) {

  // Get access to response object (`res`)
  var res = this.res;

  var statusCode = err.status || 500;

  // Respond using the appropriate custom response
  if (statusCode === 403) {
    return res.forbidden(err);
  }

  if (statusCode === 404) {
    return res.notFound(err);
  }

  if (statusCode >= 400 && statusCode < 500) {
    return res.badRequest(err);
  }

  if (err.name === 'ValidationError') {
    return res.badRequest(err);
  }

  return res.serverError(err);
};
