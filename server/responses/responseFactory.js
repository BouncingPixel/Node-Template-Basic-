'use strict';

var winston = require('winston');

function _determineView(options, defaultView) {
  var view = defaultView;
  if (options) {
    if (typeof options === 'string') {
      view = options;
    } else if (options.view) {
      view = options.view;
    }
  }
  return view;
}

function _determineLogMessage(data, defaultMessage) {
  if (!data) {
    return defaultMessage;
  } else if (data instanceof Error) {
    return data.message;
  } else {
    return data.toString();
  }
}

module.exports = function(status, defaultError, defaultView) {
  return function(data, options) {
    // Get access to `req`, `res`
    var req = this.req;
    var res = this.res;

    if (data.name === 'ValidationError') {
      winston.info(JSON.stringify(data.errors));
    }

    // Set status code
    res.status(status);

    // Check Parameters
    var view = _determineView(options, defaultView);

    var logMessage = _determineLogMessage(data, defaultError);
    winston.info(logMessage);

    if (data.stack && (status !== 404 || status !== 402)) {
      if (status === 400) {
        winston.info(JSON.stringify({query: req.query, body: req.body}));
      }

      if (status >= 400) {
        winston.info(JSON.stringify(res.locals));
        winston.info(JSON.stringify(data.stack));
      } else {
        winston.debug(JSON.stringify(data.stack));
      }
    }

    if (!req.wantsJSON && view) {
      return res.render(view, {
        status: status,
        message: logMessage
      });
    } else {
      return res.jsonp(data);
    }
  };
};
