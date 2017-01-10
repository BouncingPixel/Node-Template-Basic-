'use strict';

module.exports = function sendOK(data, options) {

  var req = this.req;
  var res = this.res;

  if (req.wantsJSON) {
    // Set status code
    res.status(200);

    return res.jsonp(data);
  }

  // If second argument is a string, we take that to mean it refers to a page URL.
  // If it was omitted, use an empty object (`{}`)
  options = (typeof options === 'string') ? {page: options} : options || {};

  // If a page was provided in options, redirect there.
  if (options.page) {
    return res.redirect(options.page);
  }  else {
    return res.jsonp(data);
  }

};
