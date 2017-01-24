'use strict';

const logger = require('winston');
const nconf = require('nconf');

function _determineLogMessage(data, defaultMessage) {
  if (!data) {
    return defaultMessage;
  } else if (data instanceof Error) {
    return data.message || defaultMessage;
  } else {
    return data.toString();
  }
}

module.exports = function generalErrorHandler(err, req, res, _next) {
  const statusCode = err.status || 500;
  res.status(statusCode);

  if (statusCode === 401) {
    if (req.xhr) {
      return res.send('You must be logged in');
    }
    req.session.redirectto = req.path;
    return res.redirect(nconf.get('redirectOn401'));
  }

  let view = 'errors/500';
  let defaultMessage = 'An error has occured';

  if (statusCode === 403) {
    view = 'errors/403';
    defaultMessage = 'Forbidden';
  } else if (statusCode === 404) {
    view = 'errors/404';
    defaultMessage = 'File not Found';
  } else if (statusCode >= 400 && statusCode < 500) {
    view = 'errors/400';
    defaultMessage = 'The request was invalid';
  }

  const logMessage = _determineLogMessage(err, defaultMessage);

  logger.info(logMessage);

  if (req.xhr) {
    return res.send(logMessage);
  }
  if (req.method === 'post') {
    req.flash('error', logMessage);
    let redirectTo = err.redirectTo || req.url;
    res.redirect(redirectTo);
    return;
  }

  res.render(view, {
    status: statusCode,
    message: logMessage
  });
};
