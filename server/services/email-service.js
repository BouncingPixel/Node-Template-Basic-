'use strict';

const async = require('async');
const bluebird = require('bluebird');
const path = require('path');
const nconf = require('nconf');
const logger = require('winston');

const dust = require('dustjs-linkedin');
const emailTemplatesPath = '../emails/';

const defaultFrom = nconf.get('mailgunDefaultFrom');
const domain = nconf.get('mailgunDomain');
const mailgun = (domain && nconf.get('mailgunApiKey')) ?
    require('mailgun-js')({apiKey: nconf.get('mailgunApiKey'), domain: domain}) :
    null;

function formatEmailAddress(person) {
  if (typeof person === 'string') {
    return person;
  }
  return `${person.name} <${person.email}>`;
}

function getValue(item, opts) {
  if (!item) {
    return null;
  }

  if (item instanceof Function) {
    return item(opts);
  }

  return item;
}

let templateCache = {};

module.exports = bluebird.promisifyAll({

  /*
   * options must have:
   * - template: String
   * - recipients: [User] optional if the template pre-defines the To field
   * - *: really anything that is needed for the template
   */
  sendTemplateEmail: function(opts, done) {
    if (!opts) {
      logger.warn('No options were sent, ignoring email request');
      return done(null);
    }

    if (!mailgun) {
      logger.warn('Mailgun is not configured, ignoring email request');
      return done(null);
    }

    const templateName = opts.template;

    if (!templateCache[templateName]) {
      templateCache[templateName] = require(path.resolve(__dirname, '..', 'emails', templateName));
    }
    const template = templateCache[templateName];

    if (!template) {
      logger.warn(`Template '${templateName}' was not found, ignoring email request`);
      return done(null);
    }

    // get everyone defined in the .to of the template and concat with any extra recipients listed in the options
    const recipients = (getValue(template.to, opts) || []).concat(
      (opts.recipients || []).filter(function(person) {
        if (typeof person === 'string') {
          return true;
        }

        return !(person.emailOptOut && (person.emailOptOut === true || person.emailOptOut[templateName]));
      }));

    if (!recipients.length) {
      logger.warn('No recipients to send to, ignoring email request');
      return done(null);
    }

    const toEmails = recipients.map(formatEmailAddress);

    const fromEmail = getValue(template.from, opts) || defaultFrom;
    if (!fromEmail || !fromEmail.length) {
      logger.warn('No from email, ignoring email request');
      return done(null);
    }

    const individualVars = recipients.reduce(function(obj, recipient) {
      const mergeVars = template.individualVars(recipient, opts);
      if (mergeVars) {
        obj[recipient.email] = mergeVars;
      }
      return obj;
    }, {});

    const subject = getValue(template.subject, opts);

    async.waterfall([
      function(callback) {
        let locals = template.mergeVars(opts);
        locals.emailurl = nconf.get('siteDomain');
        const renderOptions = {
          view: null,
          views: emailTemplatesPath,
          name: templateName,
          ext: '.dust',
          locals: locals
        };
        const context = dust.context({}, renderOptions).push(locals);
        const templatePath = path.resolve(__dirname, '..', 'emails', templateName);
        dust.render(templatePath, context, callback);
      },

      function(htmlContent, callback) {
        if (!htmlContent || !htmlContent.length) {
          callback(new Error('No content to send'));
          return;
        }

        const dataToSend = {
          from: fromEmail,
          to: toEmails,
          subject: subject,
          'recipient-variables': individualVars,
          html: htmlContent
        };

        mailgun.messages().send(dataToSend, callback);
      }
    ], function(err) {
      // we only log mail errors, but silently ignore for the user, so their request continues
      if (err) {
        logger.warn(err);
      }
      done(null);
    });
  }

});
