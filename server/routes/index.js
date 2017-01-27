
// all the route files to be mounted and where they are mounted

exports['/'] = require('./site');
exports['/auth'] = require('./auth');
exports['/admin'] = require('./admin');

// example for an api or an admin
// exports['/api'] = require('./api');
