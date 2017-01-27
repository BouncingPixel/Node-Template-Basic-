// do the configuration bits that are static to all servers

// get the requires out of the way
const nconf = require('nconf');
const express = require('express');
const compression = require('compression');
const dust = require('dustjs-linkedin');
const cons = require('consolidate');
const winston = require('winston');

const app = express();

winston.debug('Configuring express for dust using consolidate');
// require in the helpers, will expose them to dust for us
require('./dust-helpers');
app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('views', 'views');

// don't expose we use Express. need to know basis
app.set('x-powered-by', false);

// compression should be before the statics and other routes
app.use(compression());

winston.debug('Configuring routes for statics');
app.use(express.static('public'));

// require in the bits from the app
app.use(require('./server/'));

app.listen(nconf.get('port'), function() {
  console.log('App listening on port %s', nconf.get('port'));
});

module.exports = app;
