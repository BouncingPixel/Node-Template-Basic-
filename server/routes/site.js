// this first is required to set up express
const express = require('express');
const router = express.Router();
module.exports = router;

// require all controllers and middleware in
const controllers = require('./controllers/');
const middleware = require('./middleware/');

// some helpers
const wrapAsync = require('./utils/wrap');
const renderStaticPage = require('./utils/renderStaticPage');

router.get('/', controllers.FooController.index);
