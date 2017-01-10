'use strict';

// need the express package
const express = require('express');
const router = express.Router();
module.exports = router;

// require all controllers and middleware in
const controllers = require('./controllers/');
const middleware = require('./middleware/');

// some helpers
const wrapAsync = require('./utils/wrap');
const renderStaticPage = require('./utils/renderStaticPage');

// if rememberme is not desired, remove it from the chain
// if you wanted always remember-me, then rig the form to always pass rememberme to be true/"true"
router.post('/login', PassportController.login, PassportController.issueRememberMe, function(req, res) {
  // what to do on successful login?
  // redirect? send a JSON?
}, function(err, req, res, next) {
  // what to do on failed login?
});

// this could be a passwordless login or a forgotten token
// forgotten token is a passwordless style, but may have some extras to let the user change their password
router.post('/token', PassportController.passwordlessLogin, function(req, res) {
  // what to do on successful login?
}, function(err, req, res, next) {
  // what to do on failed login?
});
router.post('/logout', PassportController.logout, function(req, res) {
  // the session stuff is done
  res.redirect('/');
});
