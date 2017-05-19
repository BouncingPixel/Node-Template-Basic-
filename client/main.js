const $ = require('jquery');
require('./main/slidebars');

const axios = require('axios');
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const dust = require('dustjs-linkedin/lib/dust');
require('dustjs-helpers');

const stringHelpers = require('@bouncingpixel/dust-helpers/string-helpers');
// '@bouncingpixel/dust-helpers/date-helpers'
// '@bouncingpixel/dust-helpers/other-helpers'
// '@bouncingpixel/dust-helpers/array-helpers'
// '@bouncingpixel/dust-helpers/imgix-helpers'
// '@bouncingpixel/dust-helpers/usstate-helpers'
stringHelpers(dust);
