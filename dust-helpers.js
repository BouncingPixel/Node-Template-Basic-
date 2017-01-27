(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['dust.core', 'moment', 'pluralize'], factory);
  } else if (typeof exports === 'object') {
    // not true UMD here, but it's how Adaro needs it
    module.exports = factory(require('dustjs-linkedin'), require('moment'), require('pluralize'));
  }
}(this, function(dust, moment, pluralize) {
  var states = {
    AL: 'Alabama',
    AK: 'Alaska',
    AZ: 'Arizona',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DE: 'Delaware',
    DC: 'District Of Columbia',
    FL: 'Florida',
    GA: 'Georgia',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PA: 'Pennsylvania',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming'
  };

  dust.helpers.stateSelector = function(chunk, context, bodies, params) {
    var selectedState = params.selectedState || '';

    chunk.write('<select ');
    if (params.selectID) {
      chunk.write('id="');
      chunk.write(params.selectID);
      chunk.write('" ');
    }
    if (params.selectClass) {
      chunk.write('class="');
      chunk.write(params.selectClass);
      chunk.write('" ');
    }
    if (params.selectName) {
      chunk.write('name="');
      chunk.write(params.selectName);
      chunk.write('" ');
    }
    chunk.write('>');

    chunk.write('<option value=""');
    if (!selectedState || selectedState === '') {
      chunk.write(' selected');
    }
    chunk.write('>--</option>');

    for (var state in states) {
      chunk.write('<option value="');
      chunk.write(state);
      chunk.write('"');
      if (selectedState === state) {
        chunk.write(' selected');
      }
      chunk.write('>');
      chunk.write(states[state]);
      chunk.write('</option>');
    }

    chunk.write('</select>');
    return chunk;
  };

  dust.helpers.substr = function(chunk, context, bodies, params) {
    var value = params.value;

    if (value && typeof value === 'string') {
      var valueLength = value.length;

      var start = parseInt(params.start, 10) || 0;
      var length = parseInt(params.length, 10);
      var addElipsis = params.addElipsis || false;

      if (addElipsis && start > 0) {
        chunk.write('...');
      }
      chunk.write(value.substr(start, length));
      if (addElipsis && valueLength > length+start) {
        chunk.write('...');
      }

      return chunk;
    }

    return chunk.write(value);
  };

  dust.helpers.wordlimit = function(chunk, context, bodies, params) {
    var value = params.value;
    var limit = parseInt(params.limit, 10);
    if (typeof value === 'string') {
      var splitString = value.split(' ');
      if (splitString.length <= limit) {
        return value;
      } else {
        return splitString.slice(0, limit).join(' ') + '...';
      }
    }
    return value;
  };

  dust.helpers.some = function(chunk, context, bodies, params) {
    for (var prop in params) {
      if (params[prop]) {
        return true;
      }
    }
    return false;
  };

  dust.helpers.every = function(chunk, context, bodies, params) {
    for (var prop in params) {
      if (!params[prop]) {
        return false;
      }
    }
    return true;
  };

  //replaces \n char with <br> tag
  dust.helpers.nlToBr = function(chunk, context, bodies, params) {
    var escape = (params.escape !== 'false');
    var value = escape ? dust.filters.h(params.content) : params.content;
    if (typeof value === 'string') {
      value = value.replace(/\n/g, '<br>');
    }
    chunk.write(value);
    return chunk;
  };

  dust.helpers.expandableLessContent = function(chunk, context, bodies, params) {
    var escape = (params.escape !== 'false');
    var maxLength = params.maxLength || 250;
    var value = escape ? dust.filters.h(params.content) : params.content;

    if (typeof value === 'string') {
      if (value.length > maxLength) {
        var smallBody = value.substr(0, value.lastIndexOf(' ', maxLength));
        value = '<span class="lesscontent">' + smallBody + '... <a href="#" class="expandcontentlink">(more)</a></span>'
          + '<span class="morecontent hidden">' + value + ' <a href="#" class="shrinkcontentlink">(less)</a></span>';
      }

      value = value.replace(/\n/g, '<br>').replace(/\/n/g, '<br>');
    }
    chunk.write(value);
    return chunk;
  };

  dust.filters.numberShortener = function(value) {
    if (typeof value === 'string') {
      value = parseInt(value, 10);
    }

    if (value < 1000) {
      return value;
    } else {
      var abbrs = ['k', 'm', 'b', 't', 'q'];

      for (var i = 0; i < abbrs.length; i++) {
        value = value / 1000;
        if (value < 1000) {
          var str = value.toFixed(1); // 999.999 rounds to 1000.0 100.0
          if (str.length < 6) { // 6 means 1000.0 which should just continue upward, caused by rounding
            if (str.length > 3) {
              str = value.toFixed();
            }
            return str + abbrs[i];;
          }
        }
      }

      // a fallback, use exponential just to keep it clean
      return value.toExponential(1);
    }
  };

  dust.filters.allowEmTags = function(value) {
    if (typeof value === 'string') {
      return value.replace(/&lt;em\&gt;/gi, '<em>').replace(/&lt;\/em\&gt;/gi, '</em>');
    }

    return value;
  };

  dust.helpers.commaSep = function(chunk, context, bodies, params) {
    var value = parseInt(params.value, 10).toString();

    value = value.split('').reverse().join('');
    value = value.replace(/.{3}(?!$)/g, function(match) {
      return match + ',';
    });
    value = value.split('').reverse().join('');

    return value;
  };

  dust.helpers.pluralize = function(chunk, context, bodies, params) {
    var value = params.value;
    var count = parseInt(params.count, 10) || 0;

    var sub = params.sub;
    if (sub) {
      count = count - parseInt(sub, 10);
    }

    if (typeof value === 'string') {
      return pluralize(value, count);
    }
    return value;
  };

  dust.helpers.thisYear = function(chunk, context, bodies, params) {
    var today = new Date();
    return today.getFullYear();
  };

  dust.filters.timeago = function(value) {
    if (typeof value === 'string' || value instanceof Date) {
      var time = moment.utc(value);
      var now = moment();

      var diff = now.diff(time);

      if (diff < 60000) {
        return 'a few seconds ago';
      } else {
        return time.from(now);
      }
    }
    return value;
  };

  dust.filters.dateToISO = function(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  };

  dust.filters.fullDateTime = function(value) {
    if (typeof value === 'string' || value instanceof Date) {
      var time = moment.utc(value);
      return time.format('MMMM Do YYYY, h:mm a');
    }
    return value;
  };

  dust.filters.fullDate = function(value) {
    if (typeof value === 'string' || value instanceof Date) {
      var time = moment.utc(value);
      return time.format('MMMM Do YYYY');
    }
    return value;
  };

  dust.filters.usdate = function(value) {
    if (typeof value === 'string' || value instanceof Date) {
      var time = moment.utc(value);
      return time.format('MM/DD/YYYY');
    }
    return value;
  };

  dust.filters.capitalizeWords = function(value) {
    if (typeof value === 'string') {
      return value.split(' ').map(function(s){return s.charAt(0).toUpperCase() + s.slice(1);}).join(' ');
    }
    return value;
  };

}));
