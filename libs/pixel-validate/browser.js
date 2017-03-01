/* eslint-env browser */

// export the validate method
// export a jquery plugin?

// jq plugin attaches to form on-submit
// if user defines their own on-submit before the plugin,
// they can pre-catch things and ignore if desired

const $ = require('jquery');
require('./jquery.serialize-object');

const validate = require('./validate');

module.exports = {
  validate: validate.validateAll,
  validateField: validate.validateField
};

$.fn.pixelValidate = function(Schema, _options) {
  return this.each(function(formIndex, formElement) {
    const form = $(formElement);

    $('[name]', form).not('button').on('change', function() {
      const field = $(this);

      const allData = form.serializeObject();

      const htmlPath = field.attr('name');
      const dotPath = htmlPathToDotPath(htmlPath);

      validate.validateField(allData, dotPath, Schema).then(function() {
        $(field).removeClass('invalid').addClass('valid');
      }).catch(function(errorInfo) {
        const message = errorInfo.message;

        field.addClass('invalid').removeClass('valid');
        field.next('.error-message').text(message);
        $(`[data-error-for="${htmlPath}"]`).text(message);
      });
    });

    $('button[type="submit"]', form).on('click', function(evt, shouldIgnore) {
      if (shouldIgnore === 'ignore-validation') {
        return true;
      }

      evt.preventDefault();

      const button = $(this);

      const data = form.serializeObject();

      validate.validateAll(data, Schema).then(function() {
        // hide any errors there were there originally
        $('.invalid', form).removeClass('invalid').addClass('valid');
        button.trigger('click', ['ignore-validation']);
      }).catch(function(err) {
        const errors = err.errors;
        // some errors may have been set before and no longer need to be, unset those ones
        $('.invalid', form).removeClass('invalid').addClass('valid');

        Object.keys(err.errors).forEach((prop) => {
          const errorInfo = errors[prop];

          const keypath = dotPathToHtmlPath(prop);

          const message = errorInfo.message;
          const field = $(`[name="${keypath}"]`);

          field.addClass('invalid').removeClass('valid');
          field.next('.error-message').text(message);
          // allow for people to use a data-error-for to relocate errors
          $(`[data-error-for="${keypath}"]`).text(message);
        });

        // focus and scroll to the issue
        const firstElement = $($('.invalid', form)[0]);
        firstElement.focus();

        const halfHeight = $(window).height() / 2;

        const elementTop = firstElement.offset().top - halfHeight;
        $('html, body').animate({ scrollTop: elementTop }, 500);
      });
    });

  });

};

function dotPathToHtmlPath(dotPath) {
  const parts = dotPath.split('.');
  return parts[0] + parts.slice(1).map(part => `[${part}]`).join('');
}

function htmlPathToDotPath(htmlPath) {
  const parts = htmlPath.split(']['); // leaves the first 2 together and the last with an ending ]

  if (parts.length) {
    const index = parts[0].indexOf('[');
    if (index !== -1) {
      const first = parts[0].substring(0, index);
      const last = parts[0].substring(index + 1);

      parts[0] = first;
      parts.splice(1, 0, last);
    }
  }

  // even if there was just the first two stuck together
  // this will still remove the ending ] from the 2nd one since it was injected during the above
  if (parts.length > 1) {
    const lastIndex = parts.length - 1;
    const lastPartStrLength = parts[lastIndex].length;
    parts[lastIndex] = parts[lastIndex].substr(0, lastPartStrLength - 1);
  }

  return parts.join('.');
}
