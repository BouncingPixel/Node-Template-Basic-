const $ = require('jquery');

const axios = require('axios');
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const dust = require('dustjs-linkedin/lib/dust');
require('dustjs-helpers');
const dustHelperLoader = require('../libs/dust-helpers');
dustHelperLoader(dust);

const sidebarMenuController = new slidebars();
sidebarMenuController.init();

$('#mobile-menu-toggle').on('click', function(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  sidebarMenuController.toggle('mobile-nav-canvas');
});

$('body').on('click', function(evt) {
  evt.stopPropagation();
  sidebarMenuController.close();
});
