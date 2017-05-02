'use strict';

const postLoginUrl = '/';
const postLogoutUrl = '/';
const postErrorUrl = '/login';

module.exports = {
  login: function(req, res) {
    const redirectTo = (req.session.redirectto ? req.session.redirectto : null) || postLoginUrl;
    res.okRedirect(redirectTo, {status: true});
  },

  failedLogin: function(err, req, res, _next) {
    if (!req.wantsJSON) {
      req.flash(err.message);
    }
    res.okRedirect(postErrorUrl, {status: false, error: err});
  },

  token: function(req, res) {
    res.okRedirect(postLoginUrl, {status: true});
  },

  failedToken: function(err, req, res, _next) {
    if (!req.wantsJSON) {
      req.flash(err.message);
    }
    res.okRedirect(postErrorUrl, {status: false, error: err});
  },

  logout: function(req, res) {
    res.okRedirect(postLogoutUrl, {status: true});
  },

  oathPostRedirect: function(req, res) {
    if (req.user) {
      res.redirect(postLoginUrl);
    } else {
      res.redirect(postErrorUrl);
    }
  }
};
