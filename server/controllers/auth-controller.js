'use strict';

module.exports = {
  login: function(req, res) {
    res.okRedirect({status: true}, '/admin/');
  },

  failedLogin: function(err, req, res, _next) {
    if (!req.wantsJSON) {
      req.flash(err.message);
    }
    res.okRedirect({status: false, error: err}, '/login');
  },

  token: function(req, res) {
    res.okRedirect({status: true}, '/');
  },

  failedToken: function(err, req, res, _next) {
    if (!req.wantsJSON) {
      req.flash(err.message);
    }
    res.okRedirect({status: false, error: err}, '/login');
  },

  logout: function(req, res) {
    res.okRedirect({status: true}, '/');
  }
};
