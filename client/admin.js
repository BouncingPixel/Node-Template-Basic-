const $ = require('jquery');
const dust = require('dustjs-linkedin');
require('../dust-helpers')(dust);
require('../libs/pixel-validate/browser');

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

$('.button-collapse').sideNav({'edge': 'left'});
$('select').not('.disabled').material_select();

$.trumbowyg.svgPath = '/images/trumbowyg-icons.svg';

$('.wyssimpleeditor').trumbowyg({
  btns: [['bold', 'italic', 'underline', 'strikethrough'], ['link'], ['unorderedList', 'orderedList']],
  removeformatPasted: true,
  resetCss: true
});
