const $ = require('jquery'); // eslint-disable-line no-unused-vars
require('./main/slidebars');

const axios = require('axios');
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const dust = require('dustjs-linkedin/lib/dust');
require('dustjs-helpers');

const stringHelpers = require('@bouncingpixel/dust-helpers/src/string-helpers');
// '@bouncingpixel/dust-helpers/src/date-helpers'
// '@bouncingpixel/dust-helpers/src/other-helpers'
// '@bouncingpixel/dust-helpers/src/array-helpers'
// '@bouncingpixel/dust-helpers/src/imgix-helpers'
// '@bouncingpixel/dust-helpers/src/usstate-helpers'
stringHelpers(dust);
