'use strict';

const nconf = require('nconf');
const passport = require('passport');

// need the express package
const express = require('express');
const router = express.Router();
module.exports = router;

// require all controllers and middleware in
const controllers = require('../controllers/');
const middlewares = require('../middlewares/');

const PassportService = require('../services/passport-service');
const AuthController = controllers.AuthController;

const RequireLoggedOut = middlewares.RequireLoggedOut;

// if rememberme is not desired, remove it from the chain
// if you wanted always remember-me, then rig the form to always pass rememberme to be true/"true"
router.post(
  '/login',
  RequireLoggedOut,
  PassportService.login,
  PassportService.issueRememberMe,
  AuthController.login,
  AuthController.failedLogin
);

// this could be a passwordless login or a forgotten token
// forgotten token is a passwordless style, but may have some extras to let the user change their password
router.post(
  '/token',
  RequireLoggedOut,
  PassportService.passwordlessLogin,
  AuthController.token,
  AuthController.failedToken
);

router.get('/logout', PassportService.logout, AuthController.logout);
router.post('/logout', PassportService.logout, AuthController.logout);

if (nconf.get('sso:facebook:appid') && nconf.get('sso:facebook:secret')) {
  router.get('/facebook', passport.authenticate('facebook', {scope: ['email', 'public_profile']}));
  router.get('/facebook/callback', passport.authenticate('facebook'), AuthController.oathPostRedirect);
}

if (nconf.get('sso:google:clientid') && nconf.get('sso:google:secret')) {
  router.get('/google', passport.authenticate('google', {scope: ['email', 'profile']}));
  router.get('/google/callback', passport.authenticate('google'), AuthController.oathPostRedirect);
}

if (nconf.get('sso:twitter:key') && nconf.get('sso:twitter:secret')) {
  router.get('/twitter', passport.authenticate('twitter', {scope: ['email']}));
  router.get('/twitter/callback', passport.authenticate('twitter'), AuthController.oathPostRedirect);
}

if (nconf.get('sso:linkedin:key') && nconf.get('sso:linkedin:secret')) {
  router.get('/linkedin', passport.authenticate('linkedin', {scope: ['r_basicprofile', 'r_emailaddress']}));
  router.get('/linkedin/callback', passport.authenticate('linkedin'), AuthController.oathPostRedirect);
}
