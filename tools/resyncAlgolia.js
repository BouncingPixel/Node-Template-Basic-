'use strict';

const fs = require('fs');
const path = require('path');

// Ensure the directory is one up from tools, so relative paths work as expected
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
    port: 3000,
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
winston.level = 'debug';

Promise
  .resolve(true)
  .then(() => {
    return mongoose.connect(nconf.get('mongoConnectStr'), {autoindex: process.env.NODE_ENV !== 'production'});
  })
  .then(() => {
    // read server/models
    const modelDirectory = path.resolve(__dirname, '../server/models');
    const potentialModels = fs.readdirSync(modelDirectory).filter(isJsAndNotIndex).map((model) => model.substring(0, model.length - 3));

    // load all models
    // filter by which ones have the algolia plugin enabled (look for: findInAlgolia)
    const Models = potentialModels.map((modelFile) => {
      return require('../server/models/' + modelFile);
    }).filter((Model) => Model.findInAlgolia != null);

    // clear that index
    return Promise.all(Models.map((Model) => {
      return Model.clearAlgoliaIndex();
    })).then(() => {
      // async series map, ex http://promise-nuggets.github.io/articles/15-map-in-series.html
      let current = Promise.resolve();

      Promise.all(Models.map(function(Model) {
        // schedule the next only after the previous/current has finished
        current = current.then(function() {
          return Model.find({}).cursor().eachAsync((doc) => {
            doc.saveToAlgolia();
          });
        });
        return current;
      }));
    });
  })
  .then(() => {
    winston.info('Finished!');
    process.exit();
  })
  .catch((error) => {
    winston.error('Failed to run tool');
    winston.error(error);
    process.exit(1);
  });

function isJsAndNotIndex(file) {
  return file.substring(file.length-3) === '.js' && file !== 'index.js';
}
