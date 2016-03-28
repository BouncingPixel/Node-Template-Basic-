'use strict';

// need the express package
var express = require('express');

// require all your controllers in or use something like 'require-all'
var FooController = require('./controllers/foo-controller');
var BarController = require('./controllers/bar-controller');

// require all middlewares in
var requireLoggedIn = require('./middleware/require-logged-in');
var fetchSharedData = require('./middleware/fetch-shared-data');

// create the router to be mounted in server.js
var router = express.Router();

// define your routes
router.get('/', fetchSharedData, FooController.index);

router.post('/bar', BarController.doTheThing);

// don't forget to export the router for server.js to use
module.exports = router;
