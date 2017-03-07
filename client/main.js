import $ from 'jquery';

import 'jquery-ui';
import slidebars from 'slidebars';

import '../libs/pixel-validate/browser.js';

import dust from 'dustjs-linkedin';
import dustHelperLoader from '../libs/dust-helpers';
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
