'use strict';

var logger = require('winston');

module.exports = function sendOK(data, options) {

  var req = this.req;
  var res = this.res;

  if (req.wantsJSON) {
    logger.silly('res.okRedirect() :: Sending 200 ("OK") response');

    // Set status code
    res.status(200);

    return res.jsonp(data);
  }

  // If second argument is a string, we take that to mean it refers to a page URL.
  // If it was omitted, use an empty object (`{}`)
  options = (typeof options === 'string') ? {page: options} : options || {};

  // If a page was provided in options, redirect there.
  if (options.page) {
    // this is a good spot for flash if we want it
    logger.silly('res.okRedirect() :: Redirecting to page');
    return res.redirect(options.page);
  }  else {
    logger.warn('res.okRedirect() :: Sending 200 ("OK") response (no page defined)');
    return res.jsonp(data);
  }

};
