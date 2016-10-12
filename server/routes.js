'use strict';

// need the express package
var express = require('express');

// require all your controllers in or use something like 'require-all'
var PassportController = require('./controllers/PassportController');
// var BarController = require('./controllers/bar-controller');

// require all middlewares in
var requireLoggedIn = require('./middleware/requireLoggedIn');
// var fetchSharedData = require('./middleware/fetch-shared-data');

// create the router to be mounted in server.js
var router = express.Router();

// define your routes
router.get('/', fetchSharedData, FooController.index);

router.post('/login', PassportController.login, function(req, res) {
  // what to do on successful login?
}, function(err, req, res, next) {
  // what to do on failed login?
});
router.post('/token', PassportController.passwordlessLogin, function(req, res) {
  // what to do on successful login?
}, function(err, req, res, next) {
  // what to do on failed login?
});
router.post('/logout', PassportController.logout, function(req, res) {
  // what to do on successful logout?
});

// router.post('/bar', BarController.doTheThing);

// don't forget to export the router for server.js to use
module.exports = router;
