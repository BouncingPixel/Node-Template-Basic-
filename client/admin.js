import $ from 'jquery';

import 'jquery-ui';
import 'trumbowyg';
import 'materialize';
import 'datatables';

import '../libs/pixel-validate/browser.js';

import dust from 'dustjs-linkedin';
import dustHelperLoader from '../libs/dust-helpers';
dustHelperLoader(dust);

$('.button-collapse').sideNav({'edge': 'left'});
$('select').not('.disabled').material_select();

$.trumbowyg.svgPath = '/images/trumbowyg-icons.svg';

$('.wyssimpleeditor').trumbowyg({
  btns: [['bold', 'italic', 'underline'], ['link'], ['unorderedList', 'orderedList'], ['superscript', 'subscript'], ['horizontalRule']],
  removeformatPasted: true,
  resetCss: true
});

$('.datepicker').pickadate({
  selectMonths: true,
  selectYears: 5,
  format: 'mm/dd/yyyy'
});

/*
// example using dust:
const myDustFile = require('../../views/some-dust-file.dust');
  dust.render(prodOptionRow, context, function(err, result) {
    if (err) {
      return;
    }

    $('#mydiv').append(result);
  });
*/

// example form validation:
const UserSchema = require('../schemas/user');
$('#usereditform').pixelValidate(UserSchema);
