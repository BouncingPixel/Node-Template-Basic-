'use strict';

const postLoginUrl = '/';
const postLogoutUrl = '/';
const postErrorUrl = '/login';

module.exports = {
  login: function(req, res) {
    const redirectTo = (req.session.redirectto ? req.session.redirectto : null) || postLoginUrl;
    res.okRedirect({status: true}, redirectTo);
  },

  failedLogin: function(err, req, res, _next) {
    if (!req.wantsJSON) {
      req.flash(err.message);
    }
    res.okRedirect({status: false, error: err}, postErrorUrl);
  },

  token: function(req, res) {
    res.okRedirect({status: true}, postLoginUrl);
  },

  failedToken: function(err, req, res, _next) {
    if (!req.wantsJSON) {
      req.flash(err.message);
    }
    res.okRedirect({status: false, error: err}, postErrorUrl);
  },

  logout: function(req, res) {
    res.okRedirect({status: true}, postLogoutUrl);
  },

  oathPostRedirect: function(req, res) {
    if (req.user) {
      res.redirect(postLoginUrl);
    } else {
      res.redirect(postErrorUrl);
    }
  }
};
