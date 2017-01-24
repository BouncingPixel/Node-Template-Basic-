// this first is required to set up express
const express = require('express');
const router = express.Router();
module.exports = router;

// require all controllers and middleware in
const controllers = require('../controllers/');
const middleware = require('../middlewares/');

// some helpers
const coWrapRoute = require('../utils/co-wrap-route');
const renderStaticPage = require('../utils/render-static-page');

// define routes below
// router.get('/', controllers.FooController.index);
