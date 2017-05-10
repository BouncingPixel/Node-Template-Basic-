const nconf = require('nconf');
// Controllers

if (nconf.get('isAuthEnabled')) {
  exports.AuthController = require('./auth-controller');
  exports.DatatableController = require('./datatable-controller');
}

exports.FooController = require('./foo-controller');
