'use strict';

/*
 * app.js - bootstrap
 * This connects to any databases and fires up the express server
 */

// Ensure the current directory, so relative paths work as expected
process.chdir(__dirname);

if (process.env.DEV_MODE === 'true') {
  process.env.NODE_ENV = 'production';
}

const nconf = require('nconf');
nconf.argv()
  .env()
  .file({ file: 'config/local.json' })
  .defaults({
    port: 3000,
    requireSSL: false,
    logLevel: 'debug',
    redirectOn401: '/login',

    maxFailTries: 3, // after this many tries, start locks
    maxLockTime: 1 * 3600 * 1000, // maximum amount of a time an account may be locked for

    // Be sure to set other defaults here
  });

const bluebird = require('bluebird');
const mongoose = require('mongoose');
mongoose.Promise = bluebird;

const winston = require('winston');
winston.level = nconf.get('logLevel');

// never include anything that may include a model before mongoose has connected

Promise
  .resolve(true)
  .then(() => {
    // load up mongoose. may even need to load other things
    winston.debug('Connect to mongoose database');
    // return mongoose.connect(nconf.get('dbURL'), {autoindex: process.env.NODE_ENV !== 'production'});
    return Promise.resolve();
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
