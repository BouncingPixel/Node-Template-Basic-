'use strict';

// this is for Openshft, since it sets DEV_MODE, but still runs NODE_ENV in production
if (process.env.DEV_MODE === 'true') {
  process.env.NODE_ENV = 'development';
}

if (process.env.NODE_ENV === 'production' && process.env.NEW_RELIC_APP_NAME && process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

// Ensure the current directory, so relative paths work as expected
process.chdir(__dirname);

const nconf = require('nconf'); // eslint-disable-line no-unused-vars
const winston = require('winston');

const DefaultExpress = require('@bouncingpixel/default-express');

// if using a database, uncomment this part out:
// nconf.set('provider', {
//   databaseAdapter: require('@bouncingpixel/mongoose-db'),
//   sessionDatabase: require('@bouncingpixel/mongoose-db')
// });

// if using auth, uncomment this part out:
// const passportAuthImpl = require('@bouncingpixel/mongoose-passport-impl');
// passportAuthImpl.UserModel = require('./server/models/user');

// nconf.set('provider:passportAuthImpl', passportAuthImpl);
// nconf.set('provider:authAdapter', require('@bouncingpixel/passport-auth'));

DefaultExpress.init().catch(function(err) {
  winston.error(err);
});
