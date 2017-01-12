'use strict';

const async = require('async');
const bluebird = require('bluebird');
const path = require('path');
const nconf = require('nconf');

const dust = require('dustjs-linkedin');
const emailTemplatesPath = '../emailTemplates/';

const domain = nconf.get('mailgunDomain');
var mailgun = null;
if (domain && nconf.get('mailgunApiKey')) {
  mailgun = require('mailgun-js')({apiKey: nconf.get('mailgunApiKey'), domain: domain});
}

function formatEmailAddress(person) {
  if (typeof person === 'string') {
    return person;
  }
  return person.name + '<' + person.email + '>';
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

var templateCache = {};

module.exports = bluebird.promisifyAll({

  /*
   * options must have:
   * - template: String
   * - recipients: [User] optional if the template pre-defines the To field
   * - *: really anything that is needed for the template
   */
  sendTemplateEmail: function(opts, done) {
    if (!opts) {
      return done(null);
    }

    if (!mailgun) {
      return done(null);
    }

    var templateName = opts.template;

    if (!templateCache[templateName]) {
      templateCache[templateName] = require(path.resolve(__dirname, '..', 'emails', templateName));
    }
    var template = templateCache[templateName];

    if (!template) {
      return done(null);
    }

    var recipients = getValue(template.to, opts) ||
      opts.recipients.filter(function(person) {
        if (typeof person === 'string') {
          return true;
        }

        return !(person.emailOptOut && (person.emailOptOut === true || person.emailOptOut[templateName]));
      });

    if (!recipients.length) {
      return done(null);
    }

    var toEmails = recipients.map(formatEmailAddress);

    var fromEmail = getValue(template.from, opts) || 'noreply@smallcellsite.com';

    var individualVars = recipients.reduce(function(obj, recipient) {
      var mergeVars = template.individualVars(recipient, opts);
      if (mergeVars) {
        obj[recipient.email] = mergeVars;
      }
      return obj;
    }, {});

    var subject = getValue(template.subject, opts);

    async.waterfall([
      function(callback) {
        var locals = template.mergeVars(opts);
        locals.emailurl = nconf.get('siteDomain');
        var renderOptions = {
          view: null,
          views: emailTemplatesPath,
          name: templateName,
          ext: '.dust',
          locals: locals
        };
        var context = dust.context({}, renderOptions).push(locals);
        var templatePath = path.resolve(__dirname, '..', 'emails', templateName);
        dust.render(templatePath, context, callback);
      },

      function(htmlContent, callback) {
        if (!htmlContent || !htmlContent.length) {
          callback(new Error('No content to send'));
          return;
        }

        var dataToSend = {
          from: fromEmail,
          to: toEmails,
          subject: subject,
          'recipient-variables': individualVars,
          html: htmlContent
        };

        mailgun.messages().send(dataToSend, callback);
      }
    ], function(err) {
      done(null);
    });
  }

});
