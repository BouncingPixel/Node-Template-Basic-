'use strict';

const nconf = require('nconf');

// need the express package
const express = require('express');
const router = express.Router();

// require all controllers and middleware in
const controllers = require('../controllers/');
// const middlewares = require('../middlewares/');

let authAdapter = null;
try {
  authAdapter = require('@bouncingpixel/passport-auth')();
} catch (_e) {
  authAdapter = null;
}

if (!authAdapter) {
  module.exports = null;
  return;
}

module.exports = router;

const authMiddlewares = authAdapter.middlewares;
const AuthController = controllers.AuthController;

// if rememberme is not desired, remove it from the chain
// if you wanted always remember-me, then rig the form to always pass rememberme to be true/"true"
router.post(
  '/login',
  authMiddlewares.requireLoggedOut,
  authMiddlewares.login,
  // authMiddlewares.issueRememberMe,
  AuthController.login,
  AuthController.failedLogin
);

// this could be a passwordless login or a forgotten token
// forgotten token is a passwordless style, but may have some extras to let the user change their password
router.post(
  '/token',
  authMiddlewares.requireLoggedOut,
  authMiddlewares.tokenLogin,
  AuthController.token,
  AuthController.failedToken
);

router.get('/logout', authMiddlewares.logout, AuthController.logout);
router.post('/logout', authMiddlewares.logout, AuthController.logout);

if (authMiddlewares.facebookStart) {
  router.get('/facebook', authMiddlewares.facebookStart);
  router.get('/facebook/callback', authMiddlewares.facebookCallback, AuthController.oathPostRedirect);
}

if (authMiddlewares.googleStart) {
  router.get('/google', authMiddlewares.googleStart);
  router.get('/google/callback', authMiddlewares.googleCallback, AuthController.oathPostRedirect);
}

if (authMiddlewares.twitterStart) {
  router.get('/twitter', authMiddlewares.twitterStart);
  router.get('/twitter/callback', authMiddlewares.twitterCallback, AuthController.oathPostRedirect);
}

if (authMiddlewares.linkedinStart) {
  router.get('/linkedin', authMiddlewares.linkedinStart);
  router.get('/linkedin/callback', authMiddlewares.linkedinCallback, AuthController.oathPostRedirect);
}
