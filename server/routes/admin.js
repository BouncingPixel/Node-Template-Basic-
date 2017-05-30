// this first is required to set up express
const express = require('express');
const router = express.Router();

// require all controllers and middleware in
// const AdminController = require('../controllers/admin-controller');

let passportAuth = null;
try {
  passportAuth = require('@bouncingpixel/passport-auth')();
} catch (_e) {
  passportAuth = null;
}

if (!passportAuth) {
  module.exports = null;
  return;
}

module.exports = router;

// all admin routes are protected by requiring at least admin
router.use(passportAuth.middlewares.requireUserRole('admin'));
