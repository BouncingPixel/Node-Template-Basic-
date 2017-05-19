// this first is required to set up express
const express = require('express');
const router = express.Router();

// require all controllers and middleware in
// const controllers = require('../controllers/');
// const middlewares = require('../middlewares/');

let passportAuth = null;
try {
  passportAuth = require('@bouncingpixel/passport-auth')();
} catch (_e) {
  passportAuth = null;
}

if (!passportAuth) {
  console.log('no passport auth?');
  module.exports = null;
  return;
}

module.exports = router;

// some helpers
// const coWrapRoute = require('../utils/co-wrap-route');
// const renderPage = require('../utils/render-page');

// all admin routes are protected by requiring at least admin
router.use(passportAuth.middlewares.requireUserRole('admin'));
