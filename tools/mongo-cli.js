'use strict';

const fs = require('fs');
const path = require('path');

// Ensure the current directory, so relative paths work as expected
process.chdir(path.resolve(__dirname, '..'));

if (process.env.DEV_MODE === 'true') {
  process.env.NODE_ENV = 'development';
}

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
    imgixUrl: 'https://gamealert.imgix.net/',

    maxFailTries: 5, // after this many tries, start locks
    maxLockTime: 1 * 3600 * 1000 // maximum amount of a time an account may be locked for
  });

const bluebird = require('bluebird');
const mongoose = require('mongoose');
mongoose.Promise = bluebird;

const winston = require('winston');
winston.level = 'debug';

// never include anything that may include a model before mongoose has connected

Promise
  .resolve(true)
  .then(() => {
    // load up mongoose. may even need to load other things
    winston.debug('Connect to mongoose database');
    return mongoose.connect(nconf.get('mongoConnectStr'), {
      autoindex: process.env.NODE_ENV !== 'production',
      server: {
        sslCert: fs.readFileSync('./mongo.cert')
      }
    });
  })
  .then(() => {
    // pre-load all models
    const modelDirectory = path.resolve(__dirname, '../server/models');
    const potentialModels = fs.readdirSync(modelDirectory).filter(isJsAndNotIndex).map((model) => model.substring(0, model.length - 3));

    return potentialModels.map((modelFile) => {
      return require('../server/models/' + modelFile);
    });
  })
  .then((models) => {
    const repl = require('repl').start({
      prompt: 'Mongoose $ '
    });

    models.forEach((model) => {
      const name = model.modelName;
      console.log('Exposing model:', name);
      repl.context[name] = model;
    });

    repl.on('reset', function(context) {
      models.forEach((model) => {
        const name = model.modelName;
        context[name] = model;
      });
    });
  })
  .catch((error) => {
    winston.error('Failed to load REPL');
    winston.error(error);
    process.exit(1);
  });

function isJsAndNotIndex(file) {
  return file.substring(file.length - 3) === '.js' && file !== 'index.js';
}
