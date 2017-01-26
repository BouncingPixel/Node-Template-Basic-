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
    // read server/models
    const modelDirectory = path.resolve(__dirname, '../server/models');
    const potentialModels = fs.readdirSync(modelDirectory).filter(isJsAndNotIndex).map((model) => model.substring(0, model.length - 3));

    // ask the user which model are they entering data for
    // console.log('which model do you wish to use?');
    // potentialModels.forEach((model, i) => {
    //   const index = i + 1;
    //   const str = model.substring(0, model.length - 3);
    //   console.log(`${index}. ${str}`);
    // });

    return inquirer.prompt([{
      type: 'list',
      name: 'model',
      message: 'Please choose which model you wish to create for',
      choices: potentialModels
    }]).then((modelResults) => {
      const modelFile = modelResults.model;
      console.log('Creating a new', modelFile);

      // pull in that model
      const Model = require('../server/models/' + modelFile);
      const schema = Model.schema.obj;

      // build the prompt info with the schema
      const keys = Object.keys(schema).filter(key => schema[key].required || !!schema[key].default);

      const promptSettings = keys.reduce((questions, key) => {
        const schemaProp = schema[key];

        const messageForDefault = schemaProp.default ? `  [${schemaProp.default}]` : '';
        const messageForRequired = schemaProp.required ? `*` : '';

        let keyProps = {
          name: key,
          message: `${key}${messageForRequired}${messageForDefault}: `
        };

        if (schemaProp.default) {
          keyProps.default = schemaProp.default;
        }

        // let errorMessage = `Invalid entry for ${key}`;

        if (schemaProp.type === String) {
          keyProps.type = 'string';
          keyProps.type = 'input';

          if (schemaProp.minlength && schemaProp.maxlength) {
            const minLength = Array.isArray(schemaProp.minlength) ? schemaProp.minlength[0] : schemaProp.minlength;
            const maxLength = Array.isArray(schemaProp.maxlength) ? schemaProp.maxlength[0] : schemaProp.maxlength;

            keyProps.validate = function(str) {
              const len = str.length;
              if (len < minLength || len > maxLength) {
                return `${key} must be at least ${minLength} and at most ${maxLength}`;
              }

              return true;
            };
          } else if (schemaProp.minlength) {
            const minLength = Array.isArray(schemaProp.minlength) ? schemaProp.minlength[0] : schemaProp.minlength;

            keyProps.validate = function(str) {
              const len = str.length;
              if (len < minLength) {
                return `${key} must be at least ${minLength}`;
              }

              return true;
            };
          } else if (schemaProp.maxlength) {
            const maxLength = Array.isArray(schemaProp.maxlength) ? schemaProp.maxlength[0] : schemaProp.maxlength;

            keyProps.validate = function(str) {
              const len = str.length;
              if (len > maxLength) {
                return `${key} must be at most ${maxLength}`;
              }

              return true;
            };
          }
        } else if (schemaProp.type === Number) {
          keyProps.type = 'input';
          keyProps.type = 'number';
        } else if (schemaProp.type === Boolean) {
          keyProps.type = 'boolean';
          keyProps.type = 'confirm';
        } else {
          // skip dates and others for now?
          return questions;
        }

        if (Array.isArray(schemaProp.enum)) {
          keyProps.type = 'list';
          keyProps.choices = schemaProp.enum;
          // errorMessage = `${key} must be one of: [${schemaProp.enum.join(', ')}]`;
        } else if (key === 'password') {
          keyProps.type = 'password';
          // keyProps.replace = '*';
        }

        // keyProps.message = errorMessage;

        questions.push(keyProps);
        return questions;
      }, []);

      // console.log(promptSettings);

      // prompt the user for the data
      return inquirer.prompt(promptSettings).then((values) => {
        // create a new record and save it
        const data = new Model(values);

        console.log(data.toJSON());

        return inquirer.prompt([{
          type: 'confirm',
          name: 'ready',
          message: 'Do you wish to save this entry?'
        }]).then((shouldSave) => {
          if (shouldSave.ready) {
            return data.save();
          }

          return Promise.resolve();
        });
      });
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
