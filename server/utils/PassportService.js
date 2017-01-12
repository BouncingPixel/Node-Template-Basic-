'use strict';

var nconf = require('nconf');
var bluebird = require('bluebird');
var bcrypt = require('bcrypt');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var RememberMeStrategy = require('passport-remember-me').Strategy;

var User = require('../models/User');
var RememberToken = require('../models/RememberToken');
var LoginLocker = require('../models/LoginLocker');

/*
login attempts need to track:
- email
- failed counter
- lockedUntil

if lockedUntil, then don't do anything
else:
  on success, reset failed counter
  on fail, add 1 to failed counter. if it became > threshold, then set lockedUntil = MIN(maxLockTime, ((failCounter - 3) ** 2) * 5)
*/

function generalLogin(req, user, done) {
  if (!user) {
    var invalidError = new Error('Invalid username or password');
    invalidError.status = 401;
    return done(invalidError);
  }

  if (user.isLocked) {
    var bannedError = new Error('User account is locked');
    bannedError.status = 429;
    return done(bannedError);
  }

  req.session.regenerate(function() {
    req.logIn(user, function(err) {
      if (err) { return done(err); }

      // if there's anything specific about the session that needs to be stored
      req.session.startAt = new Date().getTime();
      done();
      return;
    });
  });
}

var PassportController = {

  serializeUser: function(user, done) {
    done(null, JSON.stringify({id: user.id}));
  },

  deserializeUser: function(req, info, done) {
    var obj = JSON.parse(info);

    User.findOne({id: obj.id}, function(err, user) {
      done(err, user);
    });
  },

  loginStrategy: new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, email, password, done) {
    var lowerEmail = email.toLowerCase();

    var userPromise = User.findOne({
      email: lowerEmail,
      role: {$ne: 'noaccess'},
      deactivatedat: null
    });

    var lockerPromise = LoginLocker.findOne({email: lowerEmail});

    bluebird.all([
      userPromise,
      lockerPromise
    ]).spread(function(user, lockInfo) {
      if (lockInfo && lockInfo.lockedUntil && new Date() <= lockInfo.lockedUntil) {
        // do absolutely nothing if locked
        return done(null, false);
      }

      // TODO: add audit log

      var checkPassword = user ? user.password : 'THISISNOTVALIDPASSWORD';
      return bcrypt.compare(password, checkPassword);
    }).then(function(isValid) {
      if (isValid) {
        ret = user;
        if (lockInfo) {
          lockInfo.failedCount = 0;
          return lockInfo.save().then(function() {
            return user;
          });
        } else {
          return user;
        }
      } else {
        if (!lockInfo) {
          lockInfo = new LoginLocker();
        }
        // TODO: can we make this atomic?
        lockInfo.failedCount += 1;

        var maxFailTries = parseInt(nconf.get('maxFailTries'), 10);
        var maxLockTime = parseInt(nconf.get('maxLockTime'), 10);
        if (lockInfo.failedCount > maxFailTries) {
          lockInfo.lockedUntil = Math.min(
            maxLockTime,
            Math.pow(lockInfo.failedCount - maxFailTries, 2) * 5
          );
        }

        return lockInfo.save().then(function() {
          // weird, but we need to return a boolean if they successfully logged in
          // not the user itself
          return false;
        });
      }
    }).then(function(ret) {
      done(null, ret);
    }).catch(done);
  }),

  passwordlessStrategy: new LocalStrategy({
    usernameField: 'email',
    passwordField: 'token',
    passReqToCallback: true
  },
  function(req, email, token, done) {
    var lowerEmail = email.toLowerCase();

    var userPromise = User.findOne({
      email: lowerEmail,
      role: {$ne: 'noaccess'},
      deactivatedat: null,
      tokenexpire: {$gte: new Date()}
    });

    var lockerPromise = LoginLocker.findOne({email: lowerEmail});

    bluebird.all([
      userPromise,
      lockerPromise
    ]).spread(function(user, lockInfo) {
      if (lockInfo && lockInfo.lockedUntil && new Date() <= lockInfo.lockedUntil) {
        // do absolutely nothing if locked
        return done(null, false);
      }

      var checkToken = user ? user.logintoken : 'THISISNOTVALIDPASSWORD';
      return bcrypt.compare(token, checkToken);
    }).then(function(isValid) {
      // we don't mess with the lock out with tokens, but we could
      if (!isValid) {
        return false;
      }

      user.logintoken = null;
      user.tokenexpire = null;
      return user.save().then(function() {
        // weird, but we need to return a boolean if they successfully logged in
        // not the user itself
        return true;
      });
    }).then(function(ret) {
      done(null, ret);
    }).catch(done);
  }),

  rememberMeStrategy: new RememberMeStrategy(function(token, done) {
    RememberToken.consume(token, function(err, userId) {
      if (err) { return done(err); }
      if (!userId) { return done(null, false); }

      return User.findOne({_id: userId}).exec(done);
    });
  },
  function(user, done) {
    RememberToken.generate(user.id, function(err, token) {
      if (err) { return done(err); }
      return done(null, token);
    });
  }),

  // only issues remember-me token if the POST body variable rememberme is "true" (string or boolean)
  issueRememberMe: function(req, res, next) {
    if (!req.user) {
      return next();
    }

    if (req.method.toLowerCase() !== 'post' || !(req.body.rememberme === true || req.body.rememberme === 'true')) {
      return next();
    }

    RememberToken.generate(req.user.id, function(err, token) {
      if (err) {
        return next(err);
      }

      var cookieInfo = {path: '/', httpOnly: true, maxAge: 2 * 7 * 24 * 3600 * 1000};
      if (nconf.get('requireSSL') === true || nconf.get('requireSSL') === 'true') {
        cookieInfo.secure = true;
      }

      res.cookie('remember_me', token, cookieInfo);
      return next();
    });
  },

  login: function(req, res, next) {
    passport.authenticate('local', function(err, user) {
      if (err) {
        return next(err);
      }

      // passport's default behavior is not to prevent session fixation, so we do it ourselves
      generalLogin(req, user, next);
    });
  },

  passwordlessLogin: function(req, res, next) {
    passport.authenticate('passwordless', function(err, user) {
      if (err) {
        return next(err);
      }

      generalLogin(req, user, next);
    });
  },

  logout: function(req, res, next) {
    res.clearCookie('remember_me');
    req.logout();
    req.session.destroy(function() {
      next();
    });
  }

};

module.exports = PassportController;
