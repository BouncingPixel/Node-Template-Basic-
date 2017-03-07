SystemJS.config({
  baseURL: './',

  packageConfigPaths: ['./node_modules/*/package.json'],

  paths: {
    client: './client',
    libs: './libs',
    schemas: './schemas'
  },

  packages: {
    client: {
      defaultExtensions: 'js'
    },
    './client/admin': {
      defaultExtensions: 'js'
    },
    './public/libs': {
      defaultExtensions: 'js'
    },
    './libs': {
      defaultExtensions: 'js'
    },
    './libs/pixel-validate': {
      defaultExtensions: 'js'
    },
    schemas: {
      defaultExtensions: 'js'
    },
    'node_modules': {
      defaultExtensions: 'js'
    }
  },

  map: {
    'plugin-dust': './node_modules/plugin-dust/dust.js',
    'plugin-babel': './node_modules/systemjs-plugin-babel/plugin-babel.js',
    'systemjs-babel-build': './node_modules/systemjs-plugin-babel/systemjs-babel-browser.js',

    'swal': 'https://cdn.jsdelivr.net/sweetalert2/4.0.6/sweetalert2.min.js',
    'jquery': 'https://code.jquery.com/jquery-3.1.0.min.js',
    'trumbowyg': 'https://cdnjs.cloudflare.com/ajax/libs/Trumbowyg/2.4.2/trumbowyg.min.js',
    'datatables': 'https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js',
    'hammerjs': 'https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.js',

    'jquery-ui': './public/libs/jquery-ui.js',
    'materialize': './public/libs/materialize.min.js',
    'mongoose': './public/libs/mongoose.js',
    'slidebars': './public/libs/slidebars.min.js',

    'axios': './node_modules/axios/dist/axios.min.js',
    'dustjs-linkedin': './node_modules/dustjs-linkedin/dist/dust-full.min.js',
    'validator': './node_modules/validator/validator.js',
    'moment': './node_modules/moment/moment.js',
    'pluralize': './node_modules/pluralize/pluralize.js'
  },

  meta: {
    '/client/*': {
      loader: 'plugin-babel'
    },
    'mongoose': {
      format: 'global',
      exports: 'mongoose',
      deps: []
    },
    './node_modules/dustjs-linkedin/dist/dust-full.min.js': {
      format: 'global',
      exports: 'dust'
    },
    './views/*': {
      loader: 'plugin-dust'
    },
    './public/libs/materialize.min.js': {
      format: 'global',
      deps: ['jquery', 'hammerjs']
    }
  }
});
