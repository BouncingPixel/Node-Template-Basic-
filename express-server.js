// do the configuration bits that are static to all servers

// get the requires out of the way
const path = require('path');
const nconf = require('nconf');
const express = require('express');
const compression = require('compression');
const cons = require('consolidate');
const winston = require('winston');

const app = express();

winston.debug('Creating client side config in /js/config.js');

const cachedClientConfig = `(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('config', [], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    SiteConfig = factory();
  }
}(this, function() {
  return ${JSON.stringify(nconf.get('client'))};
}));`;

app.get('/js/config.js', function(req, res) {
  res.status(200).send(cachedClientConfig);
});

winston.debug('Configuring express for dust using consolidate');
app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('views', 'views');

// pre-initialize the dust renderer. necessary because it's possible we send an email before someone loads a page
cons.dust.render('notatemplate', {
  ext: app.get('view engine'),
  views: path.resolve(__dirname, app.get('views'))
}, function() { /* we don't care about the return, it's an error anyway. but Dust is ready now */ });
// require in our custom helpers, and pass in dust to attach the filters/helpers to
require('./dust-helpers')(cons.requires.dust);

// don't expose we use Express. need to know basis
app.set('x-powered-by', false);

// compression should be before the statics and other routes
app.use(compression());

winston.debug('Configuring routes for statics');
app.use(express.static('public'));

// require in the bits from the app
app.use(require('./server/'));

app.listen(nconf.get('PORT'), function() {
  winston.info(`App listening on port ${nconf.get('PORT')}`);
});

module.exports = app;
