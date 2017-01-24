const axios = require('axios');
const nconf = require('nconf');
const logger = require('winston');

const captchaVerifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

module.exports = function requireNocaptcha(req, res, next) {
  if (!nconf.get('nocaptchaSecret') || nconf.get('nocaptchaBypass')) {
    return next();
  }

  const captchaResponse = req.body['g-recaptcha-response'];
  const postVars = 'secret=' + nconf.get('nocaptchaSecret') + '&response=' + captchaResponse;

  axios.post(captchaVerifyUrl, postVars, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(function(response) {
    if (response.data.success) {
      return next();
    } else {
      return next(ServerErrors.BadRequest('Unable to validate captcha'));
    }
  }).catch(function(response) {
    logger.warn(response);
    return next(ServerErrors.ServerError('A server error has occurred'));
  });
};
