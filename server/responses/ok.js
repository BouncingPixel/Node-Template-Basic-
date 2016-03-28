'use strict';

var logger = require('winston');

/**
 *
 * > Log Level: *info*
 *
 * #### HTTP Status: 200
 *
 * @method res.ok
 * @param {Object} data data to send to `view` or as JSON
 * @param {String} [options] an *optional* view that gets passed `data` for rendering
 *
 *
 * ___
 */

module.exports = function sendOK(data, options) {

  var req = this.req;
  var res = this.res;

  logger.silly('res.ok() :: Sending 200 ("OK") response');

  // Set status code
  res.status(200);

  // If appropriate, serve data as JSON(P)
  if (req.wantsJSON) {
    res.jsonp(data);
    return;
  }

  // If second argument is a string, we take that to mean it refers to a view.
  // If it was omitted, use an empty object (`{}`)
  options = (typeof options === 'string') ? {view: options} : options || {};

  // If a view was provided in options, serve it.
  if (options.view) {
    res.render(options.view, {data: data});
  }  else {
    res.jsonp(data);
  }

};
