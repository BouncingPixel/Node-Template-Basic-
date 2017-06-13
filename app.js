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

const winston = require('winston');

const DefaultExpress = require('@bouncingpixel/default-express');
DefaultExpress.init().catch(function(err) {
  winston.error(err);
});
