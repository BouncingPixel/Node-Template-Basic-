const path = require('path');

module.exports = {
  PORT: 3000,
  requireHTTPS: false,
  logLevel: 'debug',
  redirectOn401: '/login',
  sessionSecret: 'iamakeyboardcatbutnotreally',

  webpackConfigPath: path.resolve(__dirname, '../webpack.config.js'),

  maxFailTries: 3, // after this many tries, start locks
  maxLockTime: 1 * 3600 * 1000, // maximum amount of a time an account may be locked for

  // Be sure to set other defaults here
  client: {
    imgixUrl: 'MYSITE.imgix.net/'
  }
};
