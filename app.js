'use strict';

if (process.env.NEW_RELIC_APP_NAME && process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

/*
 * app.js - bootstrap
 * This connects to any databases and fires up the express server
 */

// Ensure the current directory, so relative paths work as expected
process.chdir(__dirname);

if (process.env.DEV_MODE === 'true') {
  process.env.NODE_ENV = 'development';
}

const path = require('path');

const nconf = require('nconf');
nconf.argv()
  .env()
  .file({ file: 'config/config.json' })
  .file({ file: 'config/local.json' })
  .defaults({
    PORT: 3000,
    requireHTTPS: false,
    logLevel: 'debug',
    redirectOn401: '/login',
    sessionSecret: 'iamakeyboardcatbutnotreally',

    webpackConfigPath: path.resolve(__dirname, 'webpack.config.js'),

    maxFailTries: 3, // after this many tries, start locks
    maxLockTime: 1 * 3600 * 1000, // maximum amount of a time an account may be locked for

    // Be sure to set other defaults here
    client: {
      imgixUrl: 'MYSITE.imgix.net/'
    }
  });

let databaseAdapter = null;
try {
  databaseAdapter = require('@bouncingpixel/mongoose-db');
} catch (_e) {
  databaseAdapter = null;
}
if (databaseAdapter) {
  try {
    const authAdapterImpl = databaseAdapter.passportImplFactory(require('./server/models/user'));
    require('@bouncingpixel/passport-auth')(authAdapterImpl);
  } catch (_e) {
    // if there is an error, then it may be there is no passport-auth, so ignore.
  }
}

const winston = require('winston');
winston.level = nconf.get('logLevel');

// never include anything that may include a model before mongoose has connected

Promise
  .resolve(true)
  .then(() => {
    // load up mongoose. may even need to load other things
    if (databaseAdapter) {
      winston.debug('Connect to database');
      return databaseAdapter.init();
    } else {
      return false;
    }
  })
  .then(() => {
    // load up the server
    require('./express-server');
  })
  .catch((error) => {
    winston.error('Failed to load web app');
    winston.error(error);
    process.exit(1);
  });
