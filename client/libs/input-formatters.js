const $ = require('jquery');

const Cleave = require('cleave.js');
require('cleave.js/dist/addons/cleave-phone.us');

$.fn.formatInteger = function() {
  function autoFormatInteger(str) {
    if (str.length === 0) {
      return str;
    }

    var partialRegexes = [
      {rgx: /^(\d*)/, sliceEnd: 2},
    ];

    var numberParts = [];

    for (var i = 0; i < partialRegexes.length; i++) {
      var rgxInfo = partialRegexes[i];
      var matches = str.match(rgxInfo.rgx);

      if (matches) {
        numberParts = matches.slice(1, rgxInfo.sliceEnd);
        break;
      }
    }

    // cannot format it, not enough information
    if (!numberParts.length) {
      return str;
    }

    return numberParts.join('');
  }

  return this.each(function(indx, elem) {
    const $elem = $(elem);

    $elem.on('input', function() {
      $elem.val(autoFormatInteger($elem.val()));
    });
  });
};

$.fn.formatZip = function() {
  function autoFormatZip(zipCode) {
    if (zipCode.length === 0) {
      return zipCode;
    }

    var partialRegexes = [
      {rgx: /^(\d{5})(\-)?(\d{1,4})/, sliceEnd: 4},
      {rgx: /^(\d{5})(\-)/, sliceEnd: 3},
      {rgx: /^(\d{0,5})/, sliceEnd: 2},
    ];

    var numberParts = [];

    for (var i = 0; i < partialRegexes.length; i++) {
      var rgxInfo = partialRegexes[i];
      var matches = zipCode.match(rgxInfo.rgx);

      if (matches) {
        numberParts = matches.slice(1, rgxInfo.sliceEnd);
        break;
      }
    }

    // cannot format it, not enough information
    if (!numberParts.length) {
      return zipCode;
    }

    if (numberParts.length > 1) {
      numberParts[1] = '-';
    }

    return numberParts.join('');
  }

  return this.each(function(indx, elem) {
    const $elem = $(elem);

    $elem.on('input', function() {
      $elem.val(autoFormatZip($elem.val()));
    });
  });
};

$.fn.formatCvv = function() {
  function autoFormatCvv(str) {
    if (str.length === 0) {
      return str;
    }

    var partialRegexes = [
      {rgx: /^(\d{3})(\d)?/, sliceEnd: 3},
      {rgx: /^(\d{0,3})/, sliceEnd: 2},
    ];

    var numberParts = [];

    for (var i = 0; i < partialRegexes.length; i++) {
      var rgxInfo = partialRegexes[i];
      var matches = str.match(rgxInfo.rgx);

      if (matches) {
        numberParts = matches.slice(1, rgxInfo.sliceEnd);
        break;
      }
    }

    // cannot format it, not enough information
    if (!numberParts.length) {
      return str;
    }

    return numberParts.join('');
  }

  return this.each(function(indx, elem) {
    const $elem = $(elem);

    $elem.on('input', function() {
      $elem.val(autoFormatCvv($elem.val()));
    });
  });
};

$.fn.formatPrice = function() {
  function autoFormatPrice(str) {
    if (str.length === 0) {
      return str;
    }

    var partialRegexes = [
      {rgx: /^(\d+)(\.)(\d{1,2})/, sliceEnd: 4},
      {rgx: /^(\d+)(\.)/, sliceEnd: 3},
      {rgx: /^(\d*)/, sliceEnd: 2},
    ];

    var numberParts = [];

    for (var i = 0; i < partialRegexes.length; i++) {
      var rgxInfo = partialRegexes[i];
      var matches = str.match(rgxInfo.rgx);

      if (matches) {
        numberParts = matches.slice(1, rgxInfo.sliceEnd);
        break;
      }
    }

    // cannot format it, not enough information
    if (!numberParts.length) {
      return str;
    }

    return numberParts.join('');
  }

  return this.each(function(indx, elem) {
    const $elem = $(elem);

    $elem.on('input', function() {
      $elem.val(autoFormatPrice($elem.val()));
    });
  });
};

$('.input-phone').each(function(index, elem) {
  new Cleave(elem, {
    phone: true,
    delimiter: '-',
    phoneRegionCode: 'us'
  });
});
$('.input-cardnum').each(function(index, elem) {
  new Cleave(elem, {
    creditCard: true,
    onCreditCardTypeChanged: function(type) {
      $('.ccicon[data-cc]').removeClass('selectedcc');
      $(`.ccicon[data-cc="${type}"]`).addClass('selectedcc');
    }
  });
});
$('.input-expir').each(function(index, elem) {
  new Cleave(elem, {
    date: true,
    datePattern: ['m', 'y']
  });
});
$('.input-zip').formatZip();
$('.input-cvv').formatCvv();
$('.input-price').formatPrice();
$('.input-integer').formatInteger();
