'use strict';

// need the express package
const express = require('express');
const router = express.Router();
module.exports = router;

// require all controllers and middleware in
const controllers = require('../controllers/');
const middleware = require('../middlewares/');

const PassportService = require('../services/passport-service');
const AuthController = controllers.AuthController;

const RequireLoggedOut = middleware.RequireLoggedOut;

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

router.post('/logout', PassportService.logout, AuthController.logout);
