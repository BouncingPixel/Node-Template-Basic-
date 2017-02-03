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

const fs = require('fs');
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
    return mongoose.connect(nconf.get('mongoConnectStr'), {autoindex: process.env.NODE_ENV !== 'production'});
  })
  .then(() => {
    // pre-load all models
    const modelDirectory = path.resolve(__dirname, './server/models');
    const potentialModels = fs.readdirSync(modelDirectory).filter(isJsAndNotIndex).map((model) => model.substring(0, model.length - 3));

    potentialModels.map((modelFile) => {
      return require('./server/models/' + modelFile);
    }).filter((Model) => Model.findInAlgolia != null);
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

function isJsAndNotIndex(file) {
  return file.substring(file.length - 3) === '.js' && file !== 'index.js';
}
