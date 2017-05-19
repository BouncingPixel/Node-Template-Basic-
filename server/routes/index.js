// all the route files to be mounted and where they are mounted

exports['/'] = require('./site');

const authRouter = require('./auth');
const adminRouter = require('./admin');
if (authRouter) {
  exports['/auth'] = authRouter;
}
if (adminRouter) {
  exports['/admin'] = adminRouter;
}

// example for an api or an admin
// exports['/api'] = require('./api');
