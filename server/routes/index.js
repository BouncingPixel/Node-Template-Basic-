const nconf = require('nconf');

// all the route files to be mounted and where they are mounted

exports['/'] = require('./site');

if (nconf.get('isAuthEnabled')) {
  // only load auth when enabled. Admin relies on auth routes, so it too must need auth enabled.
  exports['/auth'] = require('./auth');
  exports['/admin'] = require('./admin');
}

// example for an api or an admin
// exports['/api'] = require('./api');
