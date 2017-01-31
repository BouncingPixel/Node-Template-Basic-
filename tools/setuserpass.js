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

const inquirer = require('inquirer');

Promise
  .resolve(true)
  .then(() => {
    return mongoose.connect(nconf.get('mongoConnectStr'), {autoindex: process.env.NODE_ENV !== 'production'});
  })
  .then(() => {
    // ask for email and password
    return inquirer.prompt([{
      type: 'input',
      name: 'email',
      message: 'What is the user\'s email'
    }, {
      type: 'password',
      name: 'password',
      message: 'What is the new password'
    }]);
  })
  .then((results) => {
      const email = results.email.toLowerCase();
      const password = results.password;

      const User = require('../server/models/user');

      return User.findOne({email: email}).then((user) => {
        // user hooks will bcrypt for us
        user.password = password;
        return user.save();
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
