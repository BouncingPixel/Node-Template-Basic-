'use strict';

var responses = {
  ok: require('./ok'),
  okRedirect: require('./ok-redirect')
};

module.exports = function(req, res, next) {
  for (var prop in responses) {
    res[prop] = responses[prop].bind({req: req, res: res, next: next});
  }
  next();
};
