const $ = require('jquery');
require('trumbowyg');
// require('materialize-css/dist/js/materialize.js');
require('../public/libs/materialize.min');
require('datatables');

const axios = require('axios');
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const dust = require('dustjs-linkedin/lib/dust');
require('dustjs-helpers');
const dustHelperLoader = require('../libs/dust-helpers');
dustHelperLoader(dust);

require('../libs/pixel-validate/browser.js');

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
