const $ = require('jquery');

$('.button-collapse').sideNav({'edge': 'left'});
$('select').not('.disabled').material_select();

$.trumbowyg.svgPath = '/images/trumbowyg-icons.svg';

$('.wyssimpleeditor').trumbowyg({
  btns: [['bold', 'italic'], ['link']]
});
