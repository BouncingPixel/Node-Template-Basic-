'use strict';

var responses = {
  badRequest: require('./badRequest'),
  forbidden: require('./forbidden'),
  banned: require('./banned'),
  negotiate: require('./negotiate'),
  notFound: require('./notFound'),
  ok: require('./ok'),
  okRedirect: require('./okRedirect'),
  serverError: require('./serverError')
};

module.exports = function(req, res, next) {
  for (var prop in responses) {
    res[prop] = responses[prop].bind({req: req, res: res, next: next});
  }
  next();
};
