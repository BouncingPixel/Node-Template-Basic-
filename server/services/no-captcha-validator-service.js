const axios = require('axios');
const nconf = require('nconf');
const logger = require('winston');

const captchaVerifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

module.exports = function isValidCaptcha(captchaResponse) {
  if (!nconf.get('nocaptchaSecret') || nconf.get('nocaptchaBypass')) {
    return Promise.resolve(true);
  }

  const postVars = 'secret=' + nconf.get('nocaptchaSecret') + '&response=' + captchaResponse;

  return axios.post(captchaVerifyUrl, postVars, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(function(response) {
    return response.data.success;
  }).catch(function(response) {
    logger.warn(response);
    return false;
  });
};
