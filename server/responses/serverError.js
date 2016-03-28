'use strict';

module.exports = require('./responseFactory')(500,
  'Sending empty 500 ("Internal Server Error") response',
  'errors/500');
